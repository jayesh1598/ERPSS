# 🚨 CRITICAL: Edge Function Deployment Issue

## Problem

Your Edge Function was deployed with the **wrong name**: `jwt-validator`  
But it should be named: `make-server-8eebe9eb`

This is causing all API calls to fail with "Failed to fetch" errors.

## Why This Matters

When you deploy a Supabase Edge Function:
- Function name becomes part of the URL
- All routes in the server code have `/make-server-8eebe9eb/` prefix
- Current deployment creates wrong URLs like:
  ```
  ❌ https://PROJECT.supabase.co/functions/v1/jwt-validator/make-server-8eebe9eb/health
  ```
- Should be:
  ```
  ✅ https://PROJECT.supabase.co/functions/v1/make-server-8eebe9eb/health
  ```

## Solution: Redeploy with Correct Name

### Step 1: Delete the Incorrectly Named Function

```bash
supabase functions delete jwt-validator --project-ref dhahhnqdwsncjieqydjh
```

### Step 2: Deploy with Correct Name

```bash
cd /path/to/your/project
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh --no-verify-jwt
```

### Step 3: Verify Deployment

Test the health endpoint:

```bash
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "4.1-production-jwt-fixed",
  "timestamp": "2026-02-04T..."
}
```

## Alternative: Keep Current Deployment (Not Recommended)

If you want to keep the `jwt-validator` name, you would need to:
1. Remove `/make-server-8eebe9eb/` prefix from ALL 81 routes in `/supabase/functions/server/index.tsx`
2. Update the API_BASE in `/lib/api.ts`
3. Redeploy

**This is much more work and not recommended!**

## After Redeployment

Once you redeploy with the correct name, your app will automatically work because the API configuration expects this URL structure.

The frontend is currently configured to try:
```
https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/jwt-validator/make-server-8eebe9eb/*
```

After redeployment, I'll update it to:
```
https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/*
```

## Need Help?

Check `/DEPLOY_VIA_CLI.md` for complete step-by-step CLI instructions.
