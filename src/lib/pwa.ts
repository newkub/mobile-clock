import { createSignal } from "solid-js";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const [installPrompt, setInstallPrompt] = createSignal<BeforeInstallPromptEvent | null>(null);

export function initPwaInstall() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    setInstallPrompt(e as BeforeInstallPromptEvent);
  });
}

export function getInstallPrompt() {
  return installPrompt;
}

export async function promptInstall(): Promise<boolean> {
  const p = installPrompt();
  if (!p) return false;
  p.prompt();
  const { outcome } = await p.userChoice;
  if (outcome === "accepted") setInstallPrompt(null);
  return outcome === "accepted";
}
