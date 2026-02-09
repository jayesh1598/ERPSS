// Database Schema Definition for Enterprise Manufacturing ERP
// This file documents the complete database structure

export interface DBSchema {
  // PHASE 2: User Management & Roles
  users: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    employee_code?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
  };

  roles: {
    id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    created_by: string;
  };

  permissions: {
    id: string;
    module: string; // e.g., 'purchase', 'inventory', 'production'
    action: string; // 'view', 'create', 'edit', 'delete', 'approve'
    role_id: string;
  };

  user_roles: {
    id: string;
    user_id: string;
    role_id: string;
    warehouse_id?: string; // For warehouse-wise access
    department_id?: string; // For department-wise access
    assigned_at: string;
    assigned_by: string;
  };

  // Master Data
  warehouses: {
    id: string;
    code: string;
    name: string;
    location: string;
    is_active: boolean;
    created_at: string;
  };

  departments: {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
    created_at: string;
  };

  uom: {
    id: string;
    code: string;
    name: string;
    description?: string;
  };

  categories: {
    id: string;
    name: string;
    type: string; // 'RM', 'SFG', 'FG'
    parent_id?: string;
  };

  items: {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: string; // 'RM', 'SFG', 'FG'
    category_id: string;
    uom_id: string;
    hsn_code?: string;
    gst_rate?: number;
    reorder_level?: number;
    is_active: boolean;
    created_at: string;
  };

  parties: {
    id: string;
    code: string;
    name: string;
    type: string; // 'supplier', 'customer', 'job_worker'
    gstin?: string;
    pan?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    credit_limit?: number;
    is_active: boolean;
    created_at: string;
  };

  // PHASE 3: Purchase Requisition & Quotation
  purchase_requisitions: {
    id: string;
    pr_number: string;
    pr_date: string;
    department_id: string;
    requested_by: string;
    status: string; // 'draft', 'submitted', 'approved', 'rejected'
    remarks?: string;
    created_at: string;
    approved_by?: string;
    approved_at?: string;
  };

  pr_items: {
    id: string;
    pr_id: string;
    item_id: string;
    quantity: number;
    required_date: string;
    remarks?: string;
  };

  quotations: {
    id: string;
    quotation_number: string;
    pr_id: string;
    supplier_id: string;
    quotation_date: string;
    valid_until: string;
    total_amount: number;
    status: string; // 'submitted', 'under_review', 'approved', 'rejected'
    is_best: boolean;
    approved_by?: string;
    approved_at?: string;
    remarks?: string;
    created_at: string;
  };

  quotation_items: {
    id: string;
    quotation_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    total_amount: number;
    delivery_days?: number;
  };

  // PHASE 4: Purchase Orders & Invoices
  purchase_orders: {
    id: string;
    po_number: string;
    quotation_id: string;
    supplier_id: string;
    po_date: string;
    delivery_date: string;
    total_amount: number;
    status: string; // 'draft', 'approved', 'sent', 'received', 'closed'
    approved_by?: string;
    approved_at?: string;
    created_at: string;
    created_by: string;
  };

  po_items: {
    id: string;
    po_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    total_amount: number;
  };

  purchase_invoices: {
    id: string;
    invoice_number: string;
    po_id: string;
    supplier_id: string;
    invoice_date: string;
    total_amount: number;
    status: string; // 'submitted', 'matched', 'hold', 'approved', 'paid'
    hold_reason?: string;
    edit_requested: boolean;
    edit_approved: boolean;
    approved_by?: string;
    approved_at?: string;
    created_at: string;
  };

  invoice_items: {
    id: string;
    invoice_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    total_amount: number;
  };

  // PHASE 5: Inventory & Warehouse
  grn: {
    id: string;
    grn_number: string;
    po_id: string;
    invoice_id?: string;
    warehouse_id: string;
    grn_date: string;
    received_by: string;
    status: string; // 'pending_qc', 'qc_passed', 'qc_failed', 'accepted'
    created_at: string;
  };

  grn_items: {
    id: string;
    grn_id: string;
    item_id: string;
    ordered_qty: number;
    received_qty: number;
    accepted_qty: number;
    rejected_qty: number;
    batch_number?: string;
    lot_number?: string;
  };

  stock: {
    id: string;
    item_id: string;
    warehouse_id: string;
    batch_number?: string;
    lot_number?: string;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    last_updated: string;
  };

  stock_transactions: {
    id: string;
    transaction_type: string; // 'in', 'out', 'transfer', 'adjustment'
    reference_type: string; // 'grn', 'production', 'dispatch', 'transfer'
    reference_id: string;
    item_id: string;
    warehouse_id: string;
    quantity: number;
    batch_number?: string;
    transaction_date: string;
    created_by: string;
  };

  stock_transfers: {
    id: string;
    transfer_number: string;
    from_warehouse_id: string;
    to_warehouse_id: string;
    transfer_date: string;
    status: string; // 'pending', 'approved', 'in_transit', 'received'
    approved_by?: string;
    created_at: string;
    created_by: string;
  };

  stock_transfer_items: {
    id: string;
    transfer_id: string;
    item_id: string;
    quantity: number;
    batch_number?: string;
  };

  // PHASE 6: Quality Control
  qc_templates: {
    id: string;
    name: string;
    description?: string;
    qc_type: string; // 'incoming', 'in_process', 'final'
    is_active: boolean;
    created_by: string;
    created_at: string;
  };

  qc_template_steps: {
    id: string;
    template_id: string;
    step_number: number;
    parameter_name: string;
    specification: string;
    measurement_type: string; // 'numeric', 'text', 'pass_fail'
    min_value?: number;
    max_value?: number;
    is_mandatory: boolean;
  };

  qc_inspections: {
    id: string;
    inspection_number: string;
    template_id: string;
    reference_type: string; // 'grn', 'production', 'dispatch'
    reference_id: string;
    item_id: string;
    batch_number?: string;
    quantity: number;
    status: string; // 'pending', 'in_progress', 'passed', 'failed', 'hold'
    inspected_by?: string;
    inspected_at?: string;
    remarks?: string;
    created_at: string;
  };

  qc_inspection_results: {
    id: string;
    inspection_id: string;
    step_id: string;
    actual_value: string;
    status: string; // 'pass', 'fail', 'na'
    remarks?: string;
  };

  // PHASE 7: Manufacturing & Production
  bom: {
    id: string;
    item_id: string; // Finished/Semi-finished item
    version: string;
    is_active: boolean;
    effective_from: string;
    created_by: string;
    created_at: string;
  };

  bom_items: {
    id: string;
    bom_id: string;
    item_id: string; // Raw material/component
    quantity: number;
    wastage_percentage?: number;
  };

  work_orders: {
    id: string;
    wo_number: string;
    item_id: string;
    bom_id: string;
    planned_quantity: number;
    actual_quantity: number;
    status: string; // 'planned', 'released', 'in_progress', 'completed', 'closed'
    start_date: string;
    end_date?: string;
    warehouse_id: string;
    created_by: string;
    created_at: string;
  };

  material_consumption: {
    id: string;
    wo_id: string;
    item_id: string;
    planned_quantity: number;
    consumed_quantity: number;
    batch_number?: string;
    consumed_by: string;
    consumed_at: string;
  };

  production_output: {
    id: string;
    wo_id: string;
    item_id: string;
    quantity: number;
    scrap_quantity: number;
    rework_quantity: number;
    batch_number?: string;
    produced_by: string;
    produced_at: string;
  };

  // PHASE 8: Sales & Dispatch
  sales_leads: {
    id: string;
    lead_number: string;
    party_id: string;
    contact_person: string;
    phone: string;
    email?: string;
    status: string; // 'new', 'contacted', 'qualified', 'quote_sent', 'won', 'lost'
    source?: string;
    created_at: string;
    created_by: string;
  };

  sales_quotations: {
    id: string;
    quotation_number: string;
    party_id: string;
    quotation_date: string;
    valid_until: string;
    total_amount: number;
    status: string; // 'draft', 'sent', 'accepted', 'rejected'
    created_at: string;
    created_by: string;
  };

  sales_quotation_items: {
    id: string;
    quotation_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    total_amount: number;
  };

  sales_orders: {
    id: string;
    order_number: string;
    quotation_id?: string;
    party_id: string;
    order_date: string;
    delivery_date: string;
    total_amount: number;
    status: string; // 'confirmed', 'in_production', 'ready', 'dispatched', 'delivered'
    created_at: string;
    created_by: string;
  };

  sales_order_items: {
    id: string;
    order_id: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    gst_amount: number;
    total_amount: number;
  };

  delivery_challans: {
    id: string;
    challan_number: string;
    order_id: string;
    party_id: string;
    warehouse_id: string;
    challan_date: string;
    transporter_name?: string;
    vehicle_number?: string;
    lr_number?: string;
    eway_bill_number?: string;
    status: string; // 'pending_approval', 'approved', 'dispatched', 'delivered'
    approved_by?: string;
    approved_at?: string;
    created_at: string;
    created_by: string;
  };

  challan_items: {
    id: string;
    challan_id: string;
    item_id: string;
    quantity: number;
    batch_number?: string;
  };

  eway_bills: {
    id: string;
    eway_bill_number: string;
    challan_id?: string;
    invoice_id?: string;
    generated_date: string;
    valid_until: string;
    status: string; // 'active', 'cancelled', 'expired'
    generated_by: string;
    cancelled_by?: string;
    cancelled_at?: string;
    api_response?: string;
  };

  // PHASE 9: Accounting & GST
  ledgers: {
    id: string;
    code: string;
    name: string;
    group: string; // 'assets', 'liabilities', 'income', 'expenses'
    opening_balance: number;
    current_balance: number;
    is_active: boolean;
  };

  vouchers: {
    id: string;
    voucher_number: string;
    voucher_type: string; // 'payment', 'receipt', 'journal', 'contra'
    voucher_date: string;
    reference_type?: string;
    reference_id?: string;
    narration?: string;
    total_amount: number;
    created_by: string;
    created_at: string;
  };

  voucher_entries: {
    id: string;
    voucher_id: string;
    ledger_id: string;
    debit_amount: number;
    credit_amount: number;
  };

  gst_transactions: {
    id: string;
    transaction_type: string; // 'purchase', 'sales'
    reference_type: string;
    reference_id: string;
    party_id: string;
    gstin: string;
    invoice_number: string;
    invoice_date: string;
    taxable_amount: number;
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    total_amount: number;
    gst_rate: number;
    created_at: string;
  };

  gst_payments: {
    id: string;
    payment_date: string;
    period: string; // 'MM-YYYY'
    cgst_amount: number;
    sgst_amount: number;
    igst_amount: number;
    total_amount: number;
    challan_number?: string;
    payment_status: string; // 'pending', 'initiated', 'success', 'failed'
    api_response?: string;
    paid_by: string;
    paid_at?: string;
  };

  // PHASE 10: HRM
  employees: {
    id: string;
    employee_code: string;
    user_id?: string;
    name: string;
    department_id: string;
    designation: string;
    date_of_joining: string;
    date_of_birth?: string;
    phone: string;
    email?: string;
    address?: string;
    bank_account?: string;
    ifsc_code?: string;
    pan?: string;
    aadhaar?: string;
    basic_salary: number;
    is_active: boolean;
    created_at: string;
  };

  attendance: {
    id: string;
    employee_id: string;
    attendance_date: string;
    check_in?: string;
    check_out?: string;
    status: string; // 'present', 'absent', 'half_day', 'leave'
    remarks?: string;
  };

  leave_policies: {
    id: string;
    name: string;
    leave_type: string; // 'casual', 'sick', 'earned', 'maternity'
    annual_quota: number;
    carry_forward: boolean;
    is_active: boolean;
  };

  leave_applications: {
    id: string;
    employee_id: string;
    leave_type: string;
    from_date: string;
    to_date: string;
    days: number;
    reason: string;
    status: string; // 'pending', 'approved', 'rejected'
    approved_by?: string;
    approved_at?: string;
    created_at: string;
  };

  payroll: {
    id: string;
    employee_id: string;
    month: string; // 'MM-YYYY'
    basic_salary: number;
    allowances: number;
    deductions: number;
    net_salary: number;
    status: string; // 'draft', 'processed', 'paid'
    processed_by?: string;
    processed_at?: string;
  };

  // Audit Logs
  audit_logs: {
    id: string;
    user_id: string;
    action: string;
    module: string;
    record_id?: string;
    old_value?: string;
    new_value?: string;
    ip_address?: string;
    timestamp: string;
  };

  // Offline Sync
  offline_transactions: {
    id: string;
    transaction_data: string; // JSON
    transaction_type: string;
    device_id: string;
    created_at: string;
    synced: boolean;
    synced_at?: string;
    conflict: boolean;
    conflict_resolution?: string;
  };
}

export type TableName = keyof DBSchema;
