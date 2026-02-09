# 🚀 Deploy JWT Authentication Fix

## Quick Start - Deploy Now

The JWT authentication error has been fixed in the code. Now you need to **deploy the updated Edge Function** to Supabase.

## Option 1: Deploy via Supabase CLI (Recommended)

### Step 1: Ensure CLI is installed
```bash
# Check if installed
supabase --version

# If not installed, install it:
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Deploy the function
```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy the Edge Function
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh

# The CLI will prompt for your access token if not already logged in
```

### Step 3: Verify deployment
```bash
# Check function status
supabase functions list --project-ref dhahhnqdwsncjieqydjh
```

## Option 2: Deploy via Supabase Dashboard

### Step 1: Prepare the function code
1. Zip the `/supabase/functions/server/` directory
2. Or copy the contents of `/supabase/functions/server/index.tsx`

### Step 2: Deploy through Dashboard
1. Go to https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Navigate to **Edge Functions** in the sidebar
3. Find `make-server-8eebe9eb` function
4. Click **Deploy New Version**
5. Upload your code or paste it
6. Click **Deploy**

## Option 3: GitHub Integration (If Set Up)

If you have GitHub integration enabled:
1. Commit the changes to your repository:
   ```bash
   git add supabase/functions/server/index.tsx
   git commit -m "Fix: Use Service Role Key for JWT validation"
   git push origin main
   ```
2. Supabase will auto-deploy the function

## Verify the Fix is Live

### Test 1: Check Health Endpoint
```bash
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

Expected response:
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

### Test 2: Log In and Access Dashboard
1. Open your app: `https://dhahhnqdwsncjieqydjh.supabase.co`
2. Log in with your credentials
3. Navigate to Dashboard
4. ✅ You should see statistics without 401 errors
5. ✅ Check browser console - no "Invalid JWT" errors

### Test 3: Check Edge Function Logs
1. Go to Supabase Dashboard → Edge Functions → `make-server-8eebe9eb` → Logs
2. After logging in, you should see:
   ```
   🔐 Auth: Calling admin.getUser(accessToken)...
   🔐 Auth: SERVICE_ROLE_KEY present: true
   🔐 Auth success: User validated: your-email@example.com
   ```

## Environment Variables Check

Before deploying, ensure these secrets are set in your Edge Function:

```bash
# Check via CLI
supabase secrets list --project-ref dhahhnqdwsncjieqydjh

# You should see:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_DB_URL
```

If any are missing, set them:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key --project-ref dhahhnqdwsncjieqydjh
```

## Troubleshooting

### Issue: "Function not found"
**Solution**: Make sure you're deploying to the correct project:
```bash
supabase link --project-ref dhahhnqdwsncjieqydjh
```

### Issue: "Permission denied"
**Solution**: Log in to Supabase CLI:
```bash
supabase login
```

### Issue: Still getting 401 errors after deployment
**Checklist**:
1. [ ] Did the deployment succeed? Check Edge Function logs
2. [ ] Is `SUPABASE_SERVICE_ROLE_KEY` set in Edge Function secrets?
3. [ ] Clear browser cache and cookies
4. [ ] Log out and log back in to get a fresh token
5. [ ] Check Edge Function logs for error details

### Issue: "SERVICE_ROLE_KEY present: false"
**Solution**: Set the service role key:
1. Get your Service Role Key from: Dashboard → Settings → API
2. Set it as a secret:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key-here --project-ref dhahhnqdwsncjieqydjh
   ```
3. Redeploy the function

## Files Modified

For reference, the following files were updated with the JWT fix:
- ✅ `/supabase/functions/server/index.tsx` (Authentication middleware)

No frontend changes were needed - the issue was purely server-side.

## Summary

1. **Deploy** the Edge Function using one of the methods above
2. **Verify** deployment by checking the health endpoint
3. **Test** by logging in and accessing the dashboard
4. **Monitor** Edge Function logs to confirm successful authentication

Once deployed, your JWT authentication errors should be completely resolved! 🎉
