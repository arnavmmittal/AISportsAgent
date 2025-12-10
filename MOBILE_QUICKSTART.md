# Mobile App Quick Start Guide

## 🔴 **CURRENT ISSUES & FIXES**

### Issue 1: "Network request failed" ❌
**Cause:** Backend not accessible from mobile device
**Fix:** Restart web server with network access

```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/web
npm run dev
```

✅ **You should see:** `ready - started server on 0.0.0.0:3000`

---

### Issue 2: Dashboard loads forever ⏳
**Cause:** Can't connect to backend
**Fix:** App automatically uses demo mode when backend is unavailable

**Login Credentials:**
- Email: `demo@athlete.com`
- Password: `demo123`

**Demo Mode Features:**
- ✅ Works **WITHOUT** backend or database
- ✅ Chat with AI (simulated responses)
- ✅ View mood logs (sample data)
- ✅ View goals (sample data)
- ✅ Full UI functionality

The app will automatically detect if the backend is unavailable and switch to demo mode.

---

### Issue 3: Chat doesn't work 💬
**Cause:** Backend API endpoint needs to be accessible
**Fix:** After restarting backend, reload mobile app

Press `r` in Expo terminal to reload

---

### Issue 4: Voice button doesn't work 🎙️
**Cause:** Microphone permissions not requested
**Status:** Working on fix (requires permission flow)

---

## ✅ **QUICK TEST**

### Test 1: Backend is accessible

```bash
curl -X POST http://10.0.0.34:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@athlete.com\",\"password\":\"demo123\"}"
```

**Expected:** JSON response with `user` and `token`

### Test 2: Mobile can load data

1. Login with demo account
2. Dashboard should load with:
   - Mood stats
   - Active goals
   - Quick actions
3. Chat should allow typing and get AI responses
4. Mood and Goals tabs should be accessible

---

## 🚀 **FULL STARTUP SEQUENCE**

### Terminal 1: Web Backend
```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/web
npm run dev
```

Wait for: `ready - started server on 0.0.0.0:3000`

### Terminal 2: Mobile App
```bash
cd /Users/arnavmittal/Desktop/SportsAgent/apps/mobile
npx expo start --clear
```

Wait for QR code, then:
- iOS Simulator: Press `i`
- Android Emulator: Press `a`
- Physical Device: Scan QR code with Expo Go app

### Test Login
1. Enter email: `demo@athlete.com`
2. Enter password: `demo123`
3. Tap "Login"
4. Should redirect to Dashboard ✅

---

## 🐛 **TROUBLESHOOTING**

### "Network request failed" still happening

1. **Check backend is running:**
   ```bash
   lsof -i:3000
   ```
   Should show a node process

2. **Check IP address is correct:**
   ```bash
   ipconfig getifaddr en0
   ```
   Should match IP in `apps/mobile/lib/auth.ts`

3. **Test from command line:**
   ```bash
   curl http://10.0.0.34:3000/api/auth/mobile/login
   ```
   Should get response (not "Connection refused")

### Dashboard still loading forever

1. Check web terminal for errors
2. Try logout and login again
3. Clear app data:
   - iOS: Delete app and reinstall
   - Android: Settings → Apps → Expo Go → Clear Data

### Chat not sending messages

1. Check Network tab in debugger (press `j` in Expo)
2. Look for API calls to `/api/chat/stream`
3. Check web terminal for incoming requests

---

## 📱 **WHAT WORKS NOW**

✅ Authentication (demo account)
✅ Dashboard with stats
✅ Mood logging
✅ Goals management
✅ Text chat (voice coming soon)
✅ Navigation between screens

---

## 🎨 **UI IMPROVEMENTS COMING**

- Gradients and animations
- Haptic feedback
- Typing indicators
- Loading skeletons
- Voice chat functionality
- Pull to refresh

---

## 💡 **PRO TIPS**

- Press `r` to reload app anytime
- Press `j` to open debugger
- Press `m` for dev menu
- Check both terminals for errors
- Demo account data is fake but fully functional

---

**Last Updated:** 2025-12-10
