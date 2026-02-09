# ✅ JWT Fix - Quick Checklist

## Pre-Deployment ⏸️

- [ ] Read [START_HERE_JWT_FIX.md](./START_HERE_JWT_FIX.md) (2 min)
- [ ] Install Supabase CLI or have dashboard access ready

---

## Deploy 🚀

Choose one:

### Option A: CLI (30 seconds)
```bash
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh
```
- [ ] Command executed successfully
- [ ] No error messages shown

### Option B: Dashboard (2 minutes)
- [ ] Copied `/supabase/functions/server/index.tsx`
- [ ] Opened https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh/functions
- [ ] Deployed new version
- [ ] Deployment succeeded

---

## Verify ✔️

### Automated (Recommended)
- [ ] Visit [/verify-jwt-fix](http://localhost:3000/verify-jwt-fix)
- [ ] All 5 tests show ✅ **Pass**

### Manual
```bash
curl https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/health
```
- [ ] Version shows `4.1-production-jwt-fixed`
- [ ] `authMethod` includes "supabaseAdmin"
- [ ] `hasServiceKey` is `true`

---

## Test 🧪

- [ ] Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Log out from app
- [ ] Log back in
- [ ] Navigate to dashboard
- [ ] **No "Invalid JWT" errors** ✅
- [ ] Access other modules (Inventory, Invoices, etc.)
- [ ] All modules load correctly ✅

---

## Troubleshooting 🔧

If any test fails:

### Service Role Key Missing
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key --project-ref dhahhnqdwsncjieqydjh
```
- [ ] Service Role Key obtained from Dashboard → Settings → API
- [ ] Secret set successfully
- [ ] Redeployed function

### Still Getting 401 Errors
- [ ] Cleared browser cache completely
- [ ] Logged out and logged back in
- [ ] Checked Edge Function logs for errors
- [ ] Verified health endpoint shows correct version

### Deployment Failed
- [ ] Logged in to Supabase CLI (`supabase login`)
- [ ] Linked to project (`supabase link --project-ref dhahhnqdwsncjieqydjh`)
- [ ] Tried deployment again

---

## Confirmation 🎉

All checks passed:
- [ ] ✅ Deployment successful
- [ ] ✅ Verification tests pass
- [ ] ✅ Login works
- [ ] ✅ Dashboard accessible
- [ ] ✅ No 401 errors
- [ ] ✅ All modules working

**Status: JWT Authentication Fixed!** 🎊

---

## Quick Reference

| Need | Link |
|------|------|
| Deploy Guide | [🚀_DEPLOY_NOW.md](./🚀_DEPLOY_NOW.md) |
| Verify | [/verify-jwt-fix](http://localhost:3000/verify-jwt-fix) |
| Troubleshoot | [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) |
| Full Docs | [📖_DOCUMENTATION_INDEX.md](./📖_DOCUMENTATION_INDEX.md) |

---

**Deploy Command:**
```bash
supabase functions deploy make-server-8eebe9eb --project-ref dhahhnqdwsncjieqydjh
```

**Verify URL:**
```
http://localhost:3000/verify-jwt-fix
```

---

*Print this checklist and check off items as you complete them!*
