# AI Sports Agent - Mobile App

React Native mobile application for AI Sports Agent, providing 24/7 mental performance support for collegiate athletes.

## Overview

This is a native iOS and Android app built with Expo and React Native. It provides the core features of AI Sports Agent in a mobile-optimized interface.

### Key Features

- **🎙️ Voice + Text Chat**: Dual-mode AI conversations with animated voice button
  - WebSocket-based voice streaming with real-time transcription
  - Voice Activity Detection (VAD) for automatic utterance end
  - Smooth toggle between voice and text modes
  - Live transcript and AI response display
- **📊 Daily Check-Ins**: Mood, confidence, stress, energy, and sleep tracking
- **🎯 Goal Management**: Create, track, and complete performance goals
- **📱 Enhanced Dashboard**: Aggregated insights with polished UI
- **🔔 Push Notifications**: Daily reminders and alerts
- **💾 Offline Support**: Cache data for offline access
- **🔐 Biometric Auth**: Face ID / Touch ID for secure access
- **🎨 Design System**: Centralized theme with consistent colors, spacing, typography

## Tech Stack

- **Framework**: Expo SDK 54 with React Native 0.81
- **Language**: TypeScript 5.9
- **Navigation**: Expo Router (file-based routing)
- **State**: React Hooks + AsyncStorage
- **Styling**: StyleSheet (React Native)
- **API**: Shared `@sports-agent/api-client` package
- **Auth**: SecureStore + JWT tokens

## Project Structure

```
apps/mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Authentication group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── chat.tsx
│   │   ├── mood.tsx
│   │   └── goals.tsx
│   └── _layout.tsx               # Root layout with auth flow
├── lib/                          # Utilities and helpers
│   ├── auth.ts                   # Authentication + API client
│   ├── notifications.ts          # Push notifications
│   ├── storage.ts                # Offline storage
│   └── biometric.ts              # Face ID / Touch ID
├── components/                   # Reusable components (Expo template)
├── constants/                    # Colors and constants
├── assets/                       # Images, fonts, icons
├── app.json                      # Expo configuration
└── package.json                  # Dependencies
```

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- pnpm (or npm/yarn)
- iOS Simulator (macOS only) or Android Emulator
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd apps/mobile
pnpm install
```

### Development

**Start Expo Dev Server:**
```bash
pnpm start
```

**Run on iOS:**
```bash
pnpm ios
```

**Run on Android:**
```bash
pnpm android
```

**Run on Web (for testing):**
```bash
pnpm web
```

### Configuration

**API URL**: Update in `lib/auth.ts`
```typescript
const API_URL = __DEV__
  ? 'http://localhost:3000'  // Local dev
  : 'https://your-production-url.vercel.app';  // Production
```

## Features Implementation

### Phase 1: Authentication ✅

- JWT-based authentication with SecureStore
- Login and signup screens
- Protected routes with automatic redirect
- Token persistence across app restarts

**Files**: `app/(auth)/*`, `lib/auth.ts`

### Phase 2: Chat Interface ✅ **ENHANCED**

- ✨ **Dual-mode chat**: Voice and text with animated toggle
- 🎙️ **Voice integration**: VoiceButton with 5 states (idle/listening/processing/speaking/error)
- 🔊 **Real-time streaming**: WebSocket for voice, SSE for text responses
- 📝 **Live transcription**: Voice input → text → AI response with TTS playback
- 🎨 **Enhanced UI**: EmptyState with suggestion chips, LoadingScreen, ErrorView
- 🎯 **Voice state indicators**: Visual feedback for listening/processing/speaking
- 🔌 **WebSocket status**: Connection indicator for voice mode
- **Files**: `app/(tabs)/chat.tsx` (361 → 678 lines), `components/chat/VoiceButton.tsx`, `hooks/useVoiceChat.ts`

### Phase 3: Mood Tracking ✅

- Interactive sliders for mood, confidence, stress, energy
- Sleep duration tracking (hours)
- Optional notes with character counter
- Visual feedback with emojis and colors
- Form validation and submission

**Files**: `app/(tabs)/mood.tsx`

### Phase 4: Goal Management ✅

- Create goals with categories (Performance, Mental, Academic, Personal)
- Progress tracking with visual progress bars
- Update progress with +/- buttons
- Delete goals with confirmation
- Modal-based goal creation

**Files**: `app/(tabs)/goals.tsx`

### Phase 5: Dashboard ✅

- Quick stats cards (mood, confidence, stress, goals)
- Recent check-ins display with emojis
- Active goals with progress
- Quick action buttons
- Parallel data loading for performance

**Files**: `app/(tabs)/dashboard.tsx`

### Phase 6: Native Features ✅ **ENHANCED**

**Voice Infrastructure** (NEW):
- 🎤 **AudioRecorder**: expo-av based, 16kHz mono AAC optimized for Whisper API
  - Microphone permissions handling
  - Real-time audio level metering (for visualizer)
  - VAD integration for silence detection
- 🔊 **AudioPlayer**: Queued TTS chunk playback
  - Auto-plays chunks as they arrive via WebSocket
  - File-based playback with automatic cleanup
  - Playback status listeners for UI updates
- 🔍 **VoiceActivityDetector**: Smart silence detection
  - 1.5s silence threshold after 300ms+ speech
  - Automatic utterance end triggering
  - Configurable thresholds and parameters
- **Files**: `lib/voice/AudioRecorder.ts` (308 lines), `lib/voice/AudioPlayer.ts` (344 lines), `lib/voice/VoiceActivityDetector.ts` (226 lines)

**Push Notifications:**
- Daily mood reminders
- Local notification support
- Notification channels (Android)
- Permission handling

**Offline Storage:**
- Chat message caching
- Pending sync for offline mood logs and goals
- User preferences storage
- AsyncStorage for persistence

**Biometric Authentication:**
- Face ID / Touch ID support
- Hardware availability checking
- Graceful fallback

**Navigation Enhancements** (NEW):
- Smart entry point (`app/index.tsx`) with auth-based routing
- Enhanced auth flow with segment tracking
- Fixed race conditions in login/signup (100ms delay for state sync)
- Auto-redirect for logged-in/logged-out users

**Theme System** (NEW):
- 🎨 **Colors**: Primary, semantic (success/warning/error), grayscale palette
- 📏 **Spacing**: Consistent spacing scale (xs to xxxl)
- 🔤 **Typography**: Font sizes, weights, line heights
- 🔲 **BorderRadius**: Rounded corners (sm to full)
- 🌑 **Shadows**: Elevation system (small, medium, large)
- **File**: `constants/theme.ts` (102 lines)

**UI Components Library** (NEW):
- 📦 **Card**: Reusable card container with shadows
- ⏳ **LoadingScreen**: Full-screen loading with custom message
- ❌ **ErrorView**: Error display with retry button
- 🎴 **EmptyState**: Empty state with icon, message, and action buttons
- **Files**: `components/ui/` (5 components + index)

## Dependencies

### Core
- `expo` - Expo SDK framework
- `react-native` - React Native core
- `expo-router` - File-based navigation
- `typescript` - Type safety

### UI
- `@expo/vector-icons` - Icon library (Ionicons)
- `@react-native-community/slider` - Slider component

### Native Features
- `expo-secure-store` - Secure token storage
- `expo-notifications` - Push notifications
- `expo-local-authentication` - Face ID / Touch ID
- `@react-native-async-storage/async-storage` - Offline storage
- `expo-av` - Audio/video (voice chat future)
- `react-native-gesture-handler` - Gesture support

### Shared Packages
- `@sports-agent/types` - TypeScript type definitions
- `@sports-agent/api-client` - REST API wrapper

## Building for Production

See `MOBILE_APP_DEPLOYMENT.md` in the root directory for complete instructions on:

- Setting up EAS Build
- Creating app icons and splash screens
- Configuring for iOS App Store
- Configuring for Google Play Store
- Submitting builds
- App Store review process

**Quick Start:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

## Testing

**TypeScript Check:**
```bash
pnpm exec tsc --noEmit
```

**Lint:**
```bash
pnpm lint
```

**Run Tests:**
```bash
pnpm test
```

## Environment Variables

Create `.env` file in `apps/mobile/`:

```env
API_URL=http://localhost:3000
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Troubleshooting

### "Unable to resolve module" errors

```bash
# Clear cache and reinstall
rm -rf node_modules
pnpm install
npx expo start --clear
```

### iOS Simulator not launching

```bash
# Ensure Xcode is installed
xcode-select --install

# Reset Expo cache
npx expo start --clear
```

### Android build fails

```bash
# Check Android Studio and SDK installation
# Ensure ANDROID_HOME is set
export ANDROID_HOME=$HOME/Library/Android/sdk
```

## Code Style

- Use TypeScript for all files
- Follow React Native StyleSheet for styling
- Use functional components with hooks
- Keep components small and focused
- Use async/await for asynchronous operations
- Handle errors gracefully with user-friendly messages

## Performance Optimization

- Use `React.memo` for expensive components
- Implement virtualization with `FlatList` for long lists
- Lazy load images and heavy components
- Cache API responses with AsyncStorage
- Use Expo's image optimization

## Security

- All tokens stored in SecureStore (encrypted)
- No sensitive data in AsyncStorage
- HTTPS for all API calls
- Biometric authentication available
- Auto-logout on token expiration

## Future Enhancements

- [ ] Voice input for chat (Expo AV integration)
- [ ] Charts for mood trends (react-native-chart-kit)
- [ ] Session history with search
- [ ] Dark mode support
- [ ] Localization (i18n)
- [ ] Offline-first architecture
- [ ] Push notification customization
- [ ] In-app purchases (premium features)

## Contributing

1. Create a feature branch
2. Make changes
3. Test on both iOS and Android
4. Run TypeScript check
5. Create pull request

## License

Proprietary - University of Washington

## Support

For issues or questions:
- Email: support@sportsagent.com
- GitHub Issues: https://github.com/arnavmmittal/AISportsAgent/issues

---

**Version**: 1.0.0
**Last Updated**: 2025-12-09
