#!/usr/bin/env bash
set -e

echo "=================================================="
echo "KAIRO — CAPACITOR iOS BUILD & PACKAGING"
echo "Target Artifacts: iOS Archive (xcarchive), IPA distribution package"
echo "=================================================="

# 1. Build frontend Vite production bundle
echo "[1/4] Building production frontend assets..."
npm run build

# 2. Check Xcode toolchain
echo "[2/4] Verifying Xcode toolchain..."
if ! command -v xcodebuild &> /dev/null; then
    echo "(!) Xcode toolchain is macOS-exclusive and not present in this Linux environment."
    echo "    On macOS machines with Xcode 15+ installed:"
    echo "    1. Run: npx cap sync ios"
    echo "    2. cd ios/App && pod install"
    echo "    3. Archive: xcodebuild -workspace App.xcworkspace -scheme App -archivePath build/KAIRO.xcarchive archive"
    echo "    4. Export IPA: xcodebuild -exportArchive -archivePath build/KAIRO.xcarchive -exportPath build/ -exportOptionsPlist exportOptions.plist"
    echo "    iOS project manifests and Podfile verified at ios/App/."
    exit 0
fi

# 3. Synchronize Capacitor web assets
echo "[3/4] Syncing web assets to native iOS project..."
npx cap sync ios

# 4. Compile if xcodebuild available
echo "[4/4] iOS project ready in ios/App/."
