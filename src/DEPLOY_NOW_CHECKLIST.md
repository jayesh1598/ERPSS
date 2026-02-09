# 🚀 Deploy Your Edge Function - Quick Checklist

## ✅ Your Credentials Are Ready!

Your application is already configured with:
- ✅ Project ID: `dhahhnqdwsncjieqydjh`
- ✅ Anon Key: Configured and working
- ✅ Code: Ready to deploy

## 📝 Deployment Checklist

### Step 1: Go to Supabase Dashboard
🔗 https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh

### Step 2: Navigate to Edge Functions
- [ ] Click **"Edge Functions"** in the left sidebar
- [ ] Click **"Deploy New Function"** or **"Create Function"**

### Step 3: Create the Function
- [ ] Function Name: `make-server-8eebe9eb`
- [ ] Click **"Create"** or **"Next"**

### Step 4: Copy the Server Code
You need to copy 3 files:

#### File 1: Main Server Code
- [ ] Open `/supabase/functions/server/index.tsx` in this project
- [ ] Copy **ALL** the code (entire file)
- [ ] Paste into the function editor

#### File 2: KV Store (if needed)
- [ ] The editor might ask for additional files
- [ ] Copy `/supabase/functions/server/kv_store.tsx`
- [ ] Upload as `kv_store.tsx`

#### File 3: Demo Data (if needed)
- [ ] Copy `/supabase/functions/server/demo-data.tsx`
- [ ] Upload as `demo-data.tsx`

### Step 5: Set Environment Variables

Click on **"Secrets"** or **"Environment Variables"** and add:

#### Variables You Already Have:
- [ ] `SUPABASE_URL` = `https://dhahhnqdwsncjieqydjh.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c`

#### Variables You Need to Get:
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 
  - Go to Settings > API
  - Copy the **service_role** key (⚠️ Keep secret!)
  
- [ ] `SUPABASE_DB_URL`
  - Go to Settings > Database
  - Under "Connection string", select **URI**
  - Copy the full connection string

### Step 6: Deploy!
- [ ] Click **"Deploy Function"** or **"Save and Deploy"**
- [ ] Wait for deployment to complete (usually 10-30 seconds)

### Step 7: Verify Deployment

#### Test in Browser:
- [ ] Open: https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
- [ ] Should see: `{"status":"ok","timestamp":"...","message":"Server is running"}`

#### Test in Application:
- [ ] Refresh your application page
- [ ] Health check should pass (green message or disappear)
- [ ] Try logging in
- [ ] Try creating a warehouse or other master data

### Step 8: Troubleshooting (if needed)
If deployment fails or tests fail:

- [ ] Check Edge Function logs: Dashboard > Edge Functions > make-server-8eebe9eb > Logs
- [ ] Check browser console: Press F12 > Console tab
- [ ] Verify all 4 environment variables are set
- [ ] Check that project is not paused (free tier projects pause after inactivity)

---

## 🎯 Expected Timeline

- **Deployment**: 2-5 minutes
- **First test**: Immediate
- **Full application working**: Immediately after deployment

---

## 📋 Quick Copy-Paste Values

```
Function Name:
make-server-8eebe9eb

SUPABASE_URL:
https://dhahhnqdwsncjieqydjh.supabase.co

SUPABASE_ANON_KEY:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c
```

---

## ✅ Success Indicators

You'll know deployment worked when:
1. Health endpoint returns 200 OK
2. Application shows "Server is healthy" (or no error message)
3. Login page loads without 401 errors
4. You can successfully login and use the application

---

## 🆘 Need Help?

- **Can't find Edge Functions?** Make sure you're in the correct project
- **Deployment fails?** Check the deployment logs for specific error
- **Still getting 401?** Verify environment variables are set correctly
- **Other issues?** Check `/DEPLOYMENT_GUIDE.md` for detailed troubleshooting

---

**Ready?** Go to https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh and start with Step 2! 🚀
