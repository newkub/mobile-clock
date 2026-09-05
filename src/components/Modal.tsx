import { onCleanup, onMount, type JSX } from "solid-js";

type ModalProps = {
  onClose: () => void;
  children: JSX.Element;
  /** Extra classes merged onto the dialog panel. */
  panelClass?: string;
  "aria-label"?: string;
};

/**
 * Bottom-sheet modal (centered on sm+ screens).
 * Closes on backdrop tap and Escape key.
 */
export function Modal(props: ModalProps) {
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
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
