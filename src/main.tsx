import { render } from "solid-js/web";
import "uno.css";
import "./theme.css";
import "./index.css";
import App from "./App";
import { initCapacitor } from "./lib/capacitor";
import { requestNotificationPermission } from "./lib/notifications";
import { initPwaInstall } from "./lib/pwa";
import { syncTheme, syncMotionPreference } from "./lib/theme";

initCapacitor().catch(() => null);

requestNotificationPermission().catch(() => null);

// Apply persisted theme before first paint and listen for OS changes.
syncTheme();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => syncTheme());

// Respect reduced-motion OS preference.
syncMotionPreference();
window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => syncMotionPreference());

// Register service worker for PWA notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => null);
    initPwaInstall();
  });
}

// The web alarm/reminder notification watcher is driven by a createEffect in
// App.tsx, which re-arms it whenever appStore.alarms/reminders change.

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
} else {
  // eslint-disable-next-line no-console
  console.error("Root element not found");
}
