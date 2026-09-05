import { ErrorBoundary as SolidErrorBoundary, type JSX } from "solid-js";
import { Button } from "./Button";
import { haptic } from "../lib/capacitor";

interface Props {
  children: JSX.Element;
}

function reload() {
  window.location.reload();
}

function resetAndReload() {
  try {
    localStorage.removeItem("wrikka-mobile-store");
  } catch {
    // ignore
  }
  haptic("warning");
  window.location.reload();
}

export function ErrorBoundary(props: Props) {
  return (
    <SolidErrorBoundary
      fallback={(_err, _reset) => (
        <div class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <h1 class="mb-2 text-2xl font-bold text-text">Something went wrong</h1>
          <p class="mb-6 text-sm text-muted">An unexpected error occurred.</p>
          <div class="flex gap-3">
            <Button onClick={reload} aria-label="Reload app">
              Reload
            </Button>
            <Button onClick={resetAndReload} variant="secondary" aria-label="Reset data and reload">
              Reset data & reload
            </Button>
          </div>
        </div>
      )}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}
