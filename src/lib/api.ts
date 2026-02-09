import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// ✅ FIXED: API now points to the correct Edge Function endpoint
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb`;

// Auth helpers
export const getAccessToken = async () => {
  try {
    // First try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Session retrieval error:', error);
      return null;
    }
    
    // If no session, return null
    if (!session) {
      console.warn('⚠️ No active session found - user needs to log in');
      return null;
    }
    
    console.log('✅ Session found:', {
      user: session.user?.email,
      tokenPrefix: session.access_token?.substring(0, 20) + '...',
      expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      isExpired: session.expires_at ? (session.expires_at * 1000) < Date.now() : false
    });
    
    // Check if token is expired or expiring soon
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    const isExpired = expiresAt < now;
    const isExpiringSoon = expiresAt - now < 300000; // Less than 5 minutes
    
    if (isExpired || isExpiringSoon) {
      console.log('⏰ Token expired or expiring soon, refreshing session...');
      // Refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Session refresh error:', refreshError);
        // Clear the invalid session
        await supabase.auth.signOut();
        return null;
      }
      
      if (refreshData.session) {
        console.log('✅ Session refreshed successfully');
        return refreshData.session.access_token;
      } else {
        console.error('❌ Session refresh returned no session');
        await supabase.auth.signOut();
        return null;
      }
    }
    
    return session.access_token || null;
  } catch (error) {
    console.error('❌ Error getting access token:', error);
    return null;
  }
};

// Helper to get token synchronously from Supabase's internal storage (for non-async contexts)
// NOTE: This should only be used when you can't use async/await. Prefer getAccessToken() when possible.
export const getAccessTokenSync = (): string | null => {
  try {
    // Supabase stores session in localStorage with a specific key pattern
    const keys = Object.keys(localStorage);
    const authKey = keys.find(key => key.startsWith('sb-') && key.includes('-auth-token'));
    
    if (!authKey) {
      console.warn('⚠️ No Supabase auth token found in localStorage');
      return null;
    }
    
    const sessionData = localStorage.getItem(authKey);
    if (!sessionData) {
      return null;
    }
    
    const parsed = JSON.parse(sessionData);
    const token = parsed?.access_token || null;
    
    if (!token) {
      console.warn('⚠️ No access_token in session data');
      return null;
    }
    
    // Basic validation: JWT should have 3 segments separated by dots
    const segments = token.split('.');
    if (segments.length !== 3) {
      console.error('❌ Invalid JWT format: token does not have 3 segments');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error getting access token synchronously:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    // Use getSession instead of getUser - it automatically handles token refresh
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting current user session:', error);
      return null;
    }
    
    if (!session) {
      console.warn('⚠️ No active session found');
      return null;
    }
    
    // Check if token is expired
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    const isExpired = expiresAt < now;
    
    if (isExpired) {
      console.log('⏰ Token expired, attempting refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        console.error('❌ Failed to refresh session:', refreshError);
        await supabase.auth.signOut();
        return null;
      }
      
      console.log('✅ Session refreshed successfully');
      return refreshData.session.user;
    }
    
    return session.user;
  } catch (error) {
    console.error('❌ Error in getCurrentUser:', error);
    return null;
  }
};

// API Client
class APIClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await getAccessToken();
    
    // If no token and this isn't a public endpoint, throw auth error
    if (!token && !endpoint.includes('/auth/signup') && !endpoint.includes('/health')) {
      console.error('No valid authentication token available');
      throw new Error('Authentication required - Please log in again');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': publicAnonKey, // REQUIRED: Supabase needs this for all Edge Function calls
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // For public endpoints, still need to send anon key as Bearer token
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = 'API request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error(`API Error [${endpoint}] ${response.status}:`, errorData);
          
          // Handle authentication errors specifically
          if (response.status === 401) {
            console.error('Authentication error detected, clearing session');
            // Clear the invalid session
            await supabase.auth.signOut();
            throw new Error(`${errorMessage} - You have been logged out.`);
          }
        } catch (e: any) {
          // If error parsing failed but we already have an error object, rethrow it
          if (e.message && e.message.includes('logged out')) {
            throw e;
          }
          errorMessage = `${response.status} ${response.statusText}`;
          console.error(`API Error [${endpoint}] ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Auth
  async signup(email: string, password: string, name: string, phone?: string, employee_code?: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone, employee_code }),
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });
  }

  async getCurrentUserDetails() {
    return this.request('/auth/me');
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  // Roles
  async createRole(name: string, description: string, permissions: any[]) {
    return this.request('/roles', {
      method: 'POST',
      body: JSON.stringify({ name, description, permissions }),
    });
  }

  async getRoles() {
    return this.request('/roles');
  }

  async assignRole(userId: string, roleId: string, warehouseId?: string, departmentId?: string) {
    return this.request(`/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId, warehouse_id: warehouseId, department_id: departmentId }),
    });
  }

  async getRolePermissions(roleId: string) {
    return this.request(`/roles/${roleId}/permissions`);
  }

  // Master Data
  async createWarehouse(code: string, name: string, location: string) {
    return this.request('/warehouses', {
      method: 'POST',
      body: JSON.stringify({ code, name, location }),
    });
  }

  async getWarehouses() {
    return this.request('/warehouses');
  }

  async createDepartment(code: string, name: string) {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify({ code, name }),
    });
  }

  async getDepartments() {
    return this.request('/departments');
  }

  async createUOM(code: string, name: string, description?: string) {
    return this.request('/uom', {
      method: 'POST',
      body: JSON.stringify({ code, name, description }),
    });
  }

  async getUOMs() {
    return this.request('/uom');
  }

  async createCategory(name: string, type: string, parentId?: string) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, type, parent_id: parentId }),
    });
  }

  async getCategories() {
    return this.request('/categories');
  }

  async createItem(data: any) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getItems() {
    return this.request('/items');
  }

  async getItem(id: string) {
    return this.request(`/items/${id}`);
  }

  async createParty(data: any) {
    return this.request('/parties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getParties(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.request(`/parties${query}`);
  }

  // Purchase Requisitions
  async createPR(departmentId: string, items: any[], remarks?: string) {
    return this.request('/purchase-requisitions', {
      method: 'POST',
      body: JSON.stringify({ department_id: departmentId, items, remarks }),
    });
  }

  // Alias for createPR - accepts full data object
  async createPurchaseRequisition(data: any) {
    return this.request('/purchase-requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPRs() {
    return this.request('/purchase-requisitions');
  }

  async getPRItems(prId: string) {
    return this.request(`/purchase-requisitions/${prId}/items`);
  }

  async submitPR(prId: string) {
    return this.request(`/purchase-requisitions/${prId}/submit`, {
      method: 'PUT',
    });
  }

  // Quotations
  async createQuotation(data: any) {
    return this.request('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadQuotation(data: any) {
    return this.request('/quotations/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQuotations(prId?: string) {
    const query = prId ? `?pr_id=${prId}` : '';
    return this.request(`/quotations${query}`);
  }

  async getQuotationItems(quotationId: string) {
    return this.request(`/quotations/${quotationId}/items`);
  }

  async approveQuotation(quotationId: string) {
    return this.request(`/quotations/${quotationId}/approve`, {
      method: 'PUT',
    });
  }

  async rejectQuotation(quotationId: string) {
    return this.request(`/quotations/${quotationId}/reject`, {
      method: 'PUT',
    });
  }

  async markQuotationAsBest(quotationId: string) {
    return this.request(`/quotations/${quotationId}/mark-best`, {
      method: 'PUT',
    });
  }

  async createPOFromQuotation(quotationId: string) {
    return this.request(`/quotations/${quotationId}/create-po`, {
      method: 'POST',
    });
  }

  // Purchase Orders
  async createPO(quotationId: string, deliveryDate: string) {
    return this.request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify({ quotation_id: quotationId, delivery_date: deliveryDate }),
    });
  }

  async getPOs() {
    return this.request('/purchase-orders');
  }

  async getPOItems(poId: string) {
    return this.request(`/purchase-orders/${poId}/items`);
  }

  async approvePO(poId: string) {
    return this.request(`/purchase-orders/${poId}/approve`, {
      method: 'PUT',
    });
  }

  // Invoices
  async uploadInvoiceDocument(file: File) {
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('Authentication required - Please log in again');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/invoices/upload-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': publicAnonKey,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload document');
    }
    
    return response.json();
  }

  async uploadInvoice(data: any) {
    return this.request('/invoices/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createInvoice(data: any) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvoices() {
    return this.request('/invoices');
  }

  async generateInvoiceFromSource(data: any) {
    return this.request('/invoices/generate-from-source', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createCustomInvoice(data: any) {
    return this.request('/invoices/custom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getInvoice(invoiceId: string) {
    return this.request(`/invoices/${invoiceId}`);
  }

  async adminApproveInvoice(invoiceId: string, reason: string) {
    return this.request(`/invoices/${invoiceId}/admin-approve`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async requestInvoiceEdit(invoiceId: string) {
    return this.request(`/invoices/${invoiceId}/request-edit`, {
      method: 'PUT',
    });
  }

  async approveInvoiceEdit(invoiceId: string) {
    return this.request(`/invoices/${invoiceId}/approve-edit`, {
      method: 'PUT',
    });
  }

  // Inventory
  async createGRN(data: any) {
    return this.request('/grn', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGRNs() {
    return this.request('/grn');
  }

  async completeGRN(grnId: string, actualItems: any[]) {
    return this.request(`/grn/${grnId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ actual_items: actualItems }),
    });
  }

  async getStock(warehouseId?: string) {
    const query = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return this.request(`/stock${query}`);
  }

  async getInventory(warehouseId?: string) {
    const query = warehouseId ? `?warehouse_id=${warehouseId}` : '';
    return this.request(`/stock${query}`); // Use /stock endpoint (inventory is stock data)
  }

  async updateStock(data: any) {
    return this.request('/stock/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adjustStock(data: any) {
    return this.request('/stock/adjustment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async setStockLevels(itemId: string, warehouseId: string, data: any) {
    return this.request(`/stock/levels/${itemId}/${warehouseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getLowStock() {
    return this.request('/stock/low-stock');
  }

  async getStockTransactions(itemId?: string, warehouseId?: string) {
    const params = new URLSearchParams();
    if (itemId) params.append('item_id', itemId);
    if (warehouseId) params.append('warehouse_id', warehouseId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/stock/transactions${query}`);
  }

  async getStockAdjustments() {
    return this.request('/stock/adjustments');
  }

  async transferStock(data: any) {
    return this.request('/stock/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Quality Control
  async createQCTemplate(data: any) {
    return this.request('/qc/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQCTemplates() {
    return this.request('/qc/templates');
  }

  async createQCInspection(data: any) {
    return this.request('/qc/inspections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getQCInspections() {
    return this.request('/qc/inspections');
  }

  async getQCBatches() {
    return this.request('/qc/inspections'); // QC batches are the same as inspections
  }

  async completeQCInspection(inspectionId: string, results: any[], status: string, remarks?: string) {
    return this.request(`/qc/inspections/${inspectionId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ results, status, remarks }),
    });
  }

  async adminOverrideQC(inspectionId: string, overrideStatus: string, overrideReason: string) {
    return this.request(`/qc/inspections/${inspectionId}/admin-approve`, {
      method: 'PUT',
      body: JSON.stringify({ override_status: overrideStatus, override_reason: overrideReason }),
    });
  }

  async getQCTemplateSteps(templateId: string) {
    return this.request(`/qc/templates/${templateId}/steps`);
  }

  async getQCInspectionResults(inspectionId: string) {
    return this.request(`/qc/inspections/${inspectionId}/results`);
  }

  // BOM & Production
  async createBOM(data: any) {
    return this.request('/bom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBOMs() {
    return this.request('/bom');
  }

  async getBOMComponents(bomId: string) {
    return this.request(`/bom/${bomId}/components`);
  }

  async createWorkOrder(data: any) {
    return this.request('/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkOrders() {
    return this.request('/work-orders');
  }

  async getProductionOrders() {
    return this.request('/production-orders');
  }

  async consumeMaterial(woId: string, itemId: string, quantity: number, batchNumber?: string) {
    return this.request(`/work-orders/${woId}/consume`, {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity, batch_number: batchNumber }),
    });
  }

  async produceOutput(woId: string, data: any) {
    return this.request(`/work-orders/${woId}/produce`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // New Production Workflow Methods
  async startWorkOrder(woId: string) {
    return this.request(`/work-orders/${woId}/start`, {
      method: 'POST',
    });
  }

  async issueMaterials(woId: string, materials: any[]) {
    return this.request(`/work-orders/${woId}/issue-materials`, {
      method: 'POST',
      body: JSON.stringify({ materials }),
    });
  }

  async recordProduction(woId: string, data: any) {
    return this.request(`/work-orders/${woId}/record-production`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitForQC(woId: string) {
    return this.request(`/work-orders/${woId}/submit-qc`, {
      method: 'POST',
    });
  }

  async qcApprove(woId: string, data: any) {
    return this.request(`/work-orders/${woId}/qc-approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkOrderTimeline(woId: string) {
    return this.request(`/work-orders/${woId}/timeline`);
  }

  // Sales
  async createSalesQuotation(data: any) {
    return this.request('/sales-quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSalesQuotations() {
    return this.request('/sales-quotations');
  }

  async approveSalesQuotation(quotationId: string) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 API: Starting Sales Quotation Approval Flow');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Quotation ID:', quotationId);
    console.log('🔍 Quotation ID type:', typeof quotationId);
    console.log('🔍 Quotation ID length:', quotationId?.length);
    
    const endpoint = `/sales-quotations/${quotationId}/approve`;
    console.log('🌐 Full endpoint:', endpoint);
    console.log('🌐 Full URL:', `${API_BASE}${endpoint}`);
    console.log('🌐 Method: PUT');
    
    // Check authentication before making request
    const token = await getAccessToken();
    if (!token) {
      console.error('❌ No authentication token available!');
      throw new Error('Authentication required - Please log in again');
    }
    console.log('✅ Auth token available, length:', token.length);
    console.log('✅ Token prefix:', token.substring(0, 20) + '...');
    
    console.log('📤 Making PUT request to approval endpoint...');
    const startTime = Date.now();
    
    try {
      const result = await this.request(endpoint, {
        method: 'PUT',
      });
      
      const duration = Date.now() - startTime;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Approval request SUCCESSFUL');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏱️ Duration:', duration, 'ms');
      console.log('📊 Response:', result);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('❌ Approval request FAILED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⏱️ Duration before error:', duration, 'ms');
      console.log('❌ Error message:', error.message);
      console.log('❌ Error stack:', error.stack);
      console.log('🔍 Endpoint that failed:', endpoint);
      console.log('🔍 Full URL that failed:', `${API_BASE}${endpoint}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      throw error;
    }
  }

  async rejectSalesQuotation(quotationId: string) {
    return this.request(`/sales-quotations/${quotationId}/reject`, {
      method: 'PUT',
    });
  }

  // Approval Rules
  async getApprovalRules() {
    return this.request('/approval-rules');
  }

  async createApprovalRule(data: any) {
    return this.request('/approval-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApprovalRule(ruleId: string, data: any) {
    return this.request(`/approval-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApprovalRule(ruleId: string) {
    return this.request(`/approval-rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async createSalesOrder(data: any) {
    return this.request('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSalesOrders() {
    return this.request('/sales-orders');
  }

  // Delivery Challan & E-Way Bill
  async createDeliveryChallan(data: any) {
    return this.request('/delivery-challans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeliveryChallans() {
    return this.request('/delivery-challans');
  }

  async approveDeliveryChallan(challanId: string) {
    return this.request(`/delivery-challans/${challanId}/approve`, {
      method: 'PUT',
    });
  }

  async generateEWayBill(data: any) {
    return this.request('/eway-bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEWayBills() {
    return this.request('/eway-bills');
  }

  async cancelEWayBill(ewayBillId: string) {
    return this.request(`/eway-bills/${ewayBillId}/cancel`, {
      method: 'PUT',
    });
  }

  // GST
  async createGSTTransaction(data: any) {
    return this.request('/gst/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGSTTransactions(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.request(`/gst/transactions${query}`);
  }

  async initiateGSTPayment(data: any) {
    return this.request('/gst/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGSTPayments() {
    return this.request('/gst/payments');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Audit Logs
  async getAuditLogs(module?: string) {
    const query = module ? `?module=${module}` : '';
    return this.request(`/audit-logs${query}`);
  }

  // Offline Mode & Sync
  async getOfflineTransactions() {
    return this.request('/offline/transactions');
  }

  async createOfflineTransaction(data: any) {
    return this.request('/offline/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async syncOfflineTransactions() {
    return this.request('/offline/sync', {
      method: 'POST',
    });
  }

  async resolveOfflineConflict(transactionId: string, resolution: string) {
    return this.request(`/offline/resolve/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }

  async clearSyncedOfflineTransactions() {
    return this.request('/offline/clear-synced', {
      method: 'DELETE',
    });
  }

  // Public property for baseURL
  get baseURL() {
    return API_BASE;
  }

  // ==================== PAYMENT TRACKING ====================
  
  // Record sales payment
  createSalesPayment(paymentData: any) {
    return this.request('/sales-payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Get payments for sales order
  getSalesOrderPayments(orderId: string) {
    return this.request(`/sales-orders/${orderId}/payments`, {
      method: 'GET',
    });
  }

  // Get all sales payments for a party
  getPartySalesPayments(partyId: string) {
    return this.request(`/parties/${partyId}/sales-payments`, {
      method: 'GET',
    });
  }

  // Record purchase payment
  createPurchasePayment(paymentData: any) {
    return this.request('/purchase-payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Get payments for purchase order
  getPurchaseOrderPayments(orderId: string) {
    return this.request(`/purchase-orders/${orderId}/payments`, {
      method: 'GET',
    });
  }

  // Get all purchase payments for a party
  getPartyPurchasePayments(partyId: string) {
    return this.request(`/parties/${partyId}/purchase-payments`, {
      method: 'GET',
    });
  }

  // Get party outstanding balance and credit utilization
  getPartyOutstanding(partyId: string) {
    return this.request(`/parties/${partyId}/outstanding`, {
      method: 'GET',
    });
  }

  // Manufacturing Process Guide
  async getManufacturingProcessSteps() {
    return this.request('/manufacturing-process/steps');
  }

  // ============================================
  // ACCOUNTING MODULE - Complete Accounting System
  // ============================================

  // Chart of Accounts - Groups
  async getAccountGroups() {
    return this.request('/accounting/groups');
  }

  async createAccountGroup(data: any) {
    return this.request('/accounting/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAccountGroup(id: string, data: any) {
    return this.request(`/accounting/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccountGroup(id: string) {
    return this.request(`/accounting/groups/${id}`, {
      method: 'DELETE',
    });
  }

  // Chart of Accounts - Ledgers
  async getAccountLedgers() {
    return this.request('/accounting/ledgers');
  }

  async getAccountLedger(id: string) {
    return this.request(`/accounting/ledgers/${id}`);
  }

  async createAccountLedger(data: any) {
    return this.request('/accounting/ledgers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAccountLedger(id: string, data: any) {
    return this.request(`/accounting/ledgers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccountLedger(id: string) {
    return this.request(`/accounting/ledgers/${id}`, {
      method: 'DELETE',
    });
  }

  // Vouchers
  async getVouchers(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/vouchers${query}`);
  }

  async getVoucher(id: string) {
    return this.request(`/accounting/vouchers/${id}`);
  }

  async createVoucher(data: any) {
    return this.request('/accounting/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVoucher(id: string, data: any) {
    return this.request(`/accounting/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteVoucher(id: string) {
    return this.request(`/accounting/vouchers/${id}`, {
      method: 'DELETE',
    });
  }

  // Books of Accounts
  async getDayBook(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/books/day-book${query}`);
  }

  async getCashBook(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/books/cash-book${query}`);
  }

  async getBankBook(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/books/bank-book${query}`);
  }

  async getLedgerBook(ledgerId: string, params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/books/ledger/${ledgerId}${query}`);
  }

  // Financial Reports
  async getTrialBalance(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/reports/trial-balance${query}`);
  }

  async getProfitLoss(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/reports/profit-loss${query}`);
  }

  async getBalanceSheet(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/reports/balance-sheet${query}`);
  }

  // GST Reports
  async getGSTR1(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/gst/gstr1${query}`);
  }

  async getGSTR2(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/gst/gstr2${query}`);
  }

  async getGSTR3B(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/gst/gstr3b${query}`);
  }

  // Outstanding Reports
  async getReceivables(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/reports/receivables${query}`);
  }

  async getPayables(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/accounting/reports/payables${query}`);
  }

  // Bank Reconciliation
  async getBankStatements(bankLedgerId: string, startDate?: string, endDate?: string) {
    const params: any = { bank_ledger_id: bankLedgerId };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const query = new URLSearchParams(params);
    return this.request(`/accounting/bank-reconciliation/statements?${query}`);
  }

  async createBankStatement(data: any) {
    return this.request('/accounting/bank-reconciliation/statements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBankStatement(id: string, data: any) {
    return this.request(`/accounting/bank-reconciliation/statements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBankStatement(id: string) {
    return this.request(`/accounting/bank-reconciliation/statements/${id}`, {
      method: 'DELETE',
    });
  }

  async matchTransactions(data: any) {
    return this.request('/accounting/bank-reconciliation/match', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // === HRM (Human Resource Management) ===
  
  // Employees
  async getEmployees() {
    return this.request('/hrm/employees');
  }

  async createEmployee(data: any) {
    return this.request('/hrm/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEmployee(id: string, data: any) {
    return this.request(`/hrm/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEmployee(id: string) {
    return this.request(`/hrm/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Attendance
  async getAttendance(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request(`/hrm/attendance${query}`);
  }

  async createAttendance(data: any) {
    return this.request('/hrm/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendance(id: string, data: any) {
    return this.request(`/hrm/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Leave Management
  async getLeaves() {
    return this.request('/hrm/leaves');
  }

  async createLeave(data: any) {
    return this.request('/hrm/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeave(id: string, data: any) {
    return this.request(`/hrm/leaves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Payroll
  async getPayrolls(month?: number, year?: number) {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const query = Object.keys(params).length > 0 ? `?${new URLSearchParams(params)}` : '';
    return this.request(`/hrm/payroll${query}`);
  }

  async createPayroll(data: any) {
    return this.request('/hrm/payroll', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayroll(id: string, data: any) {
    return this.request(`/hrm/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const api = new APIClient();
export { supabase };