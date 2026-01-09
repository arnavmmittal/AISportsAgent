# Mobile App Deployment with EAS

This guide covers deploying the AI Sports Agent mobile app to staging and production using Expo Application Services (EAS).

## Prerequisites

1. **Expo Account** (free tier works)
   - Sign up at https://expo.dev
   
2. **EAS CLI** installed globally:
   ```bash
   npm install -g eas-cli
   ```

3. **Apple Developer Account** (for iOS - $99/year)
   - Required for TestFlight and App Store
   
4. **Google Play Console** (for Android - $25 one-time)
   - Required for internal testing and Play Store

## Initial Setup (One-Time)

### 1. Login to EAS

```bash
cd apps/mobile
eas login
```

### 2. Create EAS Project

```bash
eas init
```

This will:
- Create an Expo project in your account
- Generate a project ID
- Update `app.json` with the project ID

### 3. Configure Apple/Google Credentials

**For iOS:**
```bash
eas credentials
```

Follow the prompts to:
- Upload signing certificate
- Create provisioning profile
- Or let EAS manage credentials (easier)

**For Android:**
```bash
eas credentials
```

Follow the prompts to:
- Generate or upload keystore
- Or let EAS manage credentials (easier)

## Building for Staging

### iOS Staging Build (TestFlight)

```bash
# Build for iOS
eas build --profile staging --platform ios

# Wait for build to complete (~15-20 minutes)
# Build will be available in Expo dashboard

# Submit to TestFlight
eas submit --profile staging --platform ios
```

**After submission:**
1. Go to App Store Connect (https://appstoreconnect.apple.com)
2. Wait for processing (~10-30 minutes)
3. Add internal/external testers
4. Testers receive TestFlight invitation email

### Android Staging Build (Internal Testing)

```bash
# Build for Android
eas build --profile staging --platform android

# Submit to Play Console
eas submit --profile staging --platform android
```

**After submission:**
1. Go to Play Console (https://play.google.com/console)
2. Navigate to Testing > Internal Testing
3. Create release from uploaded APK
4. Add internal testers (by email)
5. Share testing link with testers

## Building for Production

### iOS Production Build (App Store)

```bash
# Build for production
eas build --profile production --platform ios

# Submit to App Store
eas submit --profile production --platform ios
```

**After submission:**
1. App Store Connect > My Apps > Select App
2. Complete app information (screenshots, description, etc.)
3. Submit for review (1-7 days)
4. Once approved, manually release or schedule

### Android Production Build (Play Store)

```bash
# Build for production (AAB format)
eas build --profile production --platform android

# Submit to Play Store
eas submit --profile production --platform android
```

**After submission:**
1. Play Console > Production
2. Create release from uploaded AAB
3. Complete store listing
4. Submit for review (usually same day)
5. Rollout to production

## Build Profiles Explained

### Development
- **Use**: Local development with Expo Go
- **Distribution**: Internal only
- **API**: `http://localhost:3000`

### Staging
- **Use**: Testing with real athletes/coaches before production
- **Distribution**: TestFlight (iOS) / Internal Testing (Android)
- **API**: `https://staging-aisportsagent.vercel.app`
- **Channel**: `staging` (for OTA updates)

### Production
- **Use**: Live app in stores
- **Distribution**: App Store / Play Store
- **API**: `https://app.aisportsagent.com`
- **Channel**: `production` (for OTA updates)
- **Build Type**: AAB for Android (required by Play Store)

## Over-the-Air (OTA) Updates

EAS supports OTA updates for JavaScript code changes (no rebuild needed):

```bash
# Publish update to staging
eas update --branch staging --message "Fix: Updated goal validation"

# Publish update to production
eas update --branch production --message "Feature: Added mood insights"
```

**What can be updated OTA:**
- ✅ JavaScript code changes
- ✅ React components
- ✅ Business logic
- ✅ API endpoints

**What requires a new build:**
- ❌ Native code changes (iOS/Android)
- ❌ New native dependencies
- ❌ Permission changes
- ❌ App icon/splash screen changes

## Versioning Strategy

**Version Format**: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)

- **MAJOR**: Breaking changes, major redesigns
- **MINOR**: New features, significant updates
- **PATCH**: Bug fixes, small improvements

**Build Numbers** (auto-incremented by EAS in production):
- iOS: `buildNumber` in `app.json`
- Android: `versionCode` in `app.json`

## Monitoring Builds

### Via CLI

```bash
# List recent builds
eas build:list

# View build details
eas build:view [BUILD_ID]

# Download build artifact
eas build:download [BUILD_ID]
```

### Via Dashboard

Visit https://expo.dev/accounts/YOUR_USERNAME/projects/ai-sports-agent/builds

## Troubleshooting

### Build Failed

1. Check build logs in Expo dashboard
2. Common issues:
   - Missing environment variables
   - Invalid credentials
   - Dependency conflicts
   - Native module issues

### App Crashes on Device

1. Check error logs in Expo dashboard
2. Test locally with development build:
   ```bash
   eas build --profile development --platform ios
   eas build:run --profile development --platform ios
   ```

### Submission Rejected

**iOS:**
- Check App Store Connect for feedback
- Common: Missing privacy descriptions, guideline violations

**Android:**
- Check Play Console for feedback
- Common: Missing content rating, target API level

## Environment URLs

| Environment | Web App URL | MCP Server URL |
|-------------|-------------|----------------|
| Local | http://localhost:3000 | http://localhost:8000 |
| Staging | https://staging-aisportsagent.vercel.app | https://mcp-staging.railway.app |
| Production | https://app.aisportsagent.com | https://mcp.railway.app |

## Quick Reference Commands

```bash
# One-time setup
eas login
eas init

# Build staging
eas build --profile staging --platform all
eas submit --profile staging --platform all

# Build production  
eas build --profile production --platform all
eas submit --profile production --platform all

# OTA updates
eas update --branch staging --message "Description"
eas update --branch production --message "Description"

# Monitor
eas build:list
eas build:view [BUILD_ID]
```

## Cost Estimates

**Expo EAS:**
- Free tier: Includes builds, unlimited projects
- Paid tier: $29/month for priority builds and more concurrency

**Apple:**
- Developer Program: $99/year

**Google:**
- Play Console: $25 one-time

**Total First Year**: ~$153
**Total Ongoing**: ~$99/year

## Support

- Expo Docs: https://docs.expo.dev/eas/
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- Discord: https://chat.expo.dev/
