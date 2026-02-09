# 🚀 Edge Function Deployment Guide

## The 401 Error Issue

You're seeing "Server returned 401" because the Supabase Edge Function is either:
1. Not deployed yet
2. Not properly configured
3. Missing required environment variables

## ✅ Step-by-Step Deployment

### Option 1: Deploy via Supabase Dashboard (Recommended)

#### Step 1: Create the Edge Function
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `dhahhnqdwsncjieqydjh`
3. Navigate to **Edge Functions** in the left sidebar
4. Click **"New Function"**
5. Name it: `make-server-8eebe9eb`

#### Step 2: Upload the Function Code
1. In the Edge Function editor, paste the entire content from `/supabase/functions/server/index.tsx`
2. Make sure to also upload `/supabase/functions/server/kv_store.tsx` and `/supabase/functions/server/demo-data.tsx` if the function imports them
3. Click **"Deploy"**

#### Step 3: Set Environment Variables
1. In the Edge Function settings, click **"Secrets"**
2. Add these environment variables:
   - `SUPABASE_URL`: Your project URL (https://dhahhnqdwsncjieqydjh.supabase.co)
   - `SUPABASE_SERVICE_ROLE_KEY`: From Settings > API > service_role key
   - `SUPABASE_ANON_KEY`: From Settings > API > anon/public key
   - `SUPABASE_DB_URL`: Your database connection string

3. **Save** the secrets

#### Step 4: Verify Deployment
1. Go to Edge Functions > `make-server-8eebe9eb` > **Logs**
2. You should see "Function deployed successfully"
3. Test the health endpoint:
   ```
   https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
   ```

---

### Option 2: Deploy via Supabase CLI

#### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Or with Homebrew
brew install supabase/tap/supabase
```

#### Step 1: Login to Supabase
```bash
supabase login
```

#### Step 2: Link Your Project
```bash
supabase link --project-ref dhahhnqdwsncjieqydjh
```

#### Step 3: Set Environment Variables
```bash
# Create a .env file in your project root
cat > .env << EOF
SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_DB_URL=your_db_connection_string_here
EOF
```

Then set them in Supabase:
```bash
supabase secrets set SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_DB_URL=your_db_connection_string
```

#### Step 4: Deploy the Function
```bash
supabase functions deploy make-server-8eebe9eb
```

#### Step 5: Verify
```bash
# Test the health endpoint
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health \
  -H "apikey: YOUR_ANON_KEY"
```

---

## 🔑 Getting Your Keys

### Where to Find Keys:
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `dhahhnqdwsncjieqydjh`
3. Go to **Settings** > **API**
4. You'll find:
   - **Project URL**: `https://dhahhnqdwsncjieqydjh.supabase.co`
   - **anon/public key**: Copy the `anon` key
   - **service_role key**: Copy the `service_role` key (⚠️ Keep this secret!)

### Database URL:
1. Go to **Settings** > **Database**
2. Under "Connection string", select **URI**
3. Copy the connection string

---

## 🧪 Testing the Deployment

### Test 1: Health Check (Browser)
Open this URL in your browser:
```
https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "message": "Server is running"
}
```

### Test 2: cURL Command
```bash
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY_HERE"
```

### Test 3: Check Logs
```bash
# Via CLI
supabase functions logs make-server-8eebe9eb

# Or in Dashboard
# Edge Functions > make-server-8eebe9eb > Logs
```

---

## ❌ Common Issues & Solutions

### Issue 1: "Function not found"
**Cause**: Function not deployed
**Solution**: Deploy using dashboard or CLI (see steps above)

### Issue 2: "Invalid API key"
**Cause**: Missing or incorrect anon key
**Solution**: Add `apikey` header with your anon key from Settings > API

### Issue 3: "Internal Server Error"
**Cause**: Missing environment variables
**Solution**: Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc. in Function Secrets

### Issue 4: "Module not found" errors
**Cause**: Dependencies (kv_store.tsx, demo-data.tsx) not uploaded
**Solution**: Ensure all files in `/supabase/functions/server/` are deployed together

### Issue 5: "CORS error"
**Cause**: CORS not configured
**Solution**: Already configured in the code. Check Edge Function logs for details.

---

## 📋 Deployment Checklist

- [ ] Edge Function created in Supabase Dashboard
- [ ] Function code uploaded (index.tsx, kv_store.tsx, demo-data.tsx)
- [ ] Environment variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
- [ ] Function deployed successfully
- [ ] Health check endpoint returns 200 OK
- [ ] Browser console shows "Server health check passed"
- [ ] Application loads without 401 errors

---

## 🆘 Still Having Issues?

### Check These:

1. **Supabase Project Status**
   - Dashboard > Home
   - Ensure project is not paused (free tier pauses after inactivity)

2. **Edge Function Logs**
   - Dashboard > Edge Functions > make-server-8eebe9eb > Logs
   - Look for deployment errors or runtime errors

3. **Browser Console**
   - Press F12 > Console tab
   - Look for detailed error messages
   - Check Network tab for request/response details

4. **Database Connection**
   - Settings > Database
   - Ensure database is running and accessible

### Get Help:
- Supabase Discord: https://discord.supabase.com
- Supabase Docs: https://supabase.com/docs/guides/functions
- Check deployment logs in Dashboard

---

## ✨ After Successful Deployment

Once deployed, you should see:
1. ✅ Green "Server is healthy" message on login page
2. ✅ No 401 errors in browser console
3. ✅ Ability to login and access the application
4. ✅ Master data operations (create warehouse, etc.) working correctly

---

**Need Help?** Check the browser console (F12) for detailed error messages and include them when seeking support.
