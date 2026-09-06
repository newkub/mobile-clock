import { onCleanup, onMount, type JSX } from "solid-js";

type ModalProps = {
  onClose: () => void;
  children: JSX.Element;
  /** Extra classes merged onto the dialog panel. */
  panelClass?: string;
  "aria-label"?: string;
};

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getFocusables(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll(FOCUSABLE)).filter((el) => {
    const html = el as HTMLElement;
    if (html.tabIndex < 0) return false;
    const inputLike = el as HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement | HTMLSelectElement;
    return !(inputLike as { disabled?: boolean }).disabled;
  }) as HTMLElement[];
}

/**
 * Bottom-sheet modal (centered on sm+ screens).
 * Closes on backdrop tap, Escape key, and traps Tab focus inside the dialog.
 */
export function Modal(props: ModalProps) {
  let dialogRef: HTMLDivElement | undefined;

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef) return;
      const focusables = getFocusables(dialogRef);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);

    // Focus the first focusable element on open for keyboard users.
    const focusables = getFocusables(dialogRef!);
    if (focusables.length) {
      const focused = document.activeElement as HTMLElement;
      if (!dialogRef!.contains(focused)) {
        focusables[0].focus();
      }
    }

    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  const onBackdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) props.onClose();
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onBackdrop}
    >
      <div
        ref={(el) => { dialogRef = el; }}
        role="dialog"
        aria-modal="true"
        aria-label={props["aria-label"]}
        class={`w-full max-w-md rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl ${props.panelClass ?? ""}`}
      >
        {props.children}
      </div>
    </div>
  );
}
