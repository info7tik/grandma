# GrandMa
This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 18.1.4.

## Screenshots
in progress...

## Development server
To start a local development server, run:
```bash
npm start
```
Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Running unit tests
To execute unit tests with the [karma](https://karma-runner.github.io/latest/index.html) test runner, use the following command:
```bash
npm run test
```

## Android (Capacitor) quickstart
This app is built with the Angular framework. In this section, we install the application on android phones but you can install it on ios phones (see https://capacitorjs.com/docs/ios).

### Build and install on the connected phone
To build the android app and install it over the connected phone, run the script [build-and-install.sh](./tools/build-and-install.sh):
```bash
bash tools/build-and-install.sh
```

### Step by step
- On my Ubuntu system, I need to define the ANDROID_HOME variable:
```bash
export ANDROID_HOME=/home/info7tik/Android/Sdk/
```

- Build web assets:
```bash
npm run build
```

- Sync to Android project:
```bash
npx cap sync android
```

- Build debug APK via CLI:
```bash
cd android && ./gradlew assembleDebug
```

- **Or** open Android Studio:
```bash
npx cap open android
```

APK output: `android/app/build/outputs/apk/debug/app-debug.apk`.

Run on a device:
- Enable USB debugging, connect device, then:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Update the application icon
```bash
npx capacitor-assets generate --assetPath src/assets/icon --android
```

## Icons used in the application are from [flaticon.com](https://www.flaticon.com/free-icons/open-source)
The authors of the icons are:
* [adrly](https://www.flaticon.com/authors/adrly)
* [zero-wing](https://www.flaticon.com/authors/zero-wing)
* [hidemaru](https://www.flaticon.com/authors/hidemaru)
* [freepik](https://www.flaticon.com/authors/freepik)
* [ilham-fitrotul-hayat](https://www.flaticon.com/authors/ilham-fitrotul-hayat)