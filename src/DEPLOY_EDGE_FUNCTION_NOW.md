# 🚀 Deploy Edge Function to Fix JWT Authentication

## Current Status

Your JWT authentication fix is **already implemented** in the code but **NOT YET DEPLOYED** to Supabase.

The verification tests are failing because:
- ❌ Edge Function version: `undefined` (not deployed)
- ❌ Expected version: `4.1-production-jwt-fixed`
- ✅ Code is correct (using `supabaseAdmin.auth.getUser()` with Service Role Key)

## Prerequisites

1. ✅ Supabase Project ID: `dhahhnqdwsncjieqydjh`
2. ✅ Environment secrets configured
3. ✅ JWT fix implemented in code
4. ❌ **NEEDS DEPLOYMENT**

## Deployment Methods

### Option 1: Deploy via Supabase CLI (Recommended)

#### Step 1: Install Supabase CLI

**On macOS/Linux:**
```bash
brew install supabase/tap/supabase
```

**On Windows:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Or with npm:**
```bash
npm install -g supabase
```

#### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window. Follow the prompts to authenticate.

#### Step 3: Link to Your Project

```bash
supabase link --project-ref dhahhnqdwsncjieqydjh
```

You'll be prompted to enter your database password.

#### Step 4: Deploy the Edge Function

```bash
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh
```

#### Step 5: Verify Environment Variables

Make sure these environment variables are set in your Supabase project:

```bash
# Check current secrets
supabase secrets list --project-ref dhahhnqdwsncjieqydjh

# Set secrets if missing
supabase secrets set SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co --project-ref dhahhnqdwsncjieqydjh
supabase secrets set SUPABASE_ANON_KEY=your_anon_key --project-ref dhahhnqdwsncjieqydjh
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key --project-ref dhahhnqdwsncjieqydjh
```

### Option 2: Deploy via Supabase Dashboard

#### Step 1: Prepare the Function Code

1. Navigate to your Supabase Dashboard: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Go to **Edge Functions** in the left sidebar
3. Click **"Create a new function"** or select the existing `make-server-8eebe9eb` function

#### Step 2: Copy the Server Code

Copy the **entire content** from `/supabase/functions/server/index.tsx` into the function editor.

#### Step 3: Add Dependencies

Create a `import_map.json` file with these dependencies:

```json
{
  "imports": {
    "hono": "npm:hono@^4.0.0",
    "hono/cors": "npm:hono/cors",
    "hono/logger": "npm:hono/logger",
    "@supabase/supabase-js": "npm:@supabase/supabase-js@2"
  }
}
```

#### Step 4: Configure Environment Variables

In the Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions**
2. Add these environment variables:
   - `SUPABASE_URL`: `https://dhahhnqdwsncjieqydjh.supabase.co`
   - `SUPABASE_ANON_KEY`: Your anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

You can find your keys at: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/settings/api

#### Step 5: Deploy

Click **"Deploy"** or **"Save"** to deploy the function.

## After Deployment

### Verify the Deployment

1. **Run the verification tests** in your app by visiting the verification page
2. **Or test manually** with curl:

```bash
# Test health endpoint
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2026-02-04T...",
#   "version": "4.1-production-jwt-fixed",
#   "authMethod": "supabaseAdmin.auth.getUser(accessToken) with Service Role Key",
#   "environment": {
#     "supabaseUrl": "https://dhahhnqdwsncjieqydjh.supabase.co",
#     "hasAnonKey": true,
#     "hasServiceKey": true
#   }
# }
```

### Test Protected Endpoint

After logging in, test a protected endpoint:

```bash
# Replace YOUR_ACCESS_TOKEN with your actual token
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "apikey: your_anon_key" \
     https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/auth/test
```

## Troubleshooting

### Error: "Invalid JWT"

**Cause:** Service Role Key not configured or wrong key used

**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
2. Get the correct key from: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/settings/api
3. **Important:** Use the **service_role** key, NOT the anon key

### Error: "Function not found"

**Cause:** Function not deployed or wrong function name

**Solution:**
1. Verify the function name is exactly `make-server-8eebe9eb`
2. Check the Functions page in your Supabase Dashboard
3. Redeploy if needed

### Error: "Missing environment variables"

**Cause:** Environment variables not set in Supabase

**Solution:**
```bash
# Set via CLI
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key --project-ref dhahhnqdwsncjieqydjh

# Or via Dashboard
# Go to Project Settings → Edge Functions → Add secrets
```

### Test Results Still Show "undefined"

**Possible causes:**
1. **Cache issue:** Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. **CORS issue:** Check browser console for CORS errors
3. **Old deployment:** Redeploy the function
4. **Wrong endpoint:** Verify you're calling the correct URL

## Quick Deployment Script

If you have the Supabase CLI installed, you can use this script:

```bash
#!/bin/bash
# File: deploy-edge-function.sh

PROJECT_REF="dhahhnqdwsncjieqydjh"
FUNCTION_NAME="make-server-8eebe9eb"

echo "🚀 Deploying Edge Function..."

# Deploy the function
supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF

# Verify deployment
echo ""
echo "✅ Deployment complete! Verifying..."
curl "https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}/health"

echo ""
echo "📝 Next steps:"
echo "1. Verify environment variables are set"
echo "2. Run verification tests in your app"
echo "3. Test login and protected endpoints"
```

Make it executable and run:

```bash
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

## Expected Outcome

After successful deployment, all verification tests should pass:

- ✅ **Edge Function Deployment:** Version `4.1-production-jwt-fixed` deployed
- ✅ **Service Role Key Configuration:** `hasServiceKey: true`
- ✅ **JWT Validation Method:** Using `supabaseAdmin.auth.getUser()`
- ✅ **Session Availability:** Active session (after login)
- ✅ **Protected Endpoint Access:** Endpoints return 200 OK (after login)

## Need Help?

If you continue to face issues:

1. **Check Supabase Logs:**
   - Dashboard → Edge Functions → Select function → View logs
   
2. **Verify API Keys:**
   - Dashboard → Project Settings → API
   - Ensure you're using the correct service_role key

3. **Test Incrementally:**
   - First: Health endpoint (no auth required)
   - Then: Login/signup
   - Finally: Protected endpoints

---

**Important:** The code is already correct. You just need to deploy it! 🚀
