# Android Network Debugging for React Native/Expo App

## Problem

- The app could not connect to the backend API from the Android APK build.
- All network requests (Axios/fetch) to `http://3.232.15.86` failed with a generic `Network Error`.
- The HealthModal diagnostics and NetworkTest component confirmed that basic internet worked, but API requests failed.

## What Was Tried (and Did Not Work)

- Verified `android.permission.INTERNET` and `ACCESS_NETWORK_STATE` were present in `AndroidManifest.xml`.
- Set `usesCleartextTraffic: true` in `app.config.js` and in the manifest.
- Checked for double slashes in URLs and sanitized all API endpoints.
- Added detailed error output and diagnostics to the app UI.
- Confirmed backend was running and accessible from other devices/browsers.
- Tried both HTTP and HTTPS URLs.

## What Actually Worked

- **Added the following attributes to the `<application>` tag in `AndroidManifest.xml`:**
  ```xml
  android:networkSecurityConfig="@xml/network_security_config"
  android:usesCleartextTraffic="true"
  ```
- **Created the file:** `app/android/app/src/main/res/xml/network_security_config.xml` with:
  ```xml
  <?xml version="1.0" encoding="utf-8"?>
  <network-security-config>
      <domain-config cleartextTrafficPermitted="true">
          <domain includeSubdomains="true">3.232.15.86</domain>
          <domain includeSubdomains="true">localhost</domain>
          <domain includeSubdomains="true">10.0.2.2</domain>
      </domain-config>
      <base-config cleartextTrafficPermitted="true">
          <trust-anchors>
              <certificates src="system"/>
          </trust-anchors>
      </base-config>
  </network-security-config>
  ```
- **Rebuilt the APK and reinstalled it on the device/emulator.**

## Root Cause

- **Android 9+ blocks all cleartext (HTTP) traffic by default.**
- Even with `usesCleartextTraffic: true` in Expo config, the native manifest and network security config must explicitly allow HTTP for your domain.
- Without these, all HTTP requests will fail with a generic network error, even if the server is reachable.

## Key Takeaways

- Always add both `android:networkSecurityConfig` and `android:usesCleartextTraffic` to the `<application>` tag for HTTP APIs.
- Always create a `network_security_config.xml` file listing your backend domains.
- Rebuild the APK after making these changes.
- Use in-app diagnostics to confirm the exact error and URL being called.

---

**This fix is required for all React Native/Expo Android apps that need to access HTTP (not HTTPS) APIs.**
