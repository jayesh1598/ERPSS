# 🚨 FIX: "Invalid JWT" Error - COMPLETE SOLUTION

## 📋 Problem Summary

You're getting this error:
```
API Error [/dashboard/stats] 401: {
  "code": 401,
  "message": "Invalid JWT"
}
```

## 🎯 Root Cause

**Your code in Figma Make is 100% CORRECT** ✅

**BUT** your Supabase Edge Function **has NOT been deployed yet** ❌

Supabase is still running OLD CODE that can't validate JWT tokens properly.

---

## ✅ THE SOLUTION (Choose ONE method)

### 🚀 Method 1: Supabase CLI (FASTEST - 2 minutes)

This is the recommended method. Follow these exact steps:

#### Step 1: Install Supabase CLI

**Windows/Mac/Linux:**
```bash
npm install -g supabase
```

**Alternative (Mac with Homebrew):**
```bash
brew install supabase/tap/supabase
```

#### Step 2: Login to Supabase
```bash
supabase login
```
- This opens your browser
- Click "Authorize"
- Come back to terminal

#### Step 3: Link Your Project
```bash
supabase link --project-ref dhahhnqdwsncjieqydjh
```
- It will ask for your **database password**
- Enter the password you set when creating the Supabase project

#### Step 4: Deploy the Edge Function
```bash
supabase functions deploy make-server-8eebe9eb --no-verify-jwt
```

**IMPORTANT:** The `--no-verify-jwt` flag is **REQUIRED**. Don't skip it!

#### Step 5: Verify & Test
```bash
# Check deployment worked
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

Should return:
```json
{
  "status": "ok",
  "version": "2.0-getUser-with-token-param",
  "authMethod": "supabaseClient.auth.getUser(accessToken)"
}
```

#### Step 6: Test in Browser
1. Go to: `/deployment-check.html`
2. Click "Check Server Version"
3. Should show: ✅ **SERVER IS UP TO DATE!**
4. Hard refresh your app (`Ctrl+Shift+R`)
5. Login again
6. Dashboard will work! ✅

---

### 🌐 Method 2: Supabase Dashboard (If no CLI - 10 minutes)

If you can't install CLI or it's not working, use the dashboard:

#### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/functions

#### Step 2: Find Your Edge Function
- Look for `make-server-8eebe9eb` in the functions list
- Click on it

#### Step 3: Edit the Function
- Click "Edit Function" or similar button
- You should see a code editor

#### Step 4: Copy Your Fixed Code
1. **In Figma Make**, open `/supabase/functions/server/index.tsx`
2. **Select ALL** code (`Ctrl+A`)
3. **Copy** it (`Ctrl+C`)

#### Step 5: Replace Code in Dashboard
1. **In Supabase Dashboard**, select all existing code
2. **Delete** it
3. **Paste** your corrected code from Figma Make

#### Step 6: Deploy
1. Click **"Deploy"** or **"Save and Deploy"** button
2. Wait 20-30 seconds for deployment
3. Look for success message

#### Step 7: Verify
1. Go to `/deployment-check.html` in your app
2. Click "Check Server Version"
3. Should show: ✅ **SERVER IS UP TO DATE!**

#### Step 8: Test
1. Hard refresh browser (`Ctrl+Shift+R`)
2. Login again
3. Dashboard works! ✅

---

### 🛠️ Method 3: Using Supabase API (Advanced)

If you have your Supabase Management API token, you can deploy via API:

```bash
curl -X POST https://api.supabase.com/v1/projects/dhahhnqdwsncjieqydjh/functions/make-server-8eebe9eb/deploy \
  -H "Authorization: Bearer YOUR_MANAGEMENT_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @supabase/functions/server/index.tsx
```

*Not recommended unless you're familiar with Supabase APIs.*

---

## 🧪 Verification Steps

After deploying, **verify it worked**:

### 1. Open Diagnostic Page
Go to: `/deployment-check.html`

### 2. Run All Checks
- Click "🔍 Check Server Version" → Should show **2.0-getUser-with-token-param**
- Click "💾 Check Session" → Should show your session if logged in
- Click "🔐 Test Authentication" → Should show ✅ **AUTHENTICATION WORKS!**

### 3. Test Your App
1. **Hard refresh** browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. **Clear cache** if needed
3. **Login** at `/login`
4. **Dashboard** should load without errors ✅

---

## ❓ Troubleshooting

### "Command not found: supabase"
**Fix:** Install Supabase CLI first:
```bash
npm install -g supabase
```

### "Invalid project ref"
**Fix:** Make sure you're using the correct project ID:
```bash
supabase link --project-ref dhahhnqdwsncjieqydjh
```

### "Incorrect password"
**Fix:** You need your **database password**, not your Supabase account password.
- Go to: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/settings/database
- Click "Reset Database Password" if you forgot it

### "No Docker daemon running"
**Fix:** You don't need Docker for deployment! Ignore this warning.
Just add `--legacy-bundle` flag:
```bash
supabase functions deploy make-server-8eebe9eb --no-verify-jwt --legacy-bundle
```

### Deployment succeeds but still getting JWT errors
**Fix:**
1. Hard refresh browser (`Ctrl+Shift+R`)
2. Clear browser cache and cookies
3. Go to `/deployment-check.html` and verify version is correct
4. Check Supabase logs: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/logs/edge-functions
5. Look for error messages in the logs

### "Permission denied"
**Fix:** Make sure you're logged in:
```bash
supabase login
```

---

## 📊 What Gets Fixed

After successful deployment:

✅ **JWT validation will work**  
✅ **Login sessions will persist**  
✅ **Dashboard will load data**  
✅ **All API calls will authenticate**  
✅ **No more "Invalid JWT" errors**  

---

## 🔍 Understanding the Issue

### What Happened?

1. You have **TWO COPIES** of your server code:
   - **Figma Make** (your local editor) ← Has CORRECT code ✅
   - **Supabase Edge Function** (cloud server) ← Has OLD code ❌

2. When you edited files in Figma Make, it only changed the **local copy**

3. Your browser sends requests to the **Supabase cloud server**, not Figma Make

4. Supabase is still running the **old broken code**

### The Fix

**Deployment** = Copying your corrected code from Figma Make → Supabase

Once deployed, Supabase will run your correct code and JWT validation will work!

---

## 🆘 Still Not Working?

If you've deployed and still getting errors:

1. **Check the version:**
   - Go to `/deployment-check.html`
   - Should show version: `2.0-getUser-with-token-param`
   - If not, deployment didn't work - try again

2. **Check browser console:**
   - Press F12
   - Go to Console tab
   - Look for red error messages
   - Copy and share them

3. **Check Supabase logs:**
   - Go to: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/logs/edge-functions
   - Look for errors around the time you tried to login
   - The logs will show what's failing

4. **Check your session:**
   - Go to `/deployment-check.html`
   - Click "Check Session"
   - Should show your session is valid
   - If not, clear cookies and login again

---

## 📞 Quick Reference

**Project ID:** `dhahhnqdwsncjieqydjh`

**Edge Function Name:** `make-server-8eebe9eb`

**Deployment Command:**
```bash
supabase functions deploy make-server-8eebe9eb --no-verify-jwt
```

**Health Check URL:**
```
https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

**Diagnostic Page:**
```
/deployment-check.html
```

**Dashboard Link:**
```
https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/functions
```

---

## ✅ Final Checklist

Before asking for more help, make sure you've done:

- [ ] Deployed the Edge Function using one of the methods above
- [ ] Verified deployment at `/deployment-check.html`
- [ ] Confirmed version shows `2.0-getUser-with-token-param`
- [ ] Hard refreshed browser (`Ctrl+Shift+R`)
- [ ] Cleared browser cache/cookies
- [ ] Logged out and logged in again
- [ ] Checked browser console for errors
- [ ] Checked Supabase Edge Function logs

If you've done ALL of these and still have issues, then there's a different problem.

---

## 🎯 Expected Result

After deployment:

1. Login at `/login` → Success ✅
2. Redirected to `/` dashboard → Success ✅
3. Dashboard loads stats → Success ✅
4. No "Invalid JWT" errors → Success ✅

**Your ERP system will be fully functional!** 🎉
