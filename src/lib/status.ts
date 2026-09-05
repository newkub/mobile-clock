import { appStore, setStatus, clearStatus } from "../store/app";

export function showStatus(text: string, type: "info" | "success" | "warning" | "error" = "info") {
  if (appStore.globalSettings.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(type === "error" ? [50, 50, 50] : type === "success" ? 60 : 30);
    } catch {
      // ignore
    }
  }
  setStatus({ text, type });
  setTimeout(() => clearStatus(), 3000);
}
