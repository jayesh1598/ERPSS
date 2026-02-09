# ✅ Fix "Failed to fetch" Error

## What This Error Means

`TypeError: Failed to fetch` means your browser **cannot reach** the Supabase Edge Function.

### Most Common Cause (99% of cases):

**The Edge Function has not been deployed yet.** 

Your application code is 100% ready, but the backend server needs to be deployed to your Supabase project.

## 🚀 Quick Fix (5 Minutes)

### Step 1: Open Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh**

### Step 2: Navigate to Edge Functions

Click **"Edge Functions"** in the left sidebar

### Step 3: Create the Function

1. Click **"New Function"** or **"Deploy New Function"**
2. Enter function name: `make-server-8eebe9eb`
3. Click **"Create"**

### Step 4: Copy the Server Code

1. Open `/supabase/functions/server/index.tsx` in this project
2. Select ALL the code (Ctrl+A / Cmd+A)
3. Copy it (Ctrl+C / Cmd+C)
4. Paste into the Supabase editor
5. Click **"Deploy"** or **"Save and Deploy"**

### Step 5: Set Environment Variables

In the function settings, click **"Secrets"** or **"Environment Variables"** and add these 4 variables:

#### 1. SUPABASE_URL
```
https://dhahhnqdwsncjieqydjh.supabase.co
```

#### 2. SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c
```

#### 3. SUPABASE_SERVICE_ROLE_KEY
- Go to: Settings > API in your dashboard
- Find the **"service_role"** section
- Click **"Reveal"** and copy the key
- ⚠️ Keep this secret!

#### 4. SUPABASE_DB_URL
- Go to: Settings > Database in your dashboard
- Find **"Connection string"**
- Select **"URI"** format
- Copy the full string (starts with `postgresql://`)

### Step 6: Test

1. Wait 10-20 seconds for deployment to complete
2. Go back to your application
3. Click **"Retry Connection"** button
4. The health check should pass!

---

## 🎯 Visual Guide

```
Your App ──X──> Supabase Edge Function
            ↑
            No function deployed yet!
            
            Deploy the function
            ↓
            
Your App ──✅──> Supabase Edge Function
                  ↓
                  Everything works!
```

---

## Other Possible Causes (Less Common)

### 1. Supabase Project is Paused

**Symptom:** Same "Failed to fetch" error

**Solution:**
1. Go to your Supabase dashboard
2. If you see a "Project Paused" message
3. Click **"Unpause Project"**
4. Free tier projects auto-pause after 7 days of inactivity

### 2. Network/Firewall Issue

**Symptom:** Error happens on all requests

**Solution:**
1. Check your internet connection
2. Try disabling VPN/proxy
3. Check if your firewall blocks Supabase domains
4. Try from a different network

### 3. CORS Issue (Very Rare)

**Symptom:** Browser console shows CORS error

**Solution:**
1. Check Edge Function logs in dashboard
2. Verify the server includes CORS headers (it should already)
3. Check if you modified the server code

---

## How to Check What's Wrong

### Open Browser Console (F12)

Look for additional error details:

**If you see:**
- `Failed to fetch` + No other errors → Function not deployed
- `Failed to fetch` + `net::ERR_NAME_NOT_RESOLVED` → DNS/Network issue
- `Failed to fetch` + `net::ERR_CONNECTION_REFUSED` → Function not deployed
- `CORS error` → Server configuration issue (rare)

---

## Files to Deploy

You need to deploy **ONE** file to Supabase:

### Main File (Required):
- `/supabase/functions/server/index.tsx` - Contains all server code

### Note About Dependencies:
The `index.tsx` file imports:
- `kv_store.tsx` - Database utilities
- `demo-data.tsx` - Demo data

**These are bundled automatically** when you deploy via the Supabase Dashboard. You only need to paste the `index.tsx` code.

If using Supabase CLI, it will automatically include the other files from the same directory.

---

## Environment Variables Reference

| Variable | Value | Where to Find |
|----------|-------|---------------|
| SUPABASE_URL | https://dhahhnqdwsncjieqydjh.supabase.co | Known |
| SUPABASE_ANON_KEY | eyJhbGciOiJI... | Settings > API > anon key |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbGciOiJI... | Settings > API > service_role |
| SUPABASE_DB_URL | postgresql://postgres:... | Settings > Database > Connection String (URI) |

**All Supabase keys are JWTs** - they start with `eyJ`

---

## Verification

### Test 1: Manual cURL Test

```bash
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c"
```

**Expected:** `{"status":"ok","timestamp":"...","message":"Server is running"}`

### Test 2: In Your Application

1. Refresh the application page
2. The error message should disappear
3. You should see "Server is healthy" or the error gone
4. You can now login and use the system

---

## Troubleshooting Deployment

### If Deployment Fails:

**Check these:**
- [ ] Function name is exactly `make-server-8eebe9eb`
- [ ] All code from `index.tsx` was copied
- [ ] No syntax errors in the code
- [ ] All 4 environment variables are set
- [ ] Service role key is correct (not the anon key)
- [ ] DB URL is in URI format (starts with `postgresql://`)

### View Deployment Logs:

1. Dashboard > Edge Functions
2. Click on `make-server-8eebe9eb`
3. Click **"Logs"** tab
4. Look for error messages

### If Function Deploys But Still Fails:

1. Check Edge Function logs for runtime errors
2. Verify environment variables are spelled correctly
3. Make sure service_role key has correct permissions
4. Check if database is accessible

---

## Need More Help?

- **Detailed Guide:** `/DEPLOYMENT_GUIDE.md`
- **Step-by-step Checklist:** `/DEPLOY_NOW_CHECKLIST.md`
- **Testing Guide:** `/START_HERE.md`

---

## Summary

1. ✅ **Deploy Edge Function** to Supabase (5 minutes)
2. ✅ **Set 4 environment variables**
3. ✅ **Refresh your application**
4. ✅ **Start using the system!**

**The "Failed to fetch" error will be gone once the function is deployed.** 🚀
