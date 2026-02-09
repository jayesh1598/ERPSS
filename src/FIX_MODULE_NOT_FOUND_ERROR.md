# ✅ Fix "Module not found" Error

## The Error You Saw

```
Failed to deploy edge function: Failed to bundle the function 
(reason: Module not found "file:///tmp/.../kv_store.tsx"
```

---

## 🔍 What This Means

Your server code (`index.tsx`) imports two other files:
- `kv_store.tsx` - Database utilities
- `demo-data.tsx` - Demo data

The **Supabase Dashboard** only accepts single-file uploads, so it can't find these imported files!

---

## ✅ Solution: Use Supabase CLI

The **Supabase CLI** automatically bundles all files together.

### Quick Steps:

1. **Install CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login:**
   ```bash
   supabase login
   ```

3. **Link project:**
   ```bash
   supabase link --project-ref dhahhnqdwsncjieqydjh
   ```

4. **Set environment variables:**
   ```bash
   supabase secrets set SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co
   supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[Get from dashboard]
   supabase secrets set SUPABASE_DB_URL=[Get from dashboard]
   ```

5. **Deploy:**
   ```bash
   supabase functions deploy make-server-8eebe9eb
   ```

**Done!** ✅

---

## 📖 Detailed Instructions

See **`/DEPLOY_VIA_CLI.md`** for complete step-by-step guide.

---

## 🎯 Why This Happens

### File Structure:
```
supabase/functions/server/
├── index.tsx          ← Main file (imports the others)
├── kv_store.tsx       ← Imported by index.tsx
└── demo-data.tsx      ← Imported by index.tsx
```

### Dashboard Upload:
- ❌ Only uploads `index.tsx`
- ❌ Can't find `kv_store.tsx` or `demo-data.tsx`
- ❌ Deployment fails

### CLI Deployment:
- ✅ Reads all files in the directory
- ✅ Automatically bundles them together
- ✅ Deployment succeeds!

---

## ⏱️ Time Required

- **First time:** 10 minutes (install CLI, setup)
- **Future deploys:** 5 seconds

---

## 🆘 Alternative: Create Single File (Not Recommended)

If you really can't use CLI, I can create a single bundled file with all code combined.

**But CLI is much easier and better!**

---

## 📋 Get Required Values

### SUPABASE_SERVICE_ROLE_KEY:
1. Go to: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Click: Settings > API
3. Find: "service_role" section
4. Click: "Reveal" button
5. Copy: The key (starts with `eyJ...`)

### SUPABASE_DB_URL:
1. Go to: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Click: Settings > Database
3. Find: "Connection string" section
4. Select: "URI" format
5. Copy: The full URL (starts with `postgresql://`)

---

## ✅ Verify Deployment

After deploying, test:

```bash
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c"
```

**Expected:** `{"status":"ok",...}`

Then refresh your application - error gone! ✅

---

## 📚 More Help

- **Complete CLI Guide:** `/DEPLOY_VIA_CLI.md`
- **Deployment Checklist:** `/DEPLOY_NOW_CHECKLIST.md`
- **General Guide:** `/START_HERE.md`

---

**Bottom Line:** Use Supabase CLI - it handles multi-file projects automatically! 🚀
