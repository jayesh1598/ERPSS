# Testing Your Supabase Connection

## Your Current Configuration ✅

- **Project ID**: `dhahhnqdwsncjieqydjh`
- **Project URL**: `https://dhahhnqdwsncjieqydjh.supabase.co`
- **Anon Key**: Configured ✅

## Test the Connection

### Option 1: Test in Browser (Easiest)

Open this URL in your browser:
```
https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

### Option 2: Test with cURL

```bash
curl -i https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWhobnFkd3NuY2ppZXF5ZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDI4MDIsImV4cCI6MjA4NTUxODgwMn0.UP_FqohTLEuKepdz2_nz5PnIYB8gQBJ0B1IYDhVYz1c"
```

## Expected Results

### If Edge Function IS Deployed:
```json
HTTP/1.1 200 OK
{
  "status": "ok",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "message": "Server is running"
}
```

### If Edge Function NOT Deployed:
```json
HTTP/1.1 404 Not Found
{
  "msg": "Function not found"
}
```

OR

```json
HTTP/1.1 401 Unauthorized
{
  "error": "Unauthorized"
}
```

## Next Steps

### If You Get 200 OK ✅
Great! The Edge Function is deployed. Just refresh your application and it should work.

### If You Get 404 or 401 ❌
The Edge Function needs to be deployed. Follow the deployment guide:

1. Go to https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Click **Edge Functions** in the left sidebar
3. Click **Deploy New Function**
4. Name: `make-server-8eebe9eb`
5. Copy the code from `/supabase/functions/server/index.tsx`
6. Set environment variables (see below)
7. Click Deploy

### Environment Variables Required

In the Edge Function settings, add these secrets:

| Variable Name | Value | Where to Find |
|--------------|-------|---------------|
| `SUPABASE_URL` | `https://dhahhnqdwsncjieqydjh.supabase.co` | Known |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJI...` (your anon key) | Settings > API > anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Get from dashboard | Settings > API > service_role |
| `SUPABASE_DB_URL` | Get from dashboard | Settings > Database > Connection String |

**To get service_role key and DB URL:**
1. Dashboard > Project Settings > API
2. Copy `service_role` key (⚠️ Keep this secret!)
3. Go to Database section
4. Copy connection string (URI format)

## Deploy Using Supabase CLI (Alternative)

If you have the CLI installed:

```bash
# Login
supabase login

# Link project
supabase link --project-ref dhahhnqdwsncjieqydjh

# Set secrets
supabase secrets set SUPABASE_URL=https://dhahhnqdwsncjieqydjh.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
supabase secrets set SUPABASE_DB_URL=your_db_url_here

# Deploy
supabase functions deploy make-server-8eebe9eb
```

## Verify Deployment

After deploying, test again with the browser or cURL command above. You should get a 200 OK response.

Then refresh your application - the health check should pass and you'll be able to login!

---

**Need Help?** 
- Check Edge Function logs in Dashboard > Edge Functions > make-server-8eebe9eb > Logs
- See `/DEPLOYMENT_GUIDE.md` for detailed instructions
- Check browser console (F12) for error details
