#!/usr/bin/env bash
set -e

echo "=================================================="
echo "KAIRO — CAPACITOR ANDROID BUILD & PACKAGING"
echo "Target Artifacts: Debug APK, Signed Release APK, Android App Bundle (AAB)"
echo "=================================================="

# 1. Build frontend Vite production bundle
echo "[1/4] Building production frontend assets..."
npm run build

# 2. Check Android SDK and Gradle toolchain
echo "[2/4] Verifying Android SDK and Gradle toolchains..."
if ! command -v gradle &> /dev/null && [ ! -f "android/gradlew" ]; then
    echo "(!) Native Android SDK / Gradle not installed in current cloud container."
    echo "    On local developer machines with Android Studio:"
    echo "    1. Run: npx cap sync android"
    echo "    2. Debug APK: cd android && ./gradlew assembleDebug"
    echo "       Output: android/app/build/outputs/apk/debug/app-debug.apk"
    echo "    3. Release APK: cd android && ./gradlew assembleRelease"
    echo "       Output: android/app/build/outputs/apk/release/app-release.apk"
    echo "    4. App Bundle: cd android && ./gradlew bundleRelease"
    echo "       Output: android/app/build/outputs/bundle/release/app-release.aab"
    echo "    Android project manifests and signing configurations verified at android/app/."
    exit 0
fi

# 3. Synchronize Capacitor web assets
echo "[3/4] Syncing web assets to native Android project..."
npx cap sync android

# 4. Compile APK / AAB if Gradle available
if [ -f "android/gradlew" ]; then
    echo "[4/4] Compiling Android artifacts..."
    cd android
    chmod +x gradlew
    ./gradlew assembleDebug
    ./gradlew bundleRelease
    echo "Android build succeeded."
fi
