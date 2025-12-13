# ONE PLACE
## HABIT TRACKING MOBILE APP

## Run the app

### Backend

Backend is a containerized application with all of its dependencies. It can be started with the provided docker compose file, or via npm for development or testing.  

##### Running the containerized application

1. Navigate to the backend/ directory
   `cd backend`

2. Build and run the backend container
   `docker compose up --build`

3. Control database file with DATABASE_URL environment variable in the docker-compose.ysml file
   If no value is provided, default database dev.db with test data is used.

##### Running via npm
1. Navigate to the backend/ directory
   `cd backend`

2. Provide DATABASE_URL in .env file to create the database file (optional), if not provided, default database dev.db with test data is used
   `DATABASE_URL="file:./test-file.db"`

3. npm start 

### Frontend

Frontend can be started either by building and running the executable file for the desired environment (android/ios), or simply start it via Expo Go app, used especially during development and testing.

#### Prerequisites

- Java 17 (Android build system only supports Java 17 now): `brew install --cask temurin@17` 
- Android Command Line Tools: `brew install --cask android-commandlinetools`
- Set path of androif sdk tools: 
`export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk`
`export ANDROID_HOME=$ANDROID_SDK_ROOT`
- Manually install the SDK (since casks do not):
`mkdir -p "$ANDROID_SDK_ROOT"`
`sdkmanager --install "platform-tools" "platforms;android-36" "build-tools;36.0.0"`


##### Manually build and run the executable

Using Expo's interface for builds. Prerequisites are Expo account, which is free for android builds.
`npm install`
`npx eas build:configure`
`npx eas build`

If you want to get entangled in the dependency hell, please, use the following commands to generate the executable. However, for your own peace of mind, I suggest using the Expo GO approach when running locally. 

1. Navigate to the frontend/ directory
   `cd frontend`

2. Install dependencies
   `npm install`

3. Edit the EXPO_PUBLIC_API_URL in .env file to point to the LAN IP where the backend is running. 
   Find LAN IP of the device running backend:"
   - Mac:     ipconfig getifaddr en0
   - Linux:   hostname -I"
   - Windows: ipconfig"
   `EXPO_PUBLIC_API_URL=http://192.168.x.y:3000`
   Ensure the mobile device is connected to teh same LAN as the device running the backend

4. If not present, generate the android folder with the following command and change to created directory
   `npx expo prebuild --platform android`
   `cd android`

5. Then run the build:
   `./gradlew assembleRelease`

Executable will then be available in `frontend/android/app/build/outputs/apk/release/app-release.apk.`

6. Copy the APK to an Android device or emulator and launch it

##### Use the Expo App

1. Download the Expo GO application into the device

2. Ensure the mobile device is connected to teh same LAN as the computer on which the backend runs 

3. Run `npm start`

4. Scan the generated QR code and use the app

### TESTS

Test are available for the frontend components, especially the ones making calls to the backend, and the backend server endpoints. 

#### Frontend tests

`cd frotend`
`npm run test`

#### Backnd tests

`cd backend`
`npm run test`