import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Android build.
 * - appId: unique package id on Google Play (cannot be changed later!)
 * - appName: name shown under the icon on the phone
 * - webDir: the folder produced by `npm run build`
 */
const config: CapacitorConfig = {
  appId: "az.retrokend.game",
  appName: "Retro Kənd",
  webDir: "dist",
  android: {
    // the game is fully offline; nothing is loaded from the network
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  // keeps the WebView from showing scroll bounce around the pixel canvas
  backgroundColor: "#0d0c1c",
};

export default config;
