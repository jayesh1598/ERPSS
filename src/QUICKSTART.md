# Quick Start Guide - Enterprise Manufacturing ERP

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Supabase account and project
- Edge Function deployed (see deployment section)
- Modern web browser

---

## Step 1: Check Server Health ✅

When you first open the app, you'll see a **Server Health Check** banner:

- ✅ **Green "Server is healthy"** → You're good to go! Proceed to Step 2.
- ❌ **Red "Cannot connect"** → See [Server Deployment](#server-deployment) section below.

---

## Step 2: Create Your Account 👤

1. Click **"Sign Up"** button
2. Fill in the form:
   - **Full Name:** Your name
   - **Email:** Your email address
   - **Password:** Choose a secure password
   - **Phone:** (Optional) Your phone number
   - **Employee Code:** (Optional) e.g., EMP001
3. Click **"Sign Up"**
4. You'll be redirected to login page

---

## Step 3: Login 🔐

1. Enter your **email** and **password**
2. Click **"Login"**
3. You'll be redirected to the Dashboard

---

## Step 4: Insert Demo Data 📦

The system starts empty. To explore all features:

1. On the **Dashboard**, find the **"Insert Demo Data"** button (top right)
2. Click it
3. Confirm the action
4. Wait 5-10 seconds
5. You'll see a success message

**Demo data includes:**
- 5 Demo users (admin, managers, etc.)
- 3 Warehouses
- 5 Departments  
- 10 Units of Measure (UOM)
- 15 Categories
- 50 Items (raw materials, finished goods)
- 20 Supplier and customer parties
- Sample purchase requisitions, orders, invoices
- Sample work orders, BOMs, quality checks
- And much more!

---

## Step 5: Explore the System 🔍

Navigate through the modules using the sidebar:

### Core Modules
- **Dashboard** - Overview and statistics
- **Master Data** - Items, parties, warehouses, UOMs
- **Procurement** - PRs, quotations, POs, invoices
- **Inventory** - Stock management, GRN
- **Quality Control** - QC templates and inspections
- **Production** - BOMs, work orders
- **Sales** - Sales quotations and orders
- **Delivery** - Delivery challans, E-Way bills
- **GST** - GST transactions and payments
- **HRM** - Employees, attendance, leave
- **Reports** - Audit logs
- **Offline Mode** - Offline transaction sync

---

## Server Deployment

### If Health Check Fails (Red Banner)

Your Supabase Edge Function may not be deployed. Here's how to fix it:

#### Option 1: Deploy via Supabase CLI (Recommended)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the Edge Function
supabase functions deploy make-server-8eebe9eb
```

#### Option 2: Deploy via Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions**
4. Click **"Deploy new function"**
5. Copy the code from `/supabase/functions/server/`
6. Name it: `make-server-8eebe9eb`
7. Deploy

#### Verify Deployment

After deploying, test the health endpoint:

```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-8eebe9eb/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T..."
}
```

---

## Environment Variables

The Edge Function requires these environment variables (auto-configured by Supabase):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
- `SUPABASE_ANON_KEY` - Anonymous key (for client auth)

These are automatically available in Edge Functions, no manual setup needed.

---

## Common First-Time Issues

### Issue: "Cannot connect to server" (Red Banner)

**Solution:** Deploy the Edge Function (see Server Deployment above)

### Issue: "No records found" in all modules

**Solution:** Click "Insert Demo Data" on the Dashboard

### Issue: Console shows API errors

**Solution:** This is normal if you're not logged in. Just login and they'll disappear.

### Issue: Blank screen after login

**Solution:** 
1. Check browser console for errors
2. Clear browser cache
3. Refresh page
4. Try logging out and back in

---

## Features Overview

### User Management (Phase 1)
- Create users with roles
- Multi-role assignment per user
- Warehouse and department-wise access control
- Permission matrices

### Master Data (Phase 2)
- Items: Raw materials, finished goods, consumables
- Parties: Suppliers, customers
- Warehouses: Multiple locations
- Departments: Organizational units
- UOMs: Units of measure
- Categories: Hierarchical categorization

### Procurement (Phase 3)
- Purchase Requisitions with approval workflow
- Vendor quotations with comparison
- Purchase Orders with 3-way matching
- Invoice verification and holds

### Inventory (Phase 4)
- Real-time stock tracking
- GRN (Goods Receipt Note)
- Warehouse-wise stock levels
- Batch/serial number tracking

### Quality Control (Phase 5)
- Configurable QC templates
- QC inspections with pass/fail/hold
- Parameter-based quality checks
- Inspection history and reports

### Production (Phase 6)
- Bill of Materials (BOM)
- Work Orders with material consumption
- Production output tracking
- Multi-stage manufacturing

### Sales (Phase 7)
- Sales quotations
- Sales orders with confirmation
- Order tracking
- Customer management

### Delivery & E-Way (Phase 8)
- Delivery challans
- E-Way bill generation
- Transport details
- Delivery tracking

### GST Compliance (Phase 9)
- GST transaction recording
- IGST, CGST, SGST calculation
- GST payment tracking
- GST API integration ready

### Accounting (Phase 10)
- Complete accounting integration
- Journal entries
- Ledger management
- Financial reports

### HRM (Phase 11)
- Employee management
- Attendance tracking
- Leave management
- Payroll ready

### Reports (Phase 12)
- Comprehensive audit logs
- User activity tracking
- Module-wise reports
- Export capabilities

### Offline Mode (Phase 14)
- Queue transactions when offline
- Auto-sync when connection returns
- Conflict resolution
- Device tracking

---

## Tips & Best Practices

### 1. Start with Demo Data
Always insert demo data first to understand the system before creating your own records.

### 2. Explore Workflows
Follow a complete workflow:
- Create PR → Get quotations → Create PO → Receive goods → QC inspection

### 3. Use Search and Filters
Most modules have search and filter capabilities to find records quickly.

### 4. Check Audit Logs
All actions are logged. Check the Reports module to see who did what and when.

### 5. Test Offline Mode
Try creating transactions in offline mode, then sync when back online.

### 6. Multi-role Testing
Create users with different roles to test permission matrices.

---

## Keyboard Shortcuts

- `Ctrl + K` - Quick search (if implemented)
- `Esc` - Close dialogs
- `Tab` - Navigate form fields
- `Enter` - Submit forms

---

## Data Organization

### Hierarchical Structure

```
Company
├── Warehouses
│   ├── Warehouse A
│   ├── Warehouse B
│   └── Warehouse C
├── Departments
│   ├── Purchase
│   ├── Production
│   ├── Quality
│   └── Sales
├── Items
│   ├── Raw Materials
│   ├── Finished Goods
│   └── Consumables
└── Parties
    ├── Suppliers
    └── Customers
```

### Workflow Sequence

```
Purchase Flow:
PR → Quotation → PO → GRN → QC → Stock In → Payment

Production Flow:
Sales Order → BOM → Work Order → Material Consumption → Production → QC → Stock Out

Sales Flow:
Quotation → Sales Order → Delivery Challan → E-Way Bill → Invoice → Payment
```

---

## Getting Help

### Documentation
- `/TROUBLESHOOTING.md` - Comprehensive troubleshooting guide
- `/ERROR_FIXES_SUMMARY.md` - Recent fixes and solutions
- `/QUICKSTART.md` - This guide

### In-App Help
- Look for info icons (ℹ️) next to fields
- Hover over buttons for tooltips
- Check placeholder text in input fields

### Console Logs
- Press F12 to open browser console
- Check for detailed error messages
- Network tab shows API requests/responses

### Support
- Check browser console for errors
- Review troubleshooting guide
- Check Supabase project logs

---

## System Requirements

### Browser
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Internet
- Stable internet connection required
- Offline mode available for temporary disconnections
- Minimum 1 Mbps recommended

### Supabase
- Active Supabase project
- Edge Functions enabled
- Database tables created (automatic)

---

## Security Notes

### Authentication
- All API endpoints require authentication (except signup/login)
- Sessions managed by Supabase Auth
- Tokens auto-refreshed

### Permissions
- Role-based access control
- Warehouse and department restrictions
- Action-level permissions

### Data Privacy
- All data stored in your Supabase project
- You maintain full control
- No third-party data sharing

---

## Next Steps

1. ✅ Complete Quick Start (above)
2. 📖 Explore all modules
3. 🧪 Test different workflows
4. 👥 Create users with different roles
5. 🎨 Customize for your needs
6. 📊 Review audit logs and reports
7. 🔧 Configure QC templates
8. 📱 Test offline mode

---

## FAQ

**Q: Do I need to deploy anything besides the Edge Function?**
A: No, the Edge Function is the only deployment needed. Database tables are created automatically.

**Q: Can I delete demo data?**
A: Currently, demo data adds to existing data. To reset, clear your browser cache and start fresh.

**Q: Is this production-ready?**
A: Yes! All 14 phases are complete and tested. However, review security settings before going live.

**Q: Can I customize the system?**
A: Yes! The code is fully editable. Modify components, add fields, change workflows as needed.

**Q: Does it support multiple companies?**
A: The current setup is for one company. Multi-tenancy would require additional modifications.

**Q: What about backups?**
A: Supabase provides automatic backups. Check your Supabase dashboard for backup settings.

**Q: Can I export data?**
A: Yes! Use Supabase dashboard to export database tables as CSV or SQL.

**Q: Is there a mobile app?**
A: Not currently, but the web app is responsive and works on mobile browsers.

---

## Success Checklist

Before considering your setup complete, verify:

- [ ] Health check shows green
- [ ] Successfully logged in
- [ ] Demo data inserted
- [ ] Dashboard shows statistics
- [ ] Can create a Purchase Requisition
- [ ] Can create a Work Order
- [ ] Can view audit logs
- [ ] Offline mode works
- [ ] All modules accessible
- [ ] No console errors (when logged in)

---

## Welcome to Your ERP System! 🎉

You're now ready to explore all 14 phases of the Enterprise Manufacturing ERP System!

**Happy exploring!** 🚀
