import { exportAppData, importAppData, resetAllData } from "../store/app";
import { haptic } from "../lib/capacitor";
import { showStatus } from "../lib/status";
import { Button } from "./Button";
import { getInstallPrompt, promptInstall } from "../lib/pwa";
import { Show } from "solid-js";

export function SettingsDataSection() {
  let fileInput: HTMLInputElement | undefined;

  function downloadData() {
    const blob = new Blob([exportAppData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wrikka-clock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    haptic("success");
    showStatus("Backup downloaded", "success");
  }

  function onImportFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importAppData(String(reader.result));
      showStatus(ok ? "Backup restored" : "Invalid backup file", ok ? "success" : "error");
      if (ok) haptic("success");
    };
    reader.readAsText(file);
    input.value = "";
  }

  async function installApp() {
    const ok = await promptInstall();
    showStatus(ok ? "App installed" : "Install dismissed", ok ? "success" : "info");
  }

  return (
    <section class="space-y-5">
      <h3 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-secondary">
        <span class="i-mdi-database h-4 w-4" /> Data
      </h3>
      <div class="space-y-3 rounded-2xl bg-surface-2 p-4">
        <p class="text-xs text-text-secondary">Export your local data as a JSON backup or restore from a previous export.</p>
        <div class="flex gap-2">
          <Button onClick={downloadData} class="flex-1" size="sm" aria-label="Export data">
            <span class="i-mdi-download h-4 w-4" /> Export
          </Button>
          <Button onClick={() => fileInput?.click()} variant="secondary" class="flex-1" size="sm" aria-label="Import data">
            <span class="i-mdi-upload h-4 w-4" /> Import
          </Button>
          <input
            type="file"
            accept="application/json"
            class="hidden"
            onInput={onImportFile}
            ref={(el) => { fileInput = el; }}
            aria-label="Upload backup file"
          />
        </div>
      </div>

      <div class="space-y-3 rounded-2xl border border-danger/30 bg-surface-2 p-4">
        <p class="text-xs text-text-secondary">Delete all local data (alarms, habits, history, settings) and start fresh. Cloud data is not deleted.</p>
        <Button
          onClick={() => {
            if (!window.confirm("Delete all local data? This cannot be undone.")) return;
            haptic("heavy");
            resetAllData();
          }}
          variant="secondary"
          size="sm"
          class="w-full border-danger/40 text-danger hover:bg-danger/10"
          aria-label="Reset all data"
        >
          <span class="i-mdi-delete-forever h-4 w-4" /> Reset all data
        </Button>
      </div>

      <Show when={getInstallPrompt()}>
        <div class="space-y-3 rounded-2xl bg-surface-2 p-4">
          <p class="text-xs text-text-secondary">Install Wrikka Clock to your home screen for quick access.</p>
          <Button onClick={installApp} size="sm" class="w-full" aria-label="Install app">
            <span class="i-mdi-cellphone-arrow-down h-4 w-4" /> Install app
          </Button>
        </div>
      </Show>
    </section>
  );
}
