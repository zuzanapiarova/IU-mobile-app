#!/bin/bash

# Check if .env exists
echo "==> Checking for EXPO_PUBLIC_API_URL in .env ..."
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found!"
  echo ""
  echo "Please create it and add your backend IP:"
  echo "EXPO_PUBLIC_API_URL=http://<BACKEND_IP>:3000"
  echo ""
  echo "If backend is running locally, find your LAN IP:"
  echo "  Mac:     ipconfig getifaddr en0"
  echo "  Linux:   hostname -I"
  echo "  Windows: ipconfig"
  echo "Otherwise provide IP where the backend is reachable."
  exit 1
fi

# Check if env contains the variable
if ! grep -q "EXPO_PUBLIC_API_URL" "$ENV_FILE"; then
  echo "ERROR: EXPO_PUBLIC_API_URL is missing in .env!"
  echo ""
  echo "Please add your backend IP to .env file:"
  echo "EXPO_PUBLIC_API_URL=http://<BACKEND_IP>:3000"
  echo ""
  echo "If backend is running locally, find your LAN IP:"
  echo "  Mac:     ipconfig getifaddr en0"
  echo "  Linux:   hostname -I"
  echo "  Windows: ipconfig"
  echo "Otherwise provide IP where the backend is reachable. App uses 127.0.0.1:3000 by default."
  exit 1
fi

# Instructions to build the apk
npm install
cd android
./gradlew assembleRelease

echo "==> APK build complete!"
echo "Find it here: android/app/build/outputs/apk/release/app-release.apk"