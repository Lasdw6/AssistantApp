import 'dotenv/config';
import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: "app",
  slug: "app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  // @ts-ignore: newArchEnabled might not be in the type definition yet
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    package: "com.lasdw.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    // @ts-ignore: edgeToEdgeEnabled might not be in the type definition yet
    edgeToEdgeEnabled: true,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE"
    ],
    usesCleartextTraffic: true
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    apiUrl: process.env.API_URL || "http://localhost:8000",
    eas: {
      projectId: "965a3a5f-dbba-40ec-aa3e-5022d542d3f1"
    }
  }
};

export default { expo: config };
