import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.newkub.mobileclock",
  appName: "Wrikka Clock",
  webDir: "dist",
  server: {
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#0b0b13",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0b13",
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#6366f1",
      sound: "bell.wav",
    },
  },
};

export default config;
