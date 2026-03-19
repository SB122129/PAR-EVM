# PAR-EVM

PAR-EVM is a multi-part project that combines a mobile/web Expo application with backend and supporting modules.

## What This Repository Contains

- `Frontend/`
- `Backend/`
- `Git profile page/`

Primary app source is in:

- `Frontend/portal-app-master/portal-app-master`

## App Features

- Onboarding flow for new and existing users
- Secure local profile and app lock support
- Wallet and identity management screens
- EVM Vault experience
- Activity feed and activity details
- Tickets and subscriptions flows
- QR and NFC based interaction screens
- Relay and remote signing screens
- Web support through Expo Router

## Tech Stack

- Expo + React Native + TypeScript
- Expo Router for navigation
- Biome for linting and formatting
- Jest for testing

## Prerequisites

Install these before running:

- Node.js 18+
- npm 9+
- Expo CLI (optional if using `npx expo`)

Optional for native builds:

- Android Studio (Android)
- Xcode (iOS on macOS)

## How To Run

### 1) Go to the app folder

```bash
cd Frontend/portal-app-master/portal-app-master
```

### 2) Install dependencies

```bash
npm install
```

### 3) Start the Expo development server

```bash
npm run start:expo
```

### 4) Run web target

```bash
npm run start:web
```

## Useful Scripts

Run these from `Frontend/portal-app-master/portal-app-master`.

- `npm run start:expo` - start Expo dev server
- `npm run start:web` - run web target with cache clear
- `npm run android` - run Android app (includes checks)
- `npm run ios` - run iOS app (includes checks)
- `npm run typecheck` - run TypeScript checks
- `npm run lint` - run Biome lint
- `npm run format` - format code with Biome
- `npm run test` - run Jest tests

## Notes

- If Metro or Expo cache causes issues, run with clear cache:

```bash
npx expo start --clear
```

- If you only want web local dev:

```bash
npx expo start --clear --web --port 8082
```

## License

See license files in subprojects for details.
