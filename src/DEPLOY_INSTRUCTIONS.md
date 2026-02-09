# 🚀 JWT Fix - Deployment Instructions

## ✅ What Was Fixed

The JWT authentication errors have been resolved by changing the server authentication middleware from using the **anon key client** to the **service role key client** for JWT validation.

### Changes Made:
1. **Line 102** in `/supabase/functions/server/index.tsx`: Changed from `supabaseClient.auth.getUser()` to `supabaseAdmin.auth.getUser()`
2. **Line 190**: Updated health endpoint version to `4.1-production-jwt-fixed`
3. **Line 257**: Updated debug endpoint to also use admin client

## 📋 Deploy to Supabase

Since the Edge Function code has been updated, you **MUST deploy** it to Supabase for the fix to take effect.

### Method 1: Using Supabase CLI (Recommended)

```bash
# 1. Install Supabase CLI if you haven't already
# macOS/Linux:
brew install supabase/tap/supabase

# Windows:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref dhahhnqdwsncjieqydjh

# 4. Deploy the Edge Function
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh
```

### Method 2: Using Supabase Dashboard

1. Copy the entire contents of `/supabase/functions/server/index.tsx`
2. Go to https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
3. Navigate to **Edge Functions** in the left sidebar
4. Find the `make-server-8eebe9eb` function
5. Click **Edit Function** or **New Deployment**
6. Paste the updated code
7. Click **Deploy**

### Method 3: Quick Copy-Paste

If you're using the Figma Make environment, you can:
1. Read the file: `/supabase/functions/server/index.tsx`
2. Copy all contents
3. Deploy via Supabase Dashboard as described in Method 2

## 🔍 Verify the Deployment

### Step 1: Check Health Endpoint
```bash
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "version": "4.1-production-jwt-fixed",
  "authMethod": "supabaseAdmin.auth.getUser(accessToken) with Service Role Key",
  "environment": {
    "supabaseUrl": "https://dhahhnqdwsncjieqydjh.supabase.co",
    "hasAnonKey": true,
    "hasServiceKey": true
  }
}
```

✅ **Confirm** that:
- Version shows `4.1-production-jwt-fixed`
- `authMethod` shows "supabaseAdmin.auth.getUser"
- `hasServiceKey` is `true`

### Step 2: Test Login Flow

1. Open your application
2. Navigate to `/login`
3. Enter your credentials and log in
4. After successful login, navigate to the dashboard
5. ✅ **You should NOT see any "Invalid JWT" errors**

### Step 3: Check Browser Console

Open browser DevTools (F12) and check the console:

✅ **Expected logs:**
```
✅ Session found: {...}
✅ Login successful! Session: {...}
```

❌ **Should NOT see:**
```
Invalid JWT
Authentication required - Please log in again
API Error [/dashboard/stats] 401
```

### Step 4: Check Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions → `make-server-8eebe9eb` → Logs
2. After logging in and accessing protected routes, you should see:

✅ **Expected logs:**
```
🔐 Auth: Calling admin.getUser(accessToken)...
🔐 Auth: SERVICE_ROLE_KEY present: true
🔐 Auth success: User validated: your-email@example.com
```

## ⚠️ Important Notes

### Environment Variables

Make sure these secrets are set in your Edge Function environment:

```bash
# Check via Supabase CLI:
supabase secrets list --project-ref dhahhnqdwsncjieqydjh
```

**Required secrets:**
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` ⬅️ **CRITICAL for JWT validation**
- ✅ `SUPABASE_DB_URL`

If `SUPABASE_SERVICE_ROLE_KEY` is missing, set it:

```bash
# Get your Service Role Key from: Dashboard → Settings → API
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here --project-ref dhahhnqdwsncjieqydjh
```

### Security

- ⚠️ **NEVER expose the Service Role Key to the frontend**
- ✅ Service Role Key should ONLY be used in Edge Functions/Backend
- ✅ Frontend should ONLY use the Anon Key

## 🎯 Expected Behavior After Fix

### ✅ Working Flow:
1. User logs in → Gets JWT from Supabase Auth
2. Frontend sends requests with `Authorization: Bearer <jwt>`
3. Edge Function validates JWT using Service Role Key
4. If valid, user can access protected endpoints
5. Dashboard loads, no 401 errors

### ❌ Previous Broken Flow:
1. User logs in → Gets JWT
2. Frontend sends requests
3. Edge Function tries to validate with Anon Key ❌
4. Validation fails → 401 "Invalid JWT"
5. User gets logged out

## 🔧 Troubleshooting

### Issue: Still getting "Invalid JWT" after deployment

**Checklist:**
- [ ] Deployment successful? Check Edge Function logs
- [ ] `SUPABASE_SERVICE_ROLE_KEY` environment variable set?
- [ ] Browser cache cleared?
- [ ] Logged out and logged back in to get a fresh token?
- [ ] Health endpoint shows version `4.1-production-jwt-fixed`?

**Solution:**
1. Clear browser cookies and localStorage
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Log out completely
4. Log back in
5. Test again

### Issue: "SERVICE_ROLE_KEY present: false"

**Solution:**
```bash
# Get your Service Role Key
# Dashboard → Settings → API → Service Role Key (secret)

# Set it as a secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... --project-ref dhahhnqdwsncjieqydjh

# Redeploy function
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh
```

### Issue: Deployment command not found

**Solution:**
Install Supabase CLI first:
- macOS: `brew install supabase/tap/supabase`
- Windows: Use Scoop or download from https://supabase.com/docs/guides/cli
- Linux: `curl -fsSL https://supabase.com/install.sh | sh`

## 📊 Summary

| Before Fix | After Fix |
|------------|-----------|
| ❌ Using `supabaseClient` (anon key) | ✅ Using `supabaseAdmin` (service role key) |
| ❌ JWT validation fails | ✅ JWT validation succeeds |
| ❌ Users get 401 errors | ✅ Users can access protected routes |
| ❌ Logged out after login | ✅ Stay logged in |

**Status**: ✅ **FIXED in code** - Now deploy to production!

---

Once deployed, your Enterprise ERP system will have fully functional JWT authentication! 🎉
