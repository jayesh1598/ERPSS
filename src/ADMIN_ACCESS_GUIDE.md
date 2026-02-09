# Admin Access System - Quick Start Guide

## 🎯 Overview

Your Enterprise ERP System now has a complete **Admin Access System** with full control over all modules.

## 🚀 Getting Started with Admin Account

### Step 1: Create Admin Account (First Time Only)

1. Navigate to **`/admin-setup`** in your browser
2. Fill in the admin details:
   - **Full Name**: Your name
   - **Admin Email**: admin@company.com (or your preferred email)
   - **Password**: Minimum 6 characters
   - **Confirm Password**: Must match
3. Click **"Create Admin Account"**
4. You'll be redirected to the admin login page

**Note:** This page can only be used ONCE. After the first admin is created, you'll need to use the admin login.

### Step 2: Login as Admin

1. Navigate to **`/admin-login`**
2. Enter your admin credentials
3. Click **"Admin Login"**
4. You'll be logged in with full admin access

**Quick Access:** On the regular login page (`/login`), click the **"Admin Login"** button.

---

## 🔐 Admin Features

### Full System Access
✅ **All Modules Available**
- Dashboard with comprehensive stats
- Master Data Management
- Purchase Requisitions
- Quotation Management (with approval workflow)
- Purchase Orders
- Invoices (with 4-way matching)
- Inventory Management
- Quality Control
- Production Management
- Sales Orders
- Delivery Challans
- E-Way Bills
- GST Management
- Human Resource Management
- Audit Logs
- Offline Mode

### Admin Privileges
✅ **Administrator Badge** - Visible in sidebar
✅ **Full CRUD Access** - Create, Read, Update, Delete all records
✅ **Approval Authority** - Approve quotations, POs, invoices
✅ **Amount Blocking** - Approve and block amounts for quotations
✅ **Demo Data Control** - Insert demo data for testing
✅ **Audit Trail** - View all system activities

---

## 🎨 UI Differences

### Admin Login Page
- **Purple/Blue gradient theme**
- Shield icon
- "Admin Portal" branding
- Secure access messaging

### Regular User Login Page
- **Blue gradient theme**
- Building icon
- "Enterprise ERP" branding
- Option to switch to Admin Login

### Sidebar User Info
- **Admin users**: Purple badge with shield icon + "Administrator" text
- **Regular users**: Gray "User" text

---

## 📋 Routes Reference

| Route | Purpose | Access |
|-------|---------|--------|
| `/admin-setup` | First-time admin creation | Public (one-time use) |
| `/admin-login` | Admin login portal | Public |
| `/login` | Regular user login | Public |
| `/signup` | User registration | Public |
| `/` | Dashboard | Requires authentication |
| All other routes | ERP modules | Requires authentication |

---

## 🔧 Technical Details

### Backend Endpoints

#### Create Admin (POST `/auth/init-admin`)
```typescript
Request:
{
  "name": "Admin Name",
  "email": "admin@company.com",
  "password": "secure_password"
}

Response:
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "id": "uuid",
    "email": "admin@company.com",
    "name": "Admin Name",
    "role": "admin"
  }
}
```

#### Get Current User (GET `/auth/me`)
```typescript
Response:
{
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "name": "User Name",
    "role": "admin" | "user",
    "is_admin": true | false
  },
  "roles": []
}
```

### Database Records

Admin users have TWO records:
1. **`user:{userId}`** - Standard user record with `role: "admin"`
2. **`admin:{userId}`** - Admin marker record

---

## 🎯 Default Admin Credentials (If You Created Them)

After running admin setup, use your chosen credentials:
- **Email**: `[your chosen email]`
- **Password**: `[your chosen password]`

**Security Note**: Change the default password immediately after first login.

---

## 🆘 Troubleshooting

### "Admin already exists" Error
**Solution**: Admin account has already been created. Use `/admin-login` instead.

### "Access denied: This account is not an admin"
**Solution**: You're trying to login with a regular user account on the admin portal. Use `/login` instead.

### Cannot Access `/admin-setup`
**Solution**: If admin already exists, this page will reject new signups. Contact your system administrator.

### Forgot Admin Password
**Solution**: 
1. Go to Supabase Dashboard → Authentication → Users
2. Find the admin user
3. Reset password manually
4. Or delete the admin records and recreate via `/admin-setup`

---

## 🔒 Security Best Practices

1. **Use Strong Passwords**: Minimum 12 characters with mixed case, numbers, symbols
2. **Limit Admin Accounts**: Only create admin accounts for trusted personnel
3. **Regular Password Changes**: Update admin passwords every 90 days
4. **Audit Logs**: Regularly review audit logs for suspicious activity
5. **Session Management**: Admin sessions expire after inactivity
6. **Two-Factor Auth**: Consider enabling 2FA (future enhancement)

---

## 🚀 Quick Start Commands

### First Time Setup
```bash
# 1. Navigate to admin setup
https://your-app.com/admin-setup

# 2. Create admin account with:
Name: Admin User
Email: admin@company.com
Password: SecurePass123!

# 3. Login at:
https://your-app.com/admin-login
```

### Regular Access
```bash
# Admin Login
https://your-app.com/admin-login

# Or from regular login page, click "Admin Login" button
https://your-app.com/login
```

---

## 📊 Next Steps After Admin Login

1. **Insert Demo Data** (from Dashboard)
   - Click "Insert Demo Data" button
   - Populates all modules with sample records

2. **Create Master Data**
   - Add departments, warehouses, categories
   - Set up vendors and customers

3. **Configure Roles & Permissions**
   - Create user roles
   - Assign permissions per module

4. **Add Users**
   - Use signup page for regular users
   - Assign roles after signup

5. **Test Workflows**
   - Create purchase requisitions
   - Upload quotations
   - Approve and process orders

---

## ✅ Verification Checklist

- [ ] Admin account created successfully
- [ ] Can login via `/admin-login`
- [ ] Admin badge visible in sidebar
- [ ] Can access all modules
- [ ] Can insert demo data
- [ ] Dashboard stats loading correctly
- [ ] Quotation approval workflow working
- [ ] Invoice 4-way matching active

---

## 🎉 You're All Set!

Your admin account is now ready. You have full access to all 14 phases of the Enterprise Manufacturing ERP System.

**Happy Managing! 🚀**
