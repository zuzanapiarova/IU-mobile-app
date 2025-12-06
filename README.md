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
   If no value is provided, default database dev.db with test data is used

##### Running via npm
1. Navigate to the backend/ directory
   `cd backend`

2. Provide DATABASE_URL in .env file to create the database file (optional), if not provided, default database dev.db with test data is used
   `DATABASE_URL="file:./test-file.db"`

3. npm start 

### Frontend

Frontend can be started either by building and running the executable file for the desired environment (android/ios), or via Expo Go app, used especially during development and testing.

<!-- The built executable is available  -->

##### Manually build and run the executable

1. Navigate to the frontend/ directory
   `cd frontend`

2. Install dependencies
   `npm install`

3. Edit the EXPO_PUBLIC_API_URL in .env file to point to the LAN IP where the backend is running. 
   Find LAN IP of the device running backend:"
   - Mac:     ipconfig getifaddr en0"
   - Linux:   hostname -I"
   - Windows: ipconfig"
   `EXPO_PUBLIC_API_URL=http://192.168.0.1:3000`
   Also ensure the mobile device is connected to teh same LAN as the device running the backend

4. If not present, generate the android and ios folders with the following command and change to desired directory
   `npx expo prebuild`
   `cd android`

5. Build the executable, it will then be available in frontend/android/app/build/outputs/apk/release/app-release.apk. Java Runtime is needed for this operation. 
   `./gradlew assembleRelease`

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