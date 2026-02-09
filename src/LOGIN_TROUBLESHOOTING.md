# 🔐 Login Troubleshooting Guide

## ✅ What We Fixed

1. **Added detailed console logging** - Track auth flow step-by-step
2. **Added session verification** - Ensure session is stored before navigation  
3. **Added 500ms delay** - Give Supabase time to persist the session
4. **Enhanced error messages** - Clear feedback on auth issues

---

## 🧪 Testing Steps

### 1. **Clear Browser Cache**
```
1. Open DevTools (F12)
2. Go to Application → Storage → Clear site data
3. Close and reopen browser
```

### 2. **Watch Console Logs**
Open browser console (F12) and watch for these logs during login:

#### ✅ **Successful Login Flow:**
```
🔐 Attempting login...
✅ Login successful! Session: { user: "yourname@example.com", ... }
✅ Session verified, navigating to dashboard...
🔍 Checking current user session...
✅ User authenticated: yourname@example.com
✅ Session found: { user: "yourname@example.com", ... }
```

#### ❌ **Failed Login (wrong credentials):**
```
🔐 Attempting login...
❌ Login failed: Invalid login credentials
```

#### ❌ **Failed Login (session not stored):**
```
🔐 Attempting login...
✅ Login successful! Session: { ... }
❌ Session not found after login
```

### 3. **Try Logging In**

1. Go to: `http://your-app-url/login`
2. Enter the credentials you used during signup
3. Click "Login"
4. Watch the console

---

## 🔍 Common Issues & Solutions

### **Issue 1: "Invalid JWT" Error**

**Cause:** Session not persisting between login and dashboard

**Solution:**
- Clear browser cache and try again
- Check console for "Session not found after login"
- If you see this, there's a Supabase client configuration issue

**Debug:**
```bash
# Check if Supabase is returning sessions correctly
# Open browser console and run:
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data.session);
```

---

### **Issue 2: "Unauthorized" Error**

**Cause:** Token not being sent to API

**Solution:**
Check console for these logs:
- ✅ "Session found" → Session is good
- ❌ "No active session found" → Need to log in

**Debug:**
```bash
# In browser console, check if token exists:
const token = await getAccessToken();
console.log('Token:', token);
```

---

### **Issue 3: Login Succeeds But Redirects Back**

**Cause:** Root component not detecting session

**Solution:**
- Check console for "User authenticated" message
- If you see "No user found, redirecting to login", the session isn't being retrieved

**Debug:**
Look for these logs:
```
🔍 Checking current user session...
❌ No user found, redirecting to login
```

---

## 🛠️ Manual Test Using curl

Test the full auth flow from command line:

### 1. **Sign Up** (if not already done)
```bash
curl -X POST "https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/auth/signup" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYDhVYz1c" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### 2. **Sign In** (get access token)
```bash
curl -X POST "https://dhahhnqdwsncjieqydjh.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYDhVYz1c" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Copy the `access_token` from the response!**

### 3. **Test Dashboard API** (use token from step 2)
```bash
curl "https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/dashboard/stats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYDhVYz1c"
```

If this works, the server is fine! Issue is in frontend.

---

## 📊 Expected Console Output

### **During Login:**
```
🔐 Attempting login...
✅ Login successful! Session: {
  user: "yourname@example.com",
  token: "eyJhbGciOiJIUzI1NiIs...",
  expiresAt: "2026-02-03T04:47:55.000Z"
}
✅ Session verified, navigating to dashboard...
```

### **After Navigation (Root Component):**
```
🔍 Checking current user session...
✅ User authenticated: yourname@example.com
🔔 Auth state changed: SIGNED_IN User: yourname@example.com
✅ User signed in: yourname@example.com
```

### **When Dashboard Loads:**
```
✅ Session found: {
  user: "yourname@example.com",
  tokenPrefix: "eyJhbGciOiJIUzI1NiIs...",
  expiresAt: "2026-02-03T04:47:55.000Z"
}
```

---

## 🚨 If Still Not Working

### **Option 1: Check Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Navigate to: **Authentication → Users**
3. Check if your user exists
4. Check if email is confirmed (should have green checkmark)

### **Option 2: Check Edge Function Logs**

```bash
supabase functions logs make-server-8eebe9eb --tail
```

Keep this running and try to log in. You'll see server-side errors.

### **Option 3: Enable Supabase Debug Mode**

In `/lib/api.ts`, add this at the top:
```typescript
// Enable debug logging
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      debug: true, // <-- Add this
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

---

## 📞 Need More Help?

Share these details:
1. **Console logs** (full output from login attempt)
2. **Edge function logs** (from `supabase functions logs`)
3. **Network tab** (show the `/auth/signin` request/response)
4. **User exists?** (check Supabase Dashboard → Auth → Users)

---

## ✅ Quick Checklist

- [ ] Cleared browser cache & localStorage
- [ ] Opened browser console (F12)
- [ ] Created account via Sign Up page
- [ ] Trying to log in with same credentials
- [ ] Watching console for log messages
- [ ] User exists in Supabase Dashboard
- [ ] Edge Function is deployed (`supabase functions deploy make-server-8eebe9eb`)
- [ ] All secrets are set (`supabase secrets list`)
