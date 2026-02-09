# ✅ Deploy Via Supabase CLI (Easiest Method)

## Why Use CLI Instead of Dashboard?

The Supabase Dashboard only accepts **single-file** uploads, but your server code imports multiple files:
- `index.tsx` (main server)
- `kv_store.tsx` (database utilities)  
- `demo-data.tsx` (demo data)

**The Supabase CLI handles multi-file deployment automatically!**

---

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Install Supabase CLI

**Mac/Linux:**
```bash
brew install supabase/tap/supabase
```

**Windows:**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Alternative (all platforms):**
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```
This will open your browser - log in with your Supabase account.

### Step 3: Link to Your Project
```bash
supabase link --project-ref dhahhnqdwsncjieqydjh
```

When prompted, enter your database password (from Supabase dashboard).

### Step 4: Set Environment Variables

Create or update `.env` file in your project root:

```.env
SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c
SUPABASE_SERVICE_ROLE_KEY=[Get from Settings > API > service_role - starts with eyJ]
SUPABASE_DB_URL=[Get from Settings > Database > Connection String (URI) - starts with postgresql://]
```

**Important:** Get your service_role key and DB URL from:
- Dashboard: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
- Settings > API > service_role key (click "Reveal")
- Settings > Database > Connection string (select "URI" format)

### Step 5: Set Secrets in Supabase

```bash
supabase secrets set SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
supabase secrets set SUPABASE_DB_URL=YOUR_DB_URL_HERE
```

Replace `YOUR_SERVICE_ROLE_KEY_HERE` and `YOUR_DB_URL_HERE` with actual values from your dashboard.

### Step 6: Deploy!

```bash
cd /path/to/your/project
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh
```

**That's it!** ✅

---

## 🧪 Verify Deployment

### Test the health endpoint:

```bash
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c"
```

**Expected:** `{"status":"ok","timestamp":"...","message":"Server is running"}`

### Refresh Your Application:
Go back to your ERP application and click **"Retry Connection"** - the error should disappear!

---

## 📂 What Gets Deployed

The CLI automatically bundles and deploys:

```
supabase/functions/server/
├── index.tsx          ← Main server code
├── kv_store.tsx       ← Database utilities  
└── demo-data.tsx      ← Demo data
```

All three files are bundled together automatically!

---

## 🆘 Troubleshooting

### Error: "Function not found"

The function name must be exactly `make-server-8eebe9eb`:

```bash
supabase functions deploy make-server-8eebe9eb
```

### Error: "Project not linked"

Link to your project first:

```bash
supabase link --project-ref dhahhnqdwsncjieqydjh
```

### Error: "Secrets not set"

Make sure you ran the `supabase secrets set` commands for all 4 variables.

Verify secrets are set:

```bash
supabase secrets list
```

### View Logs:

```bash
supabase functions logs make-server-8eebe9eb
```

Or in the dashboard:
Dashboard > Edge Functions > make-server-8eebe9eb > Logs

---

## 🔄 Update Deployment

If you make changes to the server code, redeploy with:

```bash
supabase functions deploy make-server-8eebe9eb
```

---

## 📋 Complete Command Reference

```bash
# Install CLI
npm install -g supabase  # or brew install supabase/tap/supabase

# Login
supabase login

# Link project
supabase link --project-ref dhahhnqdwsncjieqydjh

# Set secrets (all 4 required)
supabase secrets set SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
supabase secrets set SUPABASE_DB_URL=YOUR_DB_URL

# Deploy
supabase functions deploy make-server-8eebe9eb

# Verify
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c"

# View logs
supabase functions logs make-server-8eebe9eb
```

---

## ✅ Advantages of CLI Method

| Feature | Dashboard | CLI |
|---------|-----------|-----|
| Multi-file support | ❌ No | ✅ Yes |
| Auto-bundling | ❌ No | ✅ Yes |
| Version control | ❌ Manual | ✅ Automatic |
| Environment variables | ⚠️ Manual UI | ✅ Command line |
| Redeploy speed | 🐌 Slow | ⚡ Fast |
| Local testing | ❌ No | ✅ Yes |

**Recommendation:** Use CLI for production deployments!

---

## 🎯 Summary

1. **Install Supabase CLI** (one-time)
2. **Login** (one-time)
3. **Link project** (one-time)
4. **Set 4 secrets** (one-time)
5. **Deploy** (5 seconds!)
6. **Refresh your app** - Done! ✅

**Total setup time:** 5-10 minutes
**Future deploys:** 5 seconds!

---

**Ready to deploy? Run these commands now!** 🚀

```bash
# Quick start
npm install -g supabase
supabase login
supabase link --project-ref dhahhnqdwsncjieqydjh
supabase functions deploy make-server-8eebe9eb
```
