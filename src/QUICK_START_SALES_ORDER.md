# 🚀 Quick Start Guide: Creating Your First Sales Order

## 5-Minute Tutorial

### Step 1: Navigate to Sales Orders
```
1. Login to ERP System
2. Look at left sidebar
3. Click on "📦 Sales Orders"
```

### Step 2: Click "Create Sales Order" Button
```
Location: Top-right corner of the screen
Button: Blue "Create Sales Order" button with + icon
```

---

## 📝 Fill the Order Form

### Section A: Customer & Dates

| Field | What to Enter | Example |
|-------|---------------|---------|
| **Customer*** | Select from dropdown | ABC Industries Pvt Ltd |
| **Payment Terms*** | Choose payment option | Net 30 Days |
| **Order Date*** | Today's date (auto-filled) | 06-Feb-2026 |
| **Delivery Date*** | Expected delivery | 20-Feb-2026 |

---

### Section B: Add Products

Click **"+ Add Item"** button to add products

#### Product Line 1: Cookers
```
┌─────────────┬──────┬───────┬──────┬──────────┬─────┬─────────┐
│ Product*    │ Qty* │ Stock │ Rate*│ Discount │ GST │ Total   │
├─────────────┼──────┼───────┼──────┼──────────┼─────┼─────────┤
│ Cooker 5L   │  500 │  100  │ 1500 │    0%    │ 18% │ 885,000 │
│             │      │ 🔴 400│      │          │     │         │
└─────────────┴──────┴───────┴──────┴──────────┴─────┴─────────┘
```
**🔴 Need 400** = Production order will be auto-created

#### Product Line 2: Tiffins
```
┌─────────────┬──────┬───────┬──────┬──────────┬─────┬─────────┐
│ Product*    │ Qty* │ Stock │ Rate*│ Discount │ GST │ Total   │
├─────────────┼──────┼───────┼──────┼──────────┼─────┼─────────┤
│ Tiffin 3Tier│  200 │  200  │  800 │    0%    │ 18% │ 188,800 │
│             │      │ 🟢  ✓ │      │          │     │         │
└─────────────┴──────┴───────┴──────┴──────────┴─────┴─────────┘
```
**🟢 ✓** = Sufficient stock available

#### Product Line 3: Glasses
```
┌─────────────┬──────┬───────┬──────┬──────────┬─────┬─────────┐
│ Product*    │ Qty* │ Stock │ Rate*│ Discount │ GST │ Total   │
├─────────────┼──────┼───────┼──────┼──────────┼─────┼─────────┤
│ Glass Set-6 │  300 │   50  │  150 │    0%    │ 18% │  53,100 │
│             │      │ 🔴 250│      │          │     │         │
└─────────────┴──────┴───────┴──────┴──────────┴─────┴─────────┘
```
**🔴 Need 250** = Production order will be auto-created

---

### Section C: Order Total

```
┌──────────────────────────────────┐
│   Order Total: ₹11,26,900        │
│                                  │
│   Subtotal:        ₹9,55,000     │
│   GST @ 18%:       ₹1,71,900     │
│   ─────────────────────────      │
│   Grand Total:   ₹11,26,900      │
└──────────────────────────────────┘
```

---

### Section D: Remarks (Optional)

```
┌────────────────────────────────────────────────┐
│ Remarks / Special Instructions                 │
├────────────────────────────────────────────────┤
│ Please ensure quality packaging for export     │
│ shipment. Include product manual with cookers. │
│                                                 │
└────────────────────────────────────────────────┘
```

---

### Section E: Warning Alert (If Stock Shortage)

```
⚠️ Production Orders Will Be Auto-Generated
──────────────────────────────────────────
Some items have insufficient stock. Production 
orders will be automatically created when you 
confirm this sales order.
```

---

## 🎯 Step 3: Click "Create Order"

### What Happens Next:

#### ✅ Success Message:
```
╔═══════════════════════════════════════════════╗
║  ✅ Sales Order Created!                      ║
║  🏭 2 Production Order(s) auto-generated      ║
║     for stock shortfall                       ║
╚═══════════════════════════════════════════════╝
```

#### 🔄 Background Processing:
```
[████████████████░░] 90% Complete
 
✓ Sales Order SO-2026-12345 created
✓ Inventory checked for all items
✓ Production Order PO-2026-001 created (400 Cookers)
✓ Production Order PO-2026-002 created (250 Glasses)
✓ Material requirements calculated
✓ Purchase Requisitions generated (if needed)
✓ Notifications sent to Production team
✓ Audit log entry recorded
```

---

## 📊 View Your Order

### Order Summary Screen:

```
╔══════════════════════════════════════════════════════╗
║ Sales Order: SO-2026-12345                           ║
╠══════════════════════════════════════════════════════╣
║ Customer:        ABC Industries Pvt Ltd              ║
║ Order Date:      06-Feb-2026                         ║
║ Delivery Date:   20-Feb-2026                         ║
║ Status:          🔵 Confirmed                        ║
║ Fulfillment:     🟡 In Production                    ║
║ Total Amount:    ₹11,26,900                          ║
║ Payment Terms:   Net 30 Days                         ║
╚══════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────┐
│ Items (3)                                            │
├──────────────┬──────┬────────┬──────────┬───────────┤
│ Product      │ Qty  │ Status │ Stock    │ Total     │
├──────────────┼──────┼────────┼──────────┼───────────┤
│ Cooker 5L    │  500 │ 🟡 Prod│ 100/500  │ ₹885,000  │
│ Tiffin 3Tier │  200 │ ✅ Ready│ 200/200  │ ₹188,800  │
│ Glass Set-6  │  300 │ 🟡 Prod│  50/300  │ ₹ 53,100  │
└──────────────┴──────┴────────┴──────────┴───────────┘
```

---

## 🏭 Check Auto-Generated Production Orders

### Navigate to Production Module:

```
Sidebar → 🏭 Production → Production Orders

╔══════════════════════════════════════════════════════╗
║ Production Order: PO-2026-001                        ║
╠══════════════════════════════════════════════════════╣
║ Product:         Pressure Cooker 5L                  ║
║ Quantity:        400 units                           ║
║ Sales Order:     SO-2026-12345                       ║
║ Target Date:     20-Feb-2026                         ║
║ Priority:        🔴 High                             ║
║ Status:          ⏳ Pending                          ║
║ Auto-Generated:  Yes                                 ║
╚══════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════╗
║ Production Order: PO-2026-002                        ║
╠══════════════════════════════════════════════════════╣
║ Product:         Drinking Glass Set (6 pcs)          ║
║ Quantity:        250 units                           ║
║ Sales Order:     SO-2026-12345                       ║
║ Target Date:     20-Feb-2026                         ║
║ Priority:        🔴 High                             ║
║ Status:          ⏳ Pending                          ║
║ Auto-Generated:  Yes                                 ║
╚══════════════════════════════════════════════════════╝
```

---

## 🔄 Track Order Progress

### Order Status Journey:

```
1. 🔵 Confirmed
   ↓
2. 🟡 In Production  ← YOU ARE HERE
   ↓
3. 🔧 QC Inspection
   ↓
4. 🟢 Ready to Ship
   ↓
5. 🚚 Shipped
   ↓
6. ✅ Delivered
```

---

## 📱 Quick Actions Available

### From Sales Order Details:

```
┌─────────────────────────────────────────┐
│ [👁️ View Details]  [✏️ Edit Order]     │
│ [📋 Print Order]    [🚚 Create Challan] │
│ [🧾 Generate Invoice] [❌ Cancel Order] │
└─────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### Tip #1: Bulk Orders
```
You can add up to 50 line items in a single order.
Click "+ Add Item" multiple times.
```

### Tip #2: Discount Application
```
Enter discount as percentage (e.g., 10 for 10% off)
Discount applies before GST calculation
```

### Tip #3: Stock Alerts
```
🟢 Green = Sufficient stock
🟡 Yellow = Low stock (< 20%)
🔴 Red = Production needed
```

### Tip #4: Payment Terms
```
Net 15/30/45/60 = Payment due in X days
Cash = Immediate payment required
Advance = 100% payment before delivery
```

### Tip #5: Priority Orders
```
Set earlier delivery dates for priority
System auto-assigns "High" priority to production
```

---

## 🎯 Common Use Cases

### Case 1: Express Order
```
Customer needs urgent delivery:
→ Set delivery date within 7 days
→ System marks production as "High Priority"
→ Production team gets immediate notification
```

### Case 2: Bulk Export Order
```
Large quantity order:
→ Add special packing instructions in Remarks
→ System checks warehouse capacity
→ Alerts if additional storage needed
```

### Case 3: Repeat Customer
```
Same customer, similar products:
→ System pre-fills last used prices
→ One-click to duplicate previous order
→ Auto-applies customer discount tier
```

---

## ✅ Checklist Before Creating Order

- [ ] Customer exists in Master Data
- [ ] Products are configured with prices
- [ ] Delivery date is realistic (minimum 7-14 days)
- [ ] Payment terms agreed with customer
- [ ] Special instructions noted in remarks
- [ ] GST rates verified (18% for most products)

---

## 🆘 Troubleshooting

### Problem: "No customers available"
**Solution:** Go to Master Data → Parties → Add customer first

### Problem: "Product not found"
**Solution:** Go to Master Data → Items → Create product as "Finished Good"

### Problem: "Cannot select past date"
**Solution:** Delivery date must be in future, minimum today + 1 day

### Problem: "Stock showing 0 but warehouse has items"
**Solution:** Check Inventory module → Ensure items are in "Available" status

---

## 📞 Need Help?

### Quick Links:
- 📖 Full Documentation: `/SALES_ORDER_WORKFLOW.md`
- 🎥 Video Tutorial: Dashboard → Help Section
- 💬 Support: Contact System Administrator
- 🔍 Search: Use Ctrl+K for quick search

---

## 🎓 Next Steps

After mastering Sales Orders, explore:

1. **Delivery Module** - Generate challans & e-way bills
2. **Invoicing** - Create GST-compliant tax invoices
3. **Production** - Track manufacturing progress
4. **Accounting** - View financial reports

---

**Happy Selling! 🚀**

Last Updated: February 6, 2026
