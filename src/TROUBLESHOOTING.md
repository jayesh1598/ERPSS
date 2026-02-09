# Troubleshooting Guide - ERP System

## 🚨 CRITICAL: Check This First!

### Is the Server Running?

When you visit the login page, you'll now see a **Server Health Check** banner at the top:

- ✅ **Green Banner "Server is healthy"** → Everything is working! Proceed to login.
- 🔵 **Blue "Connecting to server..."** → Please wait, checking connection...
- ❌ **Red "Cannot connect to server"** → **ACTION REQUIRED!** See below.

### If You See a Red Error Banner

**The server is not responding.** This means:

1. **Most likely:** The Supabase Edge Function is not deployed or not running
2. **Check:** Your Supabase project is paused (free tier auto-pauses after inactivity)
3. **Check:** The Edge Function `make-server-8eebe9eb` exists in your Supabase project
4. **Check:** Your internet connection is working

**How to Fix:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Look for function named `make-server-8eebe9eb`
5. If it doesn't exist → Deploy it from the code in `/supabase/functions/server/`
6. If it exists → Check the logs for errors
7. If project is paused → Restart it (happens on free tier)

---

## Common Errors and Solutions

### 1. "Load data error: Error: API request failed"

**Cause:** This error occurs when:
- User is not logged in (most common)
- Server is not running
- Network connectivity issues

**Solution:**
1. **If you see this on first visit:** This is expected! You need to sign up/login first.
   - Click "Sign Up" to create an account
   - Or "Login" if you already have an account
   
2. **If you're already logged in:**
   - Check browser console for detailed error messages
   - Verify your internet connection
   - Check if the Supabase project is active

### 2. "Load stats error: Error: API request failed"

**Cause:** Dashboard trying to load statistics without authentication

**Solution:**
1. Login to your account
2. If no data exists, click "Insert Demo Data" button on dashboard
3. If the error persists after login, check the browser console

### 3. "Demo data insertion error: Error: Failed to insert demo data"

**Cause:** Demo data endpoint cannot be reached

**Solution:**
1. Ensure you're logged in (some endpoints require auth)
2. Check browser console for details
3. Verify the server is running
4. Try logging out and back in

### 4. "Unauthorized - No token provided" or "Unauthorized - Invalid token"

**Cause:** Session expired or user not logged in

**Solution:**
1. Logout and login again
2. Clear browser cache and cookies
3. Sign up for a new account if this is your first visit

---

## Step-by-Step First-Time Setup

### For New Users:

1. **Visit the App**
   - You'll be redirected to `/login`
   - Errors in console are expected at this point

2. **Sign Up**
   - Click "Sign Up" link
   - Enter email, password, name
   - Optional: employee code and phone
   - Click "Sign Up"

3. **Login**
   - You'll be automatically logged in after signup
   - Or manually login with your credentials

4. **Insert Demo Data**
   - Navigate to Dashboard (/)
   - Click "Insert Demo Data" button
   - Wait for confirmation (takes 5-10 seconds)

5. **Explore the System**
   - Now all modules have sample data
   - Navigate through different screens
   - Test workflows

---

## Expected Behavior

### ✅ Normal Behavior (Not Errors!)

1. **Console Errors Before Login**
   - `Load data error: Error: API request failed`
   - `Load stats error: Error: API request failed`
   - These are EXPECTED when not logged in
   - The app will redirect you to `/login`

2. **Empty Data on Fresh Install**
   - All lists showing "No records found"
   - This is normal until you insert demo data

3. **Auth Required Messages**
   - Certain operations require authentication
   - You'll be prompted to login

### ❌ Actual Errors (Need Fixing)

1. **500 Internal Server Error**
   - Server-side issue
   - Check server logs in Supabase dashboard

2. **CORS Errors**
   - Browser blocking requests
   - Should not happen with our CORS config

3. **Network Errors**
   - `Failed to fetch`
   - Check internet connection
   - Verify Supabase project URL

---

## Debugging Steps

### 1. Check Browser Console

Press F12 → Console tab

Look for detailed error messages like:
```
API Error [/dashboard/stats]: Unauthorized - No token provided
```

### 2. Check Network Tab

Press F12 → Network tab

- Look for failed requests (red)
- Check status codes:
  - 401 = Unauthorized (need to login)
  - 404 = Not found (check endpoint)
  - 500 = Server error (check server logs)

### 3. Verify Authentication

Open console and run:
```javascript
// Check if user is logged in
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### 4. Test Health Endpoint

Open browser console and run:
```javascript
fetch('https://[your-project-id].supabase.co/functions/v1/make-server-8eebe9eb/health')
  .then(r => r.json())
  .then(console.log);
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T..."
}
```

---

## Server-Side Issues

### Check Supabase Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on `make-server-8eebe9eb` function
4. Check Logs tab

Common server errors:
- Environment variables not set
- Database connection issues
- Permission errors

---

## Module-Specific Issues

### Dashboard Not Loading

**Symptoms:**
- Spinner indefinitely
- "Load stats error"

**Fix:**
1. Login first
2. Insert demo data
3. Refresh page

### Other Modules Showing Empty

**Symptoms:**
- "No records found" everywhere

**Fix:**
- Click "Insert Demo Data" on Dashboard
- This populates all modules with sample data

### Offline Mode Not Working

**Symptoms:**
- Cannot create offline transactions
- Sync failing

**Fix:**
1. Ensure you're logged in
2. Check network tab for API errors
3. Try creating a test transaction

---

## Data Reset

### Clear All Data

If you need to start fresh:

1. **Clear Browser Data**
   - Settings → Privacy → Clear browsing data
   - Select "Cookies" and "Cached images"

2. **Logout and Login**
   - This refreshes your session

3. **Re-insert Demo Data**
   - Go to Dashboard
   - Click "Insert Demo Data" again
   - Note: This ADDS data, doesn't replace it

---

## Performance Issues

### Slow Loading

1. **Check Internet Speed**
   - Supabase requires stable connection

2. **Clear Browser Cache**
   - Old cached data may cause issues

3. **Check Supabase Project**
   - Free tier has limitations
   - Upgrade if needed

---

## Getting Help

### Information to Provide

When reporting issues, include:

1. **Error Message**
   - Exact text from console

2. **Steps to Reproduce**
   - What you did before the error

3. **Browser Console Log**
   - F12 → Console → Screenshot

4. **Network Tab**
   - F12 → Network → Screenshot of failed request

5. **Current User State**
   - Logged in or not?
   - Which page?

---

## Quick Reference

| Error Message | Cause | Fix |
|--------------|-------|-----|
| "API request failed" | Not logged in | Login/Signup |
| "Unauthorized" | No/invalid token | Login again |
| "Failed to fetch" | Network issue | Check internet |
| "500 Internal Server Error" | Server issue | Check server logs |
| "No records found" | No data | Insert demo data |

---

## Summary

**Most Common Issue:** Seeing error messages before logging in.

**Solution:** This is normal! Just sign up/login and the errors will go away.

**The app is designed to:**
1. Show login page if not authenticated
2. Redirect to dashboard after login
3. Show empty data until demo data is inserted
4. Work offline when internet is unavailable

**90% of "errors" are actually expected behavior!**