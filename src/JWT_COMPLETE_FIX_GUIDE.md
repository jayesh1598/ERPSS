# 🚨 JWT Authentication Error - Complete Fix Guide

## Quick Fix (Try This First!)

```bash
# Step 1: Clear everything and start fresh
1. Open browser console (F12)
2. Run: localStorage.clear()
3. Close browser completely
4. Reopen browser

# Step 2: Run system checks
1. Navigate to: /setup-verification
2. Click "Run System Checks"
3. Review all results

# Step 3: Test authentication
1. Go to: /admin-login
2. Login with your admin credentials
3. Navigate to: /jwt-debug
4. Click "Run JWT Tests"
5. Review results

# Step 4: If still failing
Check Supabase Edge Function logs for specific errors
```

---

## Diagnostic Tools Available

### 🔍 `/setup-verification`
**Purpose:** Verify system configuration  
**Checks:**
- Frontend config (Project ID, API keys)
- Backend API health
- Supabase client status
- Current session
- JWT token availability

**When to use:** Before doing anything else - this tells you if your system is properly set up.

### 🧪 `/jwt-debug`
**Purpose:** Test JWT authentication flow  
**Tests:**
- Session retrieval
- Token extraction
- Backend token validation
- Auth endpoints
- User metadata

**When to use:** After login, when you're getting "Invalid JWT" errors.

### 🏥 `/test-auth`
**Purpose:** Simple auth test (from previous fixes)  
**When to use:** Quick check if auth is working at all.

---

## Understanding the Error

### What's Happening:
```
1. You login ✅
2. Supabase creates JWT ✅
3. JWT stored in browser ✅
4. Frontend sends JWT to API ✅
5. Backend tries to validate JWT ❌ FAILS
   └─> Error: "Invalid JWT"
```

### Why It's Failing:
The backend auth middleware uses `supabaseAdmin.auth.getUser(token)` to validate JWTs. This requires:

1. ✅ `SUPABASE_URL` environment variable
2. ✅ `SUPABASE_SERVICE_ROLE_KEY` environment variable  
3. ✅ Valid JWT format
4. ❌ Something is wrong with one of these

---

## Detailed Investigation Steps

### Step 1: Verify Environment Variables

Your Supabase secrets should be automatically configured:
- Project ID: `dhahhnqdwsncjieqydjh`
- Supabase URL: `https://dhahhnqdwsncjieqydjh.supabase.co`
- These are set during deployment

**Check in Supabase Dashboard:**
1. Go to Settings → API
2. Verify Project URL matches
3. Copy anon/public key
4. Copy service_role key (keep secret!)

### Step 2: Check Edge Function Deployment

```bash
# Test health endpoint (should return JSON)
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-02-05T...",
  "version": "4.1-production-jwt-fixed",
  ...
  "environment": {
    "supabaseUrl": "https://dhahhnqdwsncjieqydjh.supabase.co",
    "hasAnonKey": true,
    "hasServiceKey": true  # <-- This should be TRUE
  }
}
```

**If `hasServiceKey` is FALSE**, that's your problem!

**Solution:**
```bash
# Redeploy the Edge Function with proper environment variables
# In Supabase Dashboard:
# 1. Edge Functions → make-server-8eebe9eb → Settings
# 2. Verify these secrets exist:
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
# 3. If missing, add them and redeploy
```

### Step 3: Test Token Manually

```javascript
// Open browser console after logging in
// Run this code:

const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Token:', session?.access_token);

// Test token against backend
const response = await fetch(
  'https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/debug/validate-token',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'apikey': 'your-anon-key-here',
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
console.log('Validation result:', result);
```

**Expected result:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": "...",
    "email": "admin@company.com",
    "metadata": { "role": "admin" }
  }
}
```

**If you get an error**, note the specific error message - it tells you exactly what's wrong.

---

## Common Error Messages & Solutions

### Error: "No Authorization header"
**Cause:** Token not being sent  
**Solution:** Check `lib/api.ts` - the `getAccessToken()` function should be called

### Error: "Invalid JWT: jwt malformed"
**Cause:** Token format is wrong  
**Solution:**  
- Log out and log in again
- Clear localStorage
- Check if token is being properly extracted

### Error: "Invalid JWT: jwt expired"
**Cause:** Token has expired  
**Solution:**  
- Should auto-refresh (check `lib/api.ts`)
- Log out and log in again to get fresh token

### Error: "Invalid JWT" (generic)
**Cause:** Backend can't validate the token  
**Solution:**  
1. **Most Common:** SERVICE_ROLE_KEY not set in Edge Function
   - Go to Supabase Dashboard
   - Edge Functions → make-server-8eebe9eb → Settings
   - Add SUPABASE_SERVICE_ROLE_KEY secret
   - Redeploy function

2. Token is for wrong Supabase project
   - Check Project ID matches everywhere

3. Supabase client misconfigured
   - Verify `lib/api.ts` and `supabase/functions/server/index.tsx`

---

## The Root Cause (Most Likely)

Based on your error ("Invalid JWT" with 401 status), the most likely cause is:

### ✅ **SERVICE_ROLE_KEY Not Set in Edge Function**

**Why this matters:**
- The backend needs the SERVICE_ROLE_KEY to validate JWTs
- Without it, `supabaseAdmin.auth.getUser()` fails
- This causes all API calls to return 401 errors

**How to fix:**
1. Go to Supabase Dashboard
2. Edge Functions → `make-server-8eebe9eb`
3. Settings → Secrets
4. Ensure these secrets exist:
   - `SUPABASE_URL` = `https://dhahhnqdwsncjieqydjh.supabase.co`
   - `SUPABASE_ANON_KEY` = (your anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
5. Click "Redeploy" or save changes

**Note:** According to your message, you said these secrets are "already configured", but let's verify they're actually accessible to the Edge Function.

---

## Verification Checklist

Run through these in order:

- [ ] 1. Run `/setup-verification` - all checks pass?
- [ ] 2. Check `/health` endpoint - `hasServiceKey: true`?
- [ ] 3. Login at `/admin-login` - successful?
- [ ] 4. Run `/jwt-debug` - all 5 tests pass?
- [ ] 5. Navigate to `/` (dashboard) - loads without errors?

If any step fails, that's where the issue is.

---

## Advanced Debugging

### Enable Detailed Logging

The backend already has detailed logging. To see it:
1. Go to Supabase Dashboard
2. Edge Functions → `make-server-8eebe9eb`
3. Click "Logs"
4. Try to login/access dashboard
5. Look for lines starting with "🔐 Auth:"

**What to look for:**
```
✅ Good:
🔐 Auth: Validating token, length: 267
🔐 Auth: Calling admin.getUser(accessToken)...
🔐 Auth: Using SUPABASE_URL: https://...
🔐 Auth: SERVICE_ROLE_KEY present: true
🔐 Auth success: User validated: admin@company.com

❌ Bad:
🔐 Auth failed: Token verification error: Invalid JWT
🔐 Auth failed: Error message: jwt malformed
```

### Check Frontend Network Tab

1. Open DevTools → Network tab
2. Try to access dashboard
3. Look for requests to `/make-server-8eebe9eb/...`
4. Click on a failed request
5. Check Headers → Request Headers → Authorization
6. Should see: `Bearer eyJhbGc...` (long token)

---

## If All Else Fails

### Nuclear Option: Fresh Setup

```bash
# 1. Clear everything
localStorage.clear();

# 2. Delete admin user from Supabase Dashboard
# Go to: Authentication → Users → Delete admin user

# 3. Recreate admin
# Go to: /admin-setup
# Create new admin account

# 4. Login fresh
# Go to: /admin-login
# Login with new credentials

# 5. Test immediately
# Go to: /jwt-debug
# Run tests
```

---

## Contact Info for Support

If you're still stuck after trying all the above:

1. **Share the output from `/jwt-debug`**
2. **Share the output from `/setup-verification`**
3. **Share logs from Supabase Edge Function** (the 🔐 Auth lines)
4. **Share any error messages from browser console**

This will help diagnose the exact issue.

---

## Summary

**Most Likely Issue:** SERVICE_ROLE_KEY not accessible to Edge Function  
**Quick Fix:** Verify secrets in Supabase Dashboard → Edge Functions → Settings  
**Test Tools:** `/setup-verification`, `/jwt-debug`  
**Nuclear Option:** Clear everything and recreate admin account  

**90% of JWT issues are solved by:**
1. Clearing localStorage
2. Logging out/in fresh
3. Verifying SERVICE_ROLE_KEY is set
4. Redeploying Edge Function

Good luck! 🚀
