# WatchDog frontend

The WatchDog mobile application uses Expo SDK 57, React Native, and Expo Router.

## Development

Install dependencies from this directory:

```bash
npm install
```

### Android development build

This project uses a local Android development build. It does not require EAS Build or an Expo cloud build.

Install these local prerequisites first:

- JDK 17
- Android Studio
- Android SDK Platform 36 and Android SDK Build-Tools
- Android SDK Platform-Tools (`adb`)

For a physical Android phone, enable Developer options and USB debugging, connect it by USB, and confirm that it appears with:

```bash
adb devices
```

Compile, install, and launch the WatchDog development app locally:

```bash
npx expo run:android --device
```

After the first local build, start Metro for normal JavaScript, TypeScript, and UI work with:

```bash
npx expo start --dev-client
```

Open the installed **WatchDog** app, not Expo Go. Normal UI changes will reload through Metro without recompiling the native app. Run `npx expo run:android --device` again after changing native libraries or native app configuration.

Application routes live in `src/app`, while shared UI and feature code live under `src`.

Refer to the [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) when changing Expo configuration or native behavior.
