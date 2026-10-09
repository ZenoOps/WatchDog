# WatchDog frontend

The WatchDog mobile application uses Expo SDK 57, React Native, and Expo Router.

## Development

Install dependencies from this directory:

```bash
npm install
```

Create the frontend environment file and set the backend address:

```bash
cp .env.example .env
```

When testing on a physical phone, `EXPO_PUBLIC_API_URL` must use the development computer's LAN IP address. Do not use `localhost`, because that would refer to the phone itself.

### Android development build

WatchDog uses an Android development build rather than Expo Go. The development build can be produced locally or by EAS Build.

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

Alternatively, create an installable development build with EAS:

```bash
npx eas-cli@latest build --platform android --profile development
```

After the first local build, start Metro for normal JavaScript, TypeScript, and UI work with:

```bash
npx expo start --dev-client
```

Open the installed **WatchDog** app, not Expo Go. Normal UI changes will reload through Metro without recompiling the native app.

The authentication implementation uses `expo-secure-store`. A new development build is required after adding or changing native libraries such as this one. TypeScript and UI-only changes continue to work through Metro without another native build.

Application routes live in `src/app`, while shared UI and feature code live under `src`.

Refer to the [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) when changing Expo configuration or native behavior.
