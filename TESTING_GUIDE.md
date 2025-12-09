# AI Sports Agent - Local Testing Guide

Quick guide to test both web and mobile apps locally.

## Prerequisites

- Node.js >= 20.9.0
- pnpm installed
- For iOS: macOS with Xcode
- For Android: Android Studio with emulator
- For Physical Device: Expo Go app

## Step 1: Start the Web Backend

**Terminal 1:**
```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/web
pnpm install  # First time only
pnpm prisma:generate  # First time only
pnpm dev
```

✅ Web app running at: **http://localhost:3000**

Leave this terminal running!

## Step 2: Test Web App

Open browser at **http://localhost:3000**

Test: Sign Up → Chat → Mood → Goals → Dashboard

## Step 3: Start Mobile App

**Terminal 2** (keep Terminal 1 running):
```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/mobile
pnpm start
```

Press `i` for iOS, `a` for Android, or scan QR code with Expo Go

## Test Both Apps

Your local IP is already configured: **10.0.0.127**

See full testing instructions in this file!
