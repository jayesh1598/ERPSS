# JWT Authentication Error - Quick Fix Guide

## The Problem
You're seeing "Invalid JWT" errors when trying to access dashboard and other endpoints after admin login.

## Diagnosis Steps

### Step 1: Test Your JWT
1. **Login to your admin account** at `/admin-login`
2. **Navigate to** `/jwt-debug`
3. **Click "Run JWT Tests"**
4. **Review the results** - this will show you exactly where the JWT validation is failing

### Step 2: Check Server Logs
After running the JWT debug tests, check your Supabase Edge Function logs:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → `make-server-8eebe9eb`
3. Click on "Logs"
4. Look for error messages starting with "🔐 Auth failed:"

## Common Causes & Solutions

### Cause 1: Token Not Being Sent
**Symptoms:** "No Authorization header" or "Empty token"  
**Solution:**
- Log out completely
- Clear browser cache/cookies
- Log back in
- Check that `localStorage` has the Supabase session

### Cause 2: Token Expired
**Symptoms:** "Token expired" or time-related errors  
**Solution:**
- The app should auto-refresh tokens
- Try logging out and back in
- Check the token expiry time in JWT Debug tool

### Cause 3: Service Role Key Issue
**Symptoms:** "Invalid JWT" consistently, even with fresh login  
**Solution:**
1. Verify Supabase environment variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. These should be automatically set for your project
3. Check Edge Function logs to confirm they're present

### Cause 4: Wrong Supabase Project
**Symptoms:** "Invalid JWT" - token is for different project  
**Solution:**
- Confirm your Project ID in `/utils/supabase/info.tsx` matches your Supabase project
- Current Project ID: `dhahhnqdwsncjieqydjh`

### Cause 5: Session Storage Issue
**Symptoms:** Login succeeds but APIs fail immediately  
**Solution:**
```javascript
// Open browser console and run:
localStorage.clear();
// Then log in again
```

## Quick Fix (Works 90% of the time)

```bash
1. Open browser DevTools Console (F12)
2. Run: localStorage.clear()
3. Close browser completely
4. Reopen and go to /admin-login
5. Login with fresh credentials
6. Test /jwt-debug to verify
```

## Manual Token Test

If you want to manually test your token:

```javascript
// 1. Get your current token (in browser console)
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session?.access_token);

// 2. Test it against the backend
fetch('https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/debug/validate-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'apikey': 'your-anon-key',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

## Expected Behavior

### ✅ Successful Auth Flow:
```
1. User enters credentials at /admin-login
2. Supabase creates session with JWT
3. JWT stored in localStorage
4. Frontend sends JWT in Authorization header
5. Backend validates JWT with Service Role Key
6. Backend returns user data
7. User accesses dashboard
```

### ❌ Failed Auth Flow (Current):
```
1. User enters credentials at /admin-login ✅
2. Supabase creates session with JWT ✅
3. JWT stored in localStorage ✅
4. Frontend sends JWT in Authorization header ✅
5. Backend validates JWT ❌ FAILS HERE
   - Error: "Invalid JWT"
   - Check: Is SERVICE_ROLE_KEY configured?
   - Check: Is JWT format correct?
```

## Debug Output Interpretation

When you run `/jwt-debug`, here's what each test means:

### Test 1: Session Check
- **Pass**: Session exists and is valid
- **Fail**: No session or expired session → Log in again

### Test 2: Access Token
- **Pass**: Token retrieved successfully
- **Fail**: Can't get token → Session storage issue

### Test 3: Backend Token Validation
- **Pass**: Server can validate your JWT
- **Fail**: Server rejects JWT → Check server logs

### Test 4: Auth Me Endpoint
- **Pass**: Can retrieve user details
- **Fail**: Auth middleware blocking request

### Test 5: User Metadata
- **Pass**: User metadata includes role info
- **Fail**: User not properly created

## Still Having Issues?

### Option 1: Fresh Admin Setup
```bash
1. Go to Supabase Dashboard → Authentication → Users
2. Delete the admin user manually
3. Go to Supabase Dashboard → Database → KV Store
4. Delete records: 
   - admin:* 
   - user:*
5. Go to /admin-setup
6. Create admin again
7. Login at /admin-login
```

### Option 2: Check Edge Function Deployment
```bash
# The edge function should be deployed at:
https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb

# Test health endpoint:
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

### Option 3: Verify Environment
```bash
# In browser console, check:
console.log('Project ID:', projectId); // Should be: dhahhnqdwsncjieqydjh
console.log('Has Anon Key:', !!publicAnonKey); // Should be: true
```

## Next Steps

1. **First**, try the "Quick Fix" above
2. **Then**, run `/jwt-debug` to see specific errors
3. **Check** server logs in Supabase Dashboard
4. **If still failing**, share the JWT Debug output

---

## Technical Details (For Advanced Users)

### JWT Validation Flow:
```typescript
// Frontend (lib/api.ts)
const token = await getAccessToken(); // Gets JWT from session
headers['Authorization'] = `Bearer ${token}`;

// Backend (supabase/functions/server/index.tsx)
const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
// ^ This uses SERVICE_ROLE_KEY to validate the JWT
```

### Required Headers:
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <JWT_TOKEN>',
  'apikey': '<ANON_KEY>'
}
```

### Supabase Client Setup:
```typescript
// Frontend client (lib/api.ts)
const supabase = createClient(supabaseUrl, anonKey);

// Backend client (supabase/functions/server/index.tsx)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
```

The SERVICE_ROLE_KEY allows the backend to validate ANY JWT issued by your Supabase project, which is why it's essential for the auth middleware.
