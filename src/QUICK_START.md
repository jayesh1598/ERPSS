# 🚀 Quick Start - Testing Your Edge Function

## The Situation

You see `{"code":401,"message":"Missing authorization header"}` in your browser.

**This is NORMAL!** ✅ It means your Edge Function is likely deployed, but browsers don't send the required `apikey` header.

## Quick Test (30 seconds)

### Option 1: Use the Test Page (Easiest)

1. Open `/test-connection.html` in your browser
2. It will automatically test the connection with proper headers
3. You'll see if the function is working

### Option 2: Use cURL (Most Reliable)

Copy and paste this into your terminal:

```bash
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c"
```

## What the Results Mean

### ✅ Success (HTTP 200)
```json
{"status":"ok","timestamp":"...","message":"Server is running"}
```

**Meaning:** Edge Function is deployed and working!
**Next step:** Refresh your application - it will work perfectly

---

### ❌ Not Found (HTTP 404)
```json
{"msg":"Function not found"}
```

**Meaning:** Edge Function is not deployed yet
**Next step:** Deploy it - see instructions below

---

### ❌ Unauthorized (HTTP 401)
```json
{"code":401,"message":"Missing authorization header"}
```

**If you see this in browser:** Normal - browsers don't send the apikey header
**If you see this with cURL:** The apikey might be incorrect or expired

---

## If Function is NOT Deployed

### Deploy via Supabase Dashboard (5 minutes)

1. **Go to:** https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh

2. **Click:** Edge Functions (left sidebar)

3. **Create Function:**
   - Name: `make-server-8eebe9eb`
   - Click "Create"

4. **Upload Code:**
   - Copy all code from `/supabase/functions/server/index.tsx`
   - Paste into the editor
   - Click "Deploy"

5. **Set Environment Variables:**
   Click "Secrets" and add:
   
   | Variable | Value | Where to get it |
   |----------|-------|-----------------|
   | SUPABASE_URL | https://dhahhnqdwsncjieqydjh.supabase.co | Known |
   | SUPABASE_ANON_KEY | eyJhbGciOiJI... | Settings > API |
   | SUPABASE_SERVICE_ROLE_KEY | Get from dashboard | Settings > API (service_role) |
   | SUPABASE_DB_URL | Get from dashboard | Settings > Database |

6. **Test Again:** Run the cURL command above

---

## Application Testing

Once the Edge Function is deployed:

1. **Refresh** your application page
2. Health check should pass automatically (green message)
3. You can login and use the system

The application **already includes the apikey header** in all requests, so it will work without any 401 errors!

---

## Troubleshooting

### "I don't have cURL"

**Windows:**
- cURL is built-in on Windows 10+ (use Command Prompt or PowerShell)
- Or download from: https://curl.se/windows/

**Mac/Linux:**
- cURL is pre-installed

**Alternative:**
- Use `/test-connection.html` file instead
- Or use Postman/Insomnia

### "How do I get my service_role key?"

1. Go to: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Click: Settings > API
3. Find: "service_role" section
4. Click: "Reveal" and copy the key
5. ⚠️ Keep this secret! Don't share it publicly

### "Where's my database URL?"

1. Go to: Settings > Database
2. Find: "Connection string"
3. Select: "URI" format
4. Copy the full string

---

## Files & Guides

- **`/test-connection.html`** - Interactive test page
- **`/DEPLOYMENT_GUIDE.md`** - Complete deployment instructions
- **`/SUPABASE_APIKEY_REQUIRED.md`** - Why apikey is required
- **`/DEPLOY_NOW_CHECKLIST.md`** - Step-by-step checklist

---

## Summary

1. **Test with cURL or test page** (see above)
2. **If 200 OK:** You're done! Refresh your app
3. **If 404:** Deploy the function (5 min process)
4. **If other error:** Check Edge Function logs in dashboard

---

## Support

- **Supabase Dashboard:** https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
- **Edge Function Logs:** Dashboard > Edge Functions > make-server-8eebe9eb > Logs
- **Browser Console:** Press F12 > Console tab for detailed errors

---

**Quick Test:** Run the cURL command above right now! 🚀
