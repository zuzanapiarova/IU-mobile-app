# ONE PLACE
## HABIT TRACKING APP


#### Project structure
```
project-root/
 ├─ frontend/    Expo React Native app
 └─ backend/     Express + Prisma API
```
A pre-seeded SQLite database with test user (dev.db) is included. Use credentials name: zuzka@gmail.com, passsword: abcdef
Do not run migrations unless you want to reset it.

### FRONTEND 

The mobile app was created using [Expo](https://docs.expo.dev/).

This project uses [file-based routing](https://docs.expo.dev/router/introduction).

Expo Go was used during development. It provides options to open the app interactively.
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

#### To view the mobile app with Expo GO:

1. Install Expo Go on your phone [(iOS/Android)](https://expo.dev/go)

2. Start the backend (instructions below)

3. Start the frontend

`cd frontend`
`npm install`
`npx expo start`

4. Scan the QR code shown in the terminal/browser

#### To build the mobile app into APK:

1. Ensure the devide running the backend and the phone are on the same Wi-Fi network

2. Set the API url .env in the backend
`ipconfig getifaddr en0` on Linux/Mac
`ipconfig` on Windows
`API_URL=http://192.168.1.23:3000`
Localhost works only if the app is opened on an emulator (or with Expo Go). Otherwise for running APK, provide LAN IP OF THE DEVICE RUNNING THE BACKEND

3. Build the apk

`cd frontend`
`npm install`
`npx expo build:android`

### BACKEND 

The backend exposes a REST API consumed by the mobile app.
It uses SQLite for easy local evaluation—no setup required.

Following file contains test users populated with habit data
`backend/prisma/dev.db`

1. Start the backend
`npm start`

Networking preconditions to ensure it runs smoothly:

1. Backend is listening on all interfaces

2. `
`app.listen(3000, "0.0.0.0", () => console.log("Server running"));`
Not just localhost.

3. Ensure firewall allows incoming traffic and does not block port 3000


4. APK has Internet permission (React Native / Expo standalone builds include this by default)

5. Android 9+ needs cleartext allowed.

Add in AndroidManifest.xml or Expo config:
```
"android": {
  "usesCleartextTraffic": true
}
```
Otherwise HTTPS is required.

6. Cors on backend must allow the app domain or * during testing
`app.use(cors({ origin: "*" }));`

#### To start the backend:

1. 


⚠️ 