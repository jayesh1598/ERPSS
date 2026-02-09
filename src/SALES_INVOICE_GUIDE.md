# 🧾 Sales Invoice Management System - Complete Guide

## Overview
The **Sales Invoice Management System** provides **TWO** powerful ways to create customer invoices:
1. **Automatic Invoice Generation** - from approved quotations or completed sales orders
2. **Custom Invoice Creation** - for direct orders, walk-in customers, or stock sales

---

## 🎯 Two Invoice Creation Methods

### Method 1: Automatic Invoice (from Order/Quotation)

**Best For:**
- Orders that went through full workflow
- Quotations that have been approved
- Sales orders that are ready to ship
- Systematic, tracked transactions

**How It Works:**
1. Click **"From Order/Quotation"** button
2. Choose source type:
   - **Sales Order** (for completed/ready orders)
   - **Quotation** (for approved quotes)
3. Select the specific order/quotation from dropdown
4. System automatically pulls:
   - Customer details (name, GSTIN, address)
   - All items with quantities and prices
   - GST calculations
   - Payment terms
   - Reference numbers
5. Click **"Generate Invoice"** - Done! ✅

**Advantages:**
- ✅ Zero manual data entry
- ✅ No calculation errors
- ✅ Complete audit trail
- ✅ Links back to source document
- ✅ Automatic GST compliance

---

### Method 2: Custom Invoice (Manual Entry)

**Best For:**
- Walk-in customers (no prior quotation)
- Direct cash sales
- Stock clearance sales
- Emergency/rush orders
- Customers who already know what they want

**How It Works:**
1. Click **"Create Custom Invoice"** button
2. Select customer from dropdown
3. Set invoice date and due date
4. Add products manually:
   - Select product → System auto-fills price & HSN code
   - Enter quantity
   - Adjust discount if needed
   - GST calculates automatically
5. Add more items as needed (Click "+ Add Item")
6. Review totals
7. Add notes/terms if required
8. Click **"Create Invoice"** - Done! ✅

**Advantages:**
- ✅ Fast invoice creation
- ✅ No need for quotation/order
- ✅ Flexible for ad-hoc sales
- ✅ Still GST compliant
- ✅ Perfect for retail scenarios

---

## 📋 Complete Workflow Examples

### Example 1: Automatic Invoice from Sales Order

**Scenario:** ABC Industries placed order for 500 Cookers, order is ready to ship

**Steps:**
1. Go to **Sales Invoices** page
2. Click **"From Order/Quotation"**
3. Select **"Sales Order"** tab
4. Choose: `SO-2026-12345 - ABC Industries - ₹7,50,000`
5. Click **"Generate Invoice"**

**System Auto-Generates:**
```
Invoice Number: INV-1738860000123
Customer: ABC Industries Pvt Ltd
GSTIN: 27AABCU9603R1ZM
Items:
  - Pressure Cooker 5L × 500 @ ₹1,500 = ₹7,50,000
Subtotal: ₹6,35,593.22
GST @ 18%: ₹1,14,406.78
Total: ₹7,50,000.00
Due Date: 08-Mar-2026 (Net 30 Days)
Reference: SO-2026-12345
```

✅ Invoice created with complete traceability!

---

### Example 2: Custom Invoice for Walk-in Customer

**Scenario:** Walk-in customer wants 100 Tiffin Boxes, paying cash

**Steps:**
1. Go to **Sales Invoices** page
2. Click **"Create Custom Invoice"**
3. Select Customer: **"Retail Customer - Mumbai"**
4. Set Invoice Date: **Today**
5. Set Due Date: **Today** (immediate payment)
6. Payment Terms: **"Immediate"**
7. Click **"+ Add Item"**
8. Select Product: **"Tiffin Box 3 Tier"**
   - System auto-fills: Rate = ₹800, HSN = 73239900, GST = 18%
9. Enter Quantity: **100**
10. Review Total: **₹94,400** (including GST)
11. Add Note: **"Cash payment received"**
12. Click **"Create Invoice"**

✅ Invoice generated in 30 seconds!

---

## 🔄 Complete Order-to-Payment Workflow

### Full Cycle: From Quotation → Invoice → Payment

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: QUOTATION                                            │
│ - Customer requests quote for 500 Cookers                    │
│ - Sales team creates quotation                               │
│ - Price: ₹7,50,000 (including GST)                           │
│ - Status: Pending Approval                                   │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: QUOTATION APPROVAL                                   │
│ - Manager reviews quotation                                  │
│ - Approves quotation                                         │
│ - Status: Approved ✅                                        │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: SALES ORDER CREATION                                 │
│ - Customer confirms order                                    │
│ - Sales order created from approved quotation                │
│ - System checks inventory: 100 in stock, need 400            │
│ - Production order auto-generated for 400 units              │
│ - Status: In Production 🏭                                   │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: PRODUCTION COMPLETION                                │
│ - Production completes 400 Cookers                           │
│ - QC inspection: All passed ✓                                │
│ - Items added to inventory                                   │
│ - Sales order status: Ready to Ship 📦                       │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: INVOICE GENERATION ← YOU ARE HERE                    │
│ - Go to "Sales Invoices"                                     │
│ - Click "From Order/Quotation"                               │
│ - Select Sales Order: SO-2026-12345                          │
│ - System auto-generates invoice INV-1738860000123            │
│ - All details pre-filled automatically                       │
│ - Invoice Status: Pending 📋                                 │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: DELIVERY CHALLAN                                     │
│ - Create delivery challan for shipment                       │
│ - Generate E-Way Bill (for interstate)                       │
│ - Goods dispatched to customer                               │
│ - Status: Shipped 🚚                                         │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: PAYMENT COLLECTION                                   │
│ - Invoice sent to customer (email/print)                     │
│ - Payment terms: Net 30 Days                                 │
│ - Due Date: 08-Mar-2026                                      │
│ - Customer makes payment                                     │
│ - Update invoice status: Paid ✅                             │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: ACCOUNTING & GST                                     │
│ - Accounting entries auto-posted:                            │
│   Debit: Accounts Receivable ₹7,50,000                       │
│   Credit: Sales Revenue ₹6,35,593.22                         │
│   Credit: GST Output ₹1,14,406.78                            │
│ - GSTR-1 entry created for GST filing                        │
│ - Financial reports updated                                  │
│ - Audit trail complete 📊                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Invoice Status Lifecycle

### Status Flow:
```
Draft → Pending → Sent → Partially Paid → Paid
                      ↘ Overdue (if past due date)
                      ↘ Cancelled (if order cancelled)
```

### Status Descriptions:

| Status | Description | Next Action |
|--------|-------------|-------------|
| **Draft** | Invoice created but not finalized | Review & finalize |
| **Pending** | Invoice finalized, awaiting send | Send to customer |
| **Sent** | Invoice sent to customer | Wait for payment |
| **Partially Paid** | Some payment received | Follow up for balance |
| **Paid** | Full payment received | Archive, close order |
| **Overdue** | Past due date, unpaid | Follow up urgently |
| **Cancelled** | Order/invoice cancelled | No action |

---

## 💰 Payment Terms

### Available Options:

| Payment Term | Due Date | Use Case |
|--------------|----------|----------|
| **Immediate** | Same day | Cash sales, walk-in customers |
| **Net 15** | 15 days | Fast-moving products |
| **Net 30** | 30 days | Standard B2B sales (most common) |
| **Net 45** | 45 days | Established customers |
| **Net 60** | 60 days | Large corporate accounts |

**Default:** Net 30 Days (industry standard)

---

## 🧮 GST Calculation

### How GST is Calculated:

```
Item: Pressure Cooker
Quantity: 100
Rate per unit: ₹1,500
Discount: 10%

Calculations:
1. Subtotal = Qty × Rate = 100 × 1,500 = ₹1,50,000
2. Discount = Subtotal × 10% = ₹15,000
3. Taxable Amount = Subtotal - Discount = ₹1,35,000
4. GST @ 18% = Taxable × 18% = ₹24,300
5. Total Amount = Taxable + GST = ₹1,59,300
```

### GST Breakdown (for intra-state):
- **CGST:** 9% (₹12,150)
- **SGST:** 9% (₹12,150)

### GST Breakdown (for inter-state):
- **IGST:** 18% (₹24,300)

### HSN Codes:
- **Pressure Cooker:** 73239900
- **Tiffin Box:** 73239900
- **Glassware:** 70139900

---

## 📄 Invoice Document Structure

### Standard Invoice Format:

```
╔═══════════════════════════════════════════════════════════╗
║         [COMPANY LOGO]                                    ║
║         YOUR COMPANY NAME                                 ║
║         TAX INVOICE                                       ║
╚═══════════════════════════════════════════════════════════╝

Invoice No: INV-1738860000123          Date: 06-Feb-2026
Due Date: 08-Mar-2026                   Payment Terms: Net 30

┌───────────────────────────────────────────────────────────┐
│ BILL TO:                                                  │
│ ABC Industries Pvt Ltd                                    │
│ 123 Industrial Area, Andheri East                         │
│ Mumbai, Maharashtra - 400069                              │
│ GSTIN: 27AABCU9603R1ZM                                   │
│ Contact: +91 9876543210                                  │
└───────────────────────────────────────────────────────────┘

Reference: Sales Order SO-2026-12345

┌──────────┬────────┬─────┬────────┬──────────┬──────┬───────┐
│ HSN Code │  Item  │ Qty │  Rate  │ Discount │ GST  │ Total │
├──────────┼────────┼─────┼────────┼──────────┼──────┼───────┤
│ 73239900 │Cooker  │ 500 │ 1,500  │    0%    │ 18%  │750,000│
│          │ 5L     │     │        │          │      │       │
└──────────┴────────┴─────┴────────┴──────────┴──────┴───────┘

                                      Subtotal: ₹ 6,35,593.22
                                      CGST 9%:  ₹    57,203.39
                                      SGST 9%:  ₹    57,203.39
                                      ─────────────────────────
                                      Total:    ₹ 7,50,000.00

Amount in Words: Seven Lakh Fifty Thousand Rupees Only

Terms & Conditions:
1. Payment due within 30 days of invoice date
2. Interest @18% p.a. will be charged on overdue payments
3. Goods once sold cannot be returned
4. Subject to Mumbai jurisdiction

Bank Details:
Bank: HDFC Bank
Account No: 50200012345678
IFSC: HDFC0001234
Branch: Andheri West, Mumbai

For [YOUR COMPANY NAME]
Authorized Signatory
```

---

## 🔗 Integration with Other Modules

### 1. **Sales Orders Module**
- Invoice pulls data from completed sales orders
- Links invoice to original order for traceability
- Updates order status to "Invoiced"

### 2. **Sales Quotations Module**
- Invoice generated from approved quotations
- Converts quote prices to invoice
- Maintains quote reference number

### 3. **Inventory Module**
- Invoice creation checks current stock
- Reserved inventory released upon invoicing
- Stock levels updated after delivery

### 4. **Delivery Challan Module**
- Delivery challan created from invoice
- E-Way Bill linked to invoice
- Shipment tracking integrated

### 5. **GST Management Module**
- GST amounts automatically calculated
- GSTR-1 entries created (outward supply)
- E-Invoice generation (if enabled)

### 6. **Accounting Module**
- Journal entries auto-posted:
  - Dr. Accounts Receivable
  - Cr. Sales Revenue
  - Cr. GST Output
- Accounts receivable aging report
- Revenue recognition

### 7. **Customer Module (Parties)**
- Customer credit limit checking
- Outstanding balance tracking
- Payment history
- Customer aging analysis

---

## 📈 Reports & Analytics

### Available Reports:

1. **Invoice Register**
   - All invoices with date, customer, amount
   - Filter by date range, customer, status
   - Export to Excel/PDF

2. **Revenue Report**
   - Total revenue by period (daily/monthly/yearly)
   - Revenue by customer
   - Revenue by product category

3. **Aging Analysis**
   - Outstanding invoices by age
   - 0-30 days, 31-60 days, 61-90 days, >90 days
   - Overdue invoice list

4. **GST Summary**
   - CGST, SGST, IGST collected
   - HSN-wise summary
   - Customer-wise GST

5. **Payment Collection Report**
   - Invoices paid vs pending
   - Collection efficiency
   - Average collection period

---

## ⚙️ Admin Features

### Admin Can:
- ✅ View all invoices (all customers)
- ✅ Override invoice status
- ✅ Cancel invoices (with reason)
- ✅ Adjust payment terms
- ✅ Apply credit notes
- ✅ Generate consolidated reports
- ✅ Export for accounting software

---

## 🛡️ Security & Compliance

### Audit Trail:
- Every invoice creation logged
- User ID, timestamp, IP address
- Changes tracked (who, when, what)
- Deletion not allowed (only cancellation)

### Access Control:
- Role-based permissions
- Salespeople: Create custom invoices
- Managers: Approve large invoices
- Accounts: Modify payment status
- Admins: Full access

### GST Compliance:
- HSN codes mandatory
- GSTIN validation
- Tax rate verification
- E-Invoice ready (IRN generation)

---

## 💡 Best Practices

### Do's:
✅ Always use **automatic invoice** when source document exists  
✅ Verify customer GSTIN before creating invoice  
✅ Check stock availability for custom invoices  
✅ Add payment terms clearly  
✅ Send invoice immediately after dispatch  
✅ Follow up on overdue invoices promptly  
✅ Maintain complete documentation

### Don'ts:
❌ Don't create custom invoice if quotation/order exists  
❌ Don't skip HSN codes (GST compliance issue)  
❌ Don't modify invoice after sending (create credit note instead)  
❌ Don't ignore payment due dates  
❌ Don't delete invoices (cancel with reason)  

---

## 🚀 Quick Start Guide

### For New Users:

**First Time Invoice Creation (Auto):**
1. Ensure you have an approved quotation OR ready sales order
2. Go to: **Sales Invoices** page
3. Click: **"From Order/Quotation"**
4. Select source & ID
5. Review auto-filled data
6. Click: **"Generate Invoice"**
7. Done! ✅

**First Time Invoice Creation (Custom):**
1. Ensure customer exists in Master Data
2. Ensure products configured with prices
3. Go to: **Sales Invoices** page
4. Click: **"Create Custom Invoice"**
5. Fill customer, date, items
6. Review totals
7. Click: **"Create Invoice"**
8. Done! ✅

---

## 📞 Support & Help

### Common Issues:

**Issue:** "No eligible sales orders found"  
**Solution:** Sales order must be in "Ready to Ship" or "Completed" status

**Issue:** "Quotation must be approved"  
**Solution:** Get quotation approved by manager first

**Issue:** "Customer not found"  
**Solution:** Add customer in Master Data → Parties → Customer

**Issue:** "Invalid GSTIN"  
**Solution:** Verify customer GSTIN format (15 characters)

**Issue:** "HSN code missing"  
**Solution:** Update product master data with HSN code

---

## 🎓 Training Resources

### Video Tutorials:
1. Creating automatic invoice from sales order (3 min)
2. Creating custom invoice for walk-in customer (5 min)
3. Managing payment collection (4 min)
4. GST compliance checklist (6 min)
5. Handling returns & credit notes (7 min)

### Documentation:
- Invoice Template Customization Guide
- GST Rates & HSN Codes Reference
- Payment Terms Configuration
- E-Invoice Setup Guide

---

**System Version:** ERP v2.0 - Sales Invoice Module  
**Last Updated:** February 6, 2026  
**Documentation:** Complete Invoice Workflow Guide  
**Support:** Contact System Administrator

---

## 🌟 Key Takeaways

### Automatic Invoice:
- ✅ Use when quotation/order exists
- ✅ Zero data entry, zero errors
- ✅ Complete audit trail
- ✅ Recommended for systematic business

### Custom Invoice:
- ✅ Use for walk-in/direct sales
- ✅ Fast and flexible
- ✅ Perfect for retail scenarios
- ✅ Still fully GST compliant

**Both methods maintain complete integration with inventory, accounting, GST, and all other ERP modules!** 🎉
