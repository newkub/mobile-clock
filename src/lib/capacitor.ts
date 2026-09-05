import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Haptics, NotificationType, ImpactStyle } from "@capacitor/haptics";
import { Capacitor } from "@capacitor/core";

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initCapacitor() {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0b0b13" });
    await SplashScreen.hide();

    CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) SplashScreen.hide();
    });

    // back button uses default Android behavior (exit app)
  } catch {
    // ignore on web / missing plugins
  }
}

export async function haptic(type: "light" | "medium" | "heavy" | "success" | "warning" | "error") {
  if (!isNative()) return;
  try {
    if (type === "success" || type === "warning" || type === "error") {
      await Haptics.notification({
        type: type === "success" ? NotificationType.Success : type === "warning" ? NotificationType.Warning : NotificationType.Error,
      });
    } else {
      await Haptics.impact({
        style: type === "light" ? ImpactStyle.Light : type === "medium" ? ImpactStyle.Medium : ImpactStyle.Heavy,
      });
    }
  } catch {
    // ignore
  }
}
