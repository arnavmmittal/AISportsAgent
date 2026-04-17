import { ExpoConfig, ConfigContext } from 'expo/config';

// APP_VARIANT is set by eas.json build profiles
const IS_STAGING = process.env.APP_VARIANT === 'staging';
const IS_PRODUCTION = process.env.APP_VARIANT === 'production';
const IS_DEV = !IS_STAGING && !IS_PRODUCTION;

// Bundle ID varies by environment so staging and production
// can coexist on the same device
const getBundleId = () => {
  if (IS_PRODUCTION) return 'com.flowsportscoach.mobile';
  if (IS_STAGING) return 'com.flowsportscoach.staging';
  return 'com.flowsportscoach.dev';
};

// App name shown on home screen
const getAppName = () => {
  if (IS_PRODUCTION) return 'Flow Coach';
  if (IS_STAGING) return 'Flow Coach (S)';
  return 'Flow Coach (Dev)';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'flow-sports-coach',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'flowsportscoach',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0C0A09',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleId(),
    buildNumber: '1',
    infoPlist: {
      NSFaceIDUsageDescription:
        'Use Face ID to quickly and securely access your mental performance data.',
      NSCameraUsageDescription:
        'Camera access is required for Face ID authentication.',
      NSMicrophoneUsageDescription:
        'Microphone access is required for voice chat features.',
    },
    config: {
      usesNonExemptEncryption: false,
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        color: '#D4732E',
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Allow Flow Sports Coach to use Face ID for secure authentication.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '7a0550da-2537-4759-b2b2-61a7b914bf36',
    },
    router: {},
    appVariant: process.env.APP_VARIANT || 'development',
  },
  owner: 'arnav_m8',
});
