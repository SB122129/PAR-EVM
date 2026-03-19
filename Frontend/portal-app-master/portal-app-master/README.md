# Portal App

![Portal App](https://github.com/PortalTechnologiesInc/.github/raw/main/profile/logoFull.png?raw=true)

Portal is a mobile identity wallet for secure authentication and payments using the [Nostr](https://nostr.com) protocol. Built with React Native and Expo, it puts you in complete control of your digital identity and personal data with enterprise-grade security.

## 🚀 Quick Start for Partner Developer

This section is for the trusted partner developer to quickly set up and run the app, make UI changes, and see them in action.

### Setup and Run
1. **Unzip the folder** and navigate to the project directory.

2. **Sign in to Expo**:
   ```bash
   expo login
   ```

3. **Start the development server**:
   ```bash
   npm run start
   ```
   This will start the Expo development server.

4. **Run on device/simulator**:
   - **For quick UI testing with hot reload**: Install Expo Go on your device, scan the QR code shown in the terminal.
   - **For full developer build**:
     - Android: `npm run android`
     - iOS: `npm run ios`

### Making UI Changes
- Edit the code in the `app/` directory (for screens) or `components/` directory (for reusable components).
- For UI changes, use Expo Go for instant hot reload.
- If using developer build, rebuild the app after changes: `npm run android` or `npm run ios`.
- Changes will be visible immediately in the app on your device/simulator.

### Notes
- The app uses TypeScript and Biome for linting/formatting.
- Run `npm run check` to check for issues.
- For production builds, use `npm run android-release`.

## ✨ Features

### 🔐 Authentication & Identity

- **Nostr Authentication**: Cryptographically secure authentication with websites and services
- **Biometric Security**: Face ID, Touch ID, and fingerprint authentication
- **Secure Key Management**: Private keys never leave your device
- **Identity Management**: Complete control over your digital identity

### 💳 Payments & Subscriptions

- **Lightning Payments**: One-time Bitcoin Lightning Network payments
- **Cashu/eCash Support**: Native Cashu token support for eCash payments and transactions
- **Subscription Management**: Monitor and control recurring payments
- **Payment Status Tracking**: Real-time payment status with Revolut-style UI
- **Wallet Integration**: Seamless NWC (Nostr Wallet Connect) integration

### 📱 User Experience

- **Activity Dashboard**: Comprehensive tracking of all authentications and payments
- **QR Code Scanner**: Quick authentication and payment initiation
- **NFC Scanning**: Contactless NFC tag scanning for authentication and ticket validation
- **Ticket Management**: Digital ticket storage, validation, and recovery
- **Dark/Light Theme**: Adaptive theme system with system preference support
- **Intuitive Navigation**: Tab-based navigation with detailed activity views

### 🔒 Security & Privacy

- **Local Storage**: All sensitive data stored securely on device
- **Biometric Protection**: Additional security layer for sensitive operations
- **No Data Sharing**: Zero personal data shared without explicit consent
- **Cryptographic Verification**: All operations cryptographically verified

## 🛠 Technology Stack

### Core Technologies

- **[React Native](https://reactnative.dev/)** - Cross-platform mobile development (New Architecture enabled)
- **[Expo](https://expo.dev/)** SDK 53 - Development platform and SDK
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development with strict mode
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based navigation with typed routes

### Storage & Security

- **[Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)** - Local database storage with migrations
- **[Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)** - Secure key storage
- **[Expo LocalAuthentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)** - Biometric authentication

### Nostr & Payments

- **[Nostr Protocol](https://nostr.com)** - Decentralized identity and messaging
- **[Custom Rust lib](https://github.com/PortalTechnologiesInc/lib)** - Core Nostr logic and cryptography (via UniFFI bindings)
- **NWC Integration** - Nostr Wallet Connect for Lightning payments
- **[Breez SDK](https://breez.technology/sdk/)** - Lightning Network payments

### UI & Tooling

- **[Lucide React Native](https://lucide.dev/)** - Icon library
- **[Biome](https://biomejs.dev/)** - Linting and formatting
- **[Bun](https://bun.sh/)** - Package manager
- **[Husky](https://typicode.github.io/husky/)** + **lint-staged** - Git hooks

## 🧰 Development Environment

### Nix DevShell

This project uses [Nix flakes](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-develop.html) to provide a reproducible development environment. Running `nix develop` gives you:

- **Node.js** - JavaScript runtime (required by Metro/Expo)
- **Bun** - Package manager
- **OpenJDK 17** - For Android Gradle builds
- **Android SDK** - Build tools, platform, NDK
- **Biome** - Linting and formatting
- **Expo CLI** - Expo development tools
### Git Hooks

The project uses Husky for Git hooks, installed automatically on `bun install`:

- **pre-commit**: Runs lint-staged which applies `biome check --write` on staged files (auto-fixes formatting and import sorting)
- **pre-push**: Runs `typecheck` and `check` on the full project to ensure quality before pushing

These same checks run in CI, so if your push passes locally, it passes in CI.

## 🚀 Getting Started

### Prerequisites

- **[Nix](https://nixos.org/download/)** with flakes enabled
- **iOS Simulator** (Mac) or **Android Studio** (for emulators)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/PortalTechnologiesInc/Portal-App.git
   cd Portal-App
   ```

2. **Enter the Nix development shell**:

   ```bash
   nix develop
   ```

   This provides Node.js, Bun, Android SDK, Java, and all required tooling.

3. **Install dependencies**:

   ```bash
   bun install
   ```

4. **Start the development server**:

   ```bash
   bun run start
   ```

5. **Run on device/simulator**:

   ```bash
   # Android
   bun run android

   # iOS (macOS only)
   bun run ios
   ```

## 📱 Usage Guide

### First-Time Setup

1. **Generate Identity**: Create a new Nostr private key or import existing seed phrase/nsec
2. **Set PIN**: Configure a PIN for app lock
3. **Profile Configuration**: Set up your identity information
4. **Wallet Connection**: Connect your NWC-compatible Lightning wallet

### Authentication Flow

1. **Scan QR Code or NFC Tag**: Use built-in scanner or NFC reader from website or service
2. **Review Request**: Examine authentication details and permissions
3. **Biometric Confirmation**: Confirm with Face ID/Touch ID
4. **Approve/Deny**: Complete the authentication process

### Payment Management

1. **Payment Requests**: Review incoming payment requests (Lightning or Cashu)
2. **Status Tracking**: Monitor payment progress with real-time updates
3. **Subscription Control**: Manage recurring payments and subscriptions
4. **Ticket Management**: Store, validate, and recover digital tickets via NFC
5. **Activity History**: View complete payment and authentication history

## 🏗 Project Architecture

### Directory Structure

```
portal-app/
├── app/                       # Expo Router pages (file-based routing)
│   ├── (tabs)/                # Tab navigation screens
│   │   ├── index.tsx          # Home screen
│   │   ├── Activities.tsx
│   │   ├── Subscriptions.tsx
│   │   ├── Tickets.tsx
│   │   ├── Wallet.tsx
│   │   └── Settings.tsx
│   ├── (onboarding)/          # First-time setup flow
│   │   ├── generate/          # Key generation
│   │   └── import/            # Key import (mnemonic/nsec)
│   ├── activity/[id]/         # Dynamic activity detail pages
│   ├── subscription/[id]/     # Subscription management
│   ├── breezwallet/           # Breez wallet pay/receive
│   ├── nfc/                   # NFC scanner flow
│   ├── qr/                    # QR scanner flow
│   ├── wallet.tsx             # Wallet management
│   ├── relays.tsx             # Nostr relay configuration
│   ├── error.tsx              # Error boundary
│   └── [...deeplink].tsx      # Deep link catch-all
├── components/                # Reusable UI components
│   ├── ActivityDetail/        # Activity-specific components
│   ├── onboarding/            # Onboarding-specific components
│   └── ui/                    # Base UI components
├── context/                   # React Context providers
├── services/                  # Core business logic
├── hooks/                     # Custom React hooks
├── models/                    # TypeScript interfaces
├── constants/                 # App constants and configuration
├── utils/                     # Helper functions and utilities
├── migrations/                # SQLite database migrations
├── plugins/                   # Custom Expo config plugins
├── scripts/                   # Build and device management scripts
├── debug-scripts/             # Database debugging tools
└── .github/workflows/         # CI/CD pipeline
```

### State Management

- **Context-based Architecture**: Multiple specialized contexts for different domains
- **SQLite Database**: Persistent storage for activities, subscriptions, and user data
- **Secure Storage**: Encrypted storage for sensitive keys and tokens

## 🔧 Development

### Available Scripts

```bash
# Development (runs typecheck + lint first)
bun run start
bun run android
bun run android-release
bun run ios

# Type checking
bun run typecheck

# Linting and formatting (Biome)
bun run lint                   # lint only
bun run check                  # lint + format
bun run check:strict           # lint + format, warnings as errors
bun run check:fix              # lint + format with auto-fix
bun run format                 # format with auto-write
bun run format:check           # format check only

# Testing
bun run test                   # Jest unit tests (watch mode)
```

### Key Development Patterns

#### Theme-Aware Components

```typescript
import { useThemeColor } from '@/hooks/useThemeColor';

const backgroundColor = useThemeColor({}, 'background');
const textColor = useThemeColor({}, 'textPrimary');
```

#### Database Operations

```typescript
import { DatabaseService } from '@/services/DatabaseService';
import { useSQLiteContext } from 'expo-sqlite';

const db = useSQLiteContext();
const dbService = new DatabaseService(db);
```

#### Biometric Authentication

```typescript
import { BiometricAuthService } from '@/services/BiometricAuthService';

const authResult = await BiometricAuthService.authenticate();
```

### Adding New Features

1. **Create Components**: Add to appropriate directory in `components/`
2. **Update Context**: Extend existing or create new context providers
3. **Database Schema**: Update database migrations in `migrations/`
4. **Type Definitions**: Add interfaces to `models/` directory
5. **Navigation**: Add routes in `app/` directory following Expo Router conventions

## 📦 Building & Deployment

### Local Builds

The project is fully self-managed — no cloud build services. Build scripts handle APK/IPA creation and device installation:

```bash
# Build Android APK (release)
bash scripts/build-android-apk.sh release

# Build and install on connected Android device/emulator
bash scripts/install-android-apk.sh

# Build iOS app (macOS only)
bash scripts/build-ios-ipa.sh

# Install on iOS Simulator
bash scripts/install-ios-ipa.sh
```

### Reproducible Nix Build

For fully reproducible Android builds:

```bash
nix build .#android-bundle
```

This produces a signed AAB bundle using hermetic Nix derivations.

## 🤝 Contributing

1. **Fork the repository**
2. **Enter Nix shell**: `nix develop`
3. **Install dependencies**: `bun install`
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Make changes** — Git hooks will auto-lint staged files on commit
6. **Push to branch**: `git push origin feature/amazing-feature` (pre-push runs full typecheck + lint)
7. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: All new code must be written in TypeScript with strict mode
- **Theme Support**: All components must support dark/light themes
- **Biome**: Code must pass `bun run check` (enforced by Git hooks and CI)
- **Security First**: Follow secure coding practices, especially for key management
- **Expo Router**: Follow file-based routing conventions for new screens
- **Context Usage**: Use appropriate context providers for state management

## 📄 License

This project is licensed under the MIT License with Common Clause - see the [LICENSE](LICENSE) file for details.

## 🔐 Security

Portal prioritizes security and privacy:

- **🔑 Private Key Security**: All private keys stored in device secure enclave
- **🔒 Biometric Protection**: Additional security layer for sensitive operations
- **🛡️ No Data Leakage**: Zero telemetry or data collection
- **✅ Cryptographic Verification**: All operations cryptographically signed and verified
- **🏠 Local-First**: Everything runs locally on your device

## 📞 Support

- **Documentation**: [Portal Docs](https://docs.getportal.com)(TBD)
- **Issues**: [GitHub Issues](https://github.com/PortalTechnologiesInc/Portal-App/issues)
- **Community**: [Discord Server](https://discord.gg/)(TBD)
- **Email**: support@portal.com(TBD)

---

**Built with ❤️ by the Portal Team**
