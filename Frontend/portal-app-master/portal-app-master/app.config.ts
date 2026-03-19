export default {
  expo: {
    name: 'PAR',
    slug: 'portal-yeabsiragenet', // ✅ unique slug (VERY IMPORTANT)
    version: '1.0.11',
    orientation: 'portrait',

    owner: 'yeabsiragenet', // ✅ your Expo account

    icon: './assets/images/appLogo.png',
    scheme: 'portal',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,

    splash: {
      image: './assets/images/appSplash.png',
      resizeMode: 'contain',
      backgroundColor: '#141416',
    },

    androidNavigationBar: {
      backgroundColor: '#141416',
    },

    ios: {
      supportsTablet: true,
      userInterfaceStyle: 'automatic',
      bundleIdentifier: 'cc.getportal.portal',
      associatedDomains: ['applinks:portal.app'],
      infoPlist: {
        NSCameraUsageDescription: 'Portal uses your camera to scan for QR codes',
      },
      config: {
        usesNonExemptEncryption: false,
      },
      icon: {
        dark: './assets/images/iosDark.png',
        light: './assets/images/iosLight.png',
        tinted: './assets/images/iosTinted.png',
      },
    },

    android: {
      versionCode: 13,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      adaptiveIcon: {
        foregroundImage: './assets/images/appLogo.png',
        backgroundColor: '#141416',
      },
      package: 'cc.getportal.portal',
      userInterfaceStyle: 'automatic',

      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'portal' }, { scheme: 'portal-cashu' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },

    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'The app accesses your photos to let you upload your profile picture.',
        },
      ],
      'expo-router',
      'expo-font',
      [
        'expo-splash-screen',
        {
          image: './assets/images/appSplash.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#141416',
        },
      ],
      'expo-secure-store',
      'expo-sqlite',
      'expo-web-browser',
      [
        'expo-notifications',
        {
          icon: './assets/images/appNotificationLogo.png',
          color: '#ffffff',
          defaultChannel: 'default',
          enableBackgroundRemoteNotifications: true,
        },
      ],
      [
        'react-native-nfc-manager',
        {
          nfcPermission: 'Portal uses NFC for contactless interactions',
          includeNdefEntitlement: false,
        },
      ],
      './plugins/withRemoveUniffiDependency.cjs',
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: '572879d6-f340-408f-b1f2-a4250c6a5df7', // ✅ NEW projectId
      },
    },
  },
};
