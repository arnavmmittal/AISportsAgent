# AI Sports Agent - Mobile App Deployment Guide

## Overview

This document outlines the complete process for building and deploying the AI Sports Agent React Native mobile app to the Apple App Store and Google Play Store.

## Prerequisites

### Development Tools
- **Expo CLI**: `npm install -g eas-cli`
- **Apple Developer Account**: $99/year (https://developer.apple.com)
- **Google Play Developer Account**: $25 one-time (https://play.google.com/console)
- **Expo Account**: Free (https://expo.dev)

### Required Assets
- **App Icon**: 1024x1024px PNG (transparent background not allowed for iOS)
- **Splash Screen**: 1284x2778px PNG
- **Screenshots**:
  - iOS: 5.5" (1242x2208), 6.5" (1284x2778), 12.9" iPad (2048x2732)
  - Android: Phone (1080x1920), Tablet (1920x1200)

## Phase 1: Setup EAS Build

### 1.1 Install EAS CLI

```bash
npm install -g eas-cli
```

### 1.2 Login to Expo

```bash
eas login
```

### 1.3 Configure Project

```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/mobile
eas build:configure
```

This will:
- Create `eas.json` (already created in root)
- Link your project to Expo
- Generate a project ID

### 1.4 Update app.json

Replace `"your-project-id-here"` in `app.json` with your actual Expo project ID:

```json
"extra": {
  "eas": {
    "projectId": "actual-project-id-from-expo"
  }
}
```

## Phase 2: Prepare Assets

### 2.1 Create App Icon

**Requirements**:
- Size: 1024x1024px
- Format: PNG
- No transparency (solid background)
- No rounded corners (iOS will round automatically)

Place at: `apps/mobile/assets/images/icon.png`

**Design Tips**:
- Use your brand colors (#2563eb blue is primary)
- Simple, recognizable design
- Looks good at small sizes

### 2.2 Create Splash Screen

**Requirements**:
- Size: 1284x2778px (iPhone 14 Pro Max)
- Format: PNG
- Center logo/branding with solid background

Place at: `apps/mobile/assets/images/splash-icon.png`

### 2.3 Create Adaptive Icon (Android)

**Requirements**:
- Size: 1024x1024px
- Format: PNG
- Safe zone: 512x512px centered circle

Place at: `apps/mobile/assets/images/adaptive-icon.png`

## Phase 3: Build for iOS

### 3.1 iOS Credentials Setup

```bash
cd apps/mobile
eas credentials
```

Select:
- iOS > Production
- Create new credentials or use existing

EAS will automatically:
- Generate iOS certificates
- Create provisioning profiles
- Upload to Apple Developer Portal

### 3.2 Build iOS App

```bash
eas build --platform ios --profile production
```

This will:
- Build the app in the cloud
- Sign with your credentials
- Generate an `.ipa` file
- Take ~15-30 minutes

### 3.3 Download Build

```bash
eas build:list
# Copy the build ID
eas build:download [build-id]
```

## Phase 4: Submit to App Store

### 4.1 App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" > "+" > "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: AI Sports Agent
   - **Primary Language**: English
   - **Bundle ID**: com.sportsagent.mobile (must match app.json)
   - **SKU**: aisportsagent-ios-001
   - **User Access**: Full Access

### 4.2 App Information

**Category**: Health & Fitness > Sports
**Content Rights**: Does not contain third-party content

**Privacy Policy URL**: (Required - create at your domain)
**Support URL**: (Required - create at your domain)

**App Description** (Example):
```
AI Sports Agent is your 24/7 mental performance companion for collegiate athletes.

Get instant access to evidence-based sports psychology support through AI-powered conversations, mood tracking, and goal management.

KEY FEATURES:
• 24/7 AI Chat Assistant trained in sports psychology
• Daily mood and confidence tracking
• Performance goal management
• Personalized mental performance insights
• Crisis detection and support resources
• Secure and private - your data stays confidential

DESIGNED FOR STUDENT ATHLETES:
- Pre-game anxiety management
- Performance slump recovery
- Academic stress support
- Team communication guidance
- Motivation and focus strategies

Built by sports psychologists and AI experts to extend mental performance support beyond traditional capacity constraints.

Note: This app is designed for mental performance optimization and is not a substitute for professional medical or mental health treatment. If you're experiencing a mental health crisis, please contact emergency services or a mental health professional immediately.
```

**Keywords**: sports psychology, mental training, athlete wellness, performance coaching, mindfulness, mental health, student athlete

### 4.3 Screenshots

Upload screenshots for:
- 6.5" iPhone (1284x2778) - REQUIRED
- 5.5" iPhone (1242x2208) - REQUIRED
- 12.9" iPad (2048x2732) - Recommended

**Screenshot Order** (3-10 images):
1. Chat interface with conversation
2. Dashboard with stats
3. Mood logging screen
4. Goals management
5. Login screen

### 4.4 Submit Build

```bash
cd apps/mobile
eas submit --platform ios --profile production
```

Or manually:
1. Go to App Store Connect
2. Select your app > "TestFlight" tab
3. Upload build
4. Wait for processing (~10-30 minutes)
5. Add to "App Store" > Create new version
6. Fill out "What's New" section
7. Submit for Review

### 4.5 App Review Information

**Contact Information**:
- First Name: [Your Name]
- Last Name: [Your Name]
- Phone: [Your Phone]
- Email: [Your Email]

**Notes for Reviewer**:
```
AI Sports Agent provides mental performance support for collegiate athletes through AI-powered conversations.

TEST ACCOUNT:
Email: reviewer@test.com
Password: TestAccount123!

TESTING INSTRUCTIONS:
1. Create an account or use test credentials
2. Navigate to Chat tab to see AI assistant
3. Log a mood check-in in Mood tab
4. Create a goal in Goals tab
5. View dashboard for aggregated insights

The app requires internet connectivity for AI chat features but supports offline mood logging with sync when reconnected.
```

## Phase 5: Build for Android

### 5.1 Android Credentials Setup

```bash
cd apps/mobile
eas credentials
```

Select:
- Android > Production
- Create new keystore

EAS will automatically generate and store your signing credentials.

### 5.2 Build Android App

```bash
eas build --platform android --profile production
```

This will:
- Build an Android App Bundle (AAB)
- Sign with your keystore
- Take ~15-30 minutes

## Phase 6: Submit to Google Play

### 6.1 Google Play Console Setup

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name**: AI Sports Agent
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

### 6.2 Store Listing

**Short description** (80 chars):
```
24/7 mental performance support for collegiate athletes. AI-powered coaching.
```

**Full description** (4000 chars max):
```
[Use same description as iOS App Store]
```

**App category**: Health & Fitness
**Content rating**: Everyone

**Contact details**:
- Email: [Your support email]
- Phone: [Optional]
- Website: [Your website]

**Privacy policy**: [Your privacy policy URL]

### 6.3 Upload Build

```bash
cd apps/mobile
eas submit --platform android --profile production
```

Or manually:
1. Download AAB from EAS: `eas build:download [build-id]`
2. Go to Google Play Console
3. Select your app > Production > Create new release
4. Upload AAB
5. Fill out release notes
6. Save and review

### 6.4 Screenshots & Assets

Upload for:
- Phone: 16:9 aspect ratio (1080x1920 recommended)
- 7-inch tablet: 16:9 aspect ratio (1920x1200)
- 10-inch tablet: 16:9 aspect ratio (1920x1200)

Minimum 2 screenshots, maximum 8.

**Feature Graphic**: 1024x500px PNG

## Phase 7: Testing & Release

### 7.1 Internal Testing (Recommended First)

**iOS - TestFlight**:
```bash
# After first build is processed
# Go to App Store Connect > TestFlight
# Add internal testers
# Distribute build
```

**Android - Internal Testing**:
```
# Google Play Console > Testing > Internal testing
# Create release
# Add testers by email
```

### 7.2 Review Process

**iOS**:
- Typically 24-48 hours
- Can be rejected for guideline violations
- Common rejections: Missing privacy policy, unclear screenshots, test account issues

**Android**:
- Typically 1-3 days
- Less strict than iOS
- Focus on content policy compliance

### 7.3 Go Live

**iOS**:
1. Once approved, status = "Pending Developer Release"
2. Click "Release this Version"
3. App goes live within 24 hours

**Android**:
1. Once approved, click "Release to Production"
2. Rollout can be gradual (10%, 25%, 50%, 100%)
3. Full rollout within a few hours

## Phase 8: Post-Launch

### 8.1 Monitor Crashes

```bash
# View crash reports
eas build:view [build-id]
```

Or use:
- Sentry (recommended)
- Firebase Crashlytics
- Expo Application Services (built-in)

### 8.2 Analytics Setup

Recommended:
- Google Analytics for Firebase
- Expo Analytics
- Mixpanel

### 8.3 Push Notifications Setup

1. iOS: Configure APNs in Apple Developer Portal
2. Android: Already configured (uses FCM)
3. Update backend to send push via Expo Push API

### 8.4 OTA Updates

For minor updates (no native code changes):

```bash
cd apps/mobile
eas update --branch production --message "Fix: Minor bug fixes"
```

Users get updates instantly without App Store review!

## Versioning Strategy

### When to increment version:

**Patch (1.0.X)**: Bug fixes, minor UI tweaks
```bash
# Update app.json
"version": "1.0.1"
# iOS: buildNumber: "2"
# Android: versionCode: 2
```

**Minor (1.X.0)**: New features, non-breaking changes
```bash
"version": "1.1.0"
```

**Major (X.0.0)**: Breaking changes, major redesigns
```bash
"version": "2.0.0"
```

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Apple Developer Program | $99 | Annual |
| Google Play Developer | $25 | One-time |
| Expo EAS Build | Free tier: 30 builds/month<br>Paid: $29/month | Monthly |
| **Total Year 1** | $124-472 | - |
| **Total Year 2+** | $99-447 | Annual |

## Troubleshooting

### Build Fails

```bash
# View build logs
eas build:list
eas build:view [build-id]

# Common issues:
# - Missing credentials: Run eas credentials
# - app.json errors: Validate JSON syntax
# - Native module issues: Check expo-doctor
```

### App Store Rejection

Common reasons:
1. **Missing test account**: Provide working credentials
2. **Broken functionality**: Ensure all features work
3. **Privacy policy**: Must be accessible and complete
4. **Screenshots**: Must show actual app content
5. **Metadata**: Must match app functionality

### OTA Update Not Working

```bash
# Check update branch
eas update:list

# Force update in app
# Clear cache and restart app
```

## Resources

- **Expo Docs**: https://docs.expo.dev
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Play Store Guidelines**: https://support.google.com/googleplay/android-developer/answer/9876937

---

**Last Updated**: 2025-12-09
**Version**: 1.0.0
