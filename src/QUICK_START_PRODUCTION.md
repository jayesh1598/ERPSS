# Quick Start Guide - Production Mode

## 🚀 Your ERP System is Ready for Production!

Demo mode has been removed and your system now operates with real Supabase authentication and live database integration.

## Step 1: Deploy the Edge Function

Deploy your backend to Supabase:

```bash
supabase functions deploy make-server-8eebe9eb
```

**Important:** Do NOT use the `--no-verify-jwt` flag. JWT verification is required in production.

## Step 2: Create Your First User

### Option A: Via the Application
1. Open your application in the browser
2. Navigate to the `/signup` page
3. Fill in your details:
   - Email address
   - Password
   - Full name
   - Phone number (optional)
   - Employee code (optional)
4. Click "Sign Up"
5. You'll be automatically logged in

### Option B: Via Supabase Dashboard
1. Open your Supabase project dashboard: https://supabase.com/dashboard/project/dhahhnqdwsncjieqydjh
2. Navigate to: **Authentication** → **Users**
3. Click "**Add User**"
4. Enter the email and password
5. Click "Create User"
6. Use these credentials to log in to the ERP

## Step 3: Log In

1. Navigate to `/login`
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the dashboard

## Step 4: Set Up Your System

Once logged in, set up your ERP system:

### 1. Master Data Setup
Navigate to **Master Data** and create:
- ✅ Warehouses (e.g., Main Warehouse, Raw Material Store)
- ✅ Departments (e.g., Production, Purchase, Quality)
- ✅ Units of Measurement (e.g., KG, PCS, LITRE)
- ✅ Categories (Raw Material, Finished Goods, etc.)
- ✅ Items (products and materials)
- ✅ Parties (suppliers and customers)

### 2. User Roles & Permissions
- Create roles with specific permissions
- Assign roles to users
- Configure warehouse and department access

### 3. Start Using Modules
- **Purchase**: Create requisitions, get quotations, raise POs
- **Inventory**: Track stock, create GRNs, manage warehouses
- **Quality**: Set up QC templates and inspections
- **Production**: Create BOMs and work orders
- **Sales**: Manage quotations and orders
- **Dispatch**: Generate delivery challans and E-Way bills
- **GST**: Track GST transactions and payments
- **HRM**: Manage employees, attendance, and leaves

## Authentication Features

### ✅ Secure Login
- Passwords are securely hashed
- JWT tokens for session management
- Automatic token refresh

### ✅ Session Management
- Sessions automatically refresh before expiration
- Invalid tokens trigger automatic logout
- Multi-device support

### ✅ Password Reset
Available via Supabase Auth (can be configured in Supabase dashboard)

## API Endpoints

All endpoints require authentication except:
- `POST /auth/signup` - User registration
- `GET /health` - Health check

All other endpoints validate JWT tokens and return:
- **200 OK** - Success
- **401 Unauthorized** - Invalid or missing authentication
- **403 Forbidden** - Insufficient permissions
- **500 Internal Server Error** - Server error

## Troubleshooting

### "No valid authentication token available"
**Solution:** Your session has expired. Log out and log back in.

### "Failed to load dashboard" or API errors
**Solutions:**
1. Verify Edge Function is deployed:
   ```bash
   supabase functions list
   ```
2. Check Edge Function logs:
   ```bash
   supabase functions logs make-server-8eebe9eb
   ```
3. Verify environment variables are set in Supabase dashboard

### Cannot log in after signup
**Solution:** Check that you're using the correct email and password. Passwords are case-sensitive.

### "Authentication failed: Invalid Authorization header format"
**Solution:** This is a backend error. Verify:
- Edge Function is deployed
- Environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are set correctly

## Security Best Practices

1. **Use Strong Passwords**
   - Minimum 8 characters
   - Mix of letters, numbers, and symbols

2. **Limit Service Role Key Access**
   - Never expose SERVICE_ROLE_KEY to frontend
   - Only use it server-side in Edge Function

3. **Regular Security Audits**
   - Review user access via Audit Logs module
   - Monitor authentication attempts
   - Regularly review role permissions

4. **Enable Row Level Security (RLS)**
   - If you create custom tables in Supabase, enable RLS
   - Current KV store implementation is protected by backend middleware

## Next Steps

1. ✅ Deploy Edge Function
2. ✅ Create admin user
3. ✅ Set up master data
4. ✅ Create roles and assign permissions
5. ✅ Add more users via signup
6. ✅ Configure warehouse/department access
7. ✅ Start using the ERP system

## Need Help?

- Check the `/PRODUCTION_MODE_ENABLED.md` file for detailed technical information
- Review Supabase documentation: https://supabase.com/docs
- Check Edge Function logs for backend errors
- Use browser console for frontend errors

---

**Status:** ✅ Production Ready  
**Auth Method:** Supabase JWT  
**Database:** Live PostgreSQL with KV Store  
**Version:** 4.0
