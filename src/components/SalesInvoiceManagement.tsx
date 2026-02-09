import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  Receipt, 
  Plus, 
  Eye, 
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Send,
  Trash2,
  ShoppingCart,
  Package,
  Calendar,
  DollarSign,
  Printer,
  Mail
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function SalesInvoiceManagement() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Dialog states
  const [autoInvoiceDialog, setAutoInvoiceDialog] = useState(false);
  const [customInvoiceDialog, setCustomInvoiceDialog] = useState(false);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Auto Invoice form (from Sales Order/Quotation)
  const [autoSource, setAutoSource] = useState<'sales_order' | 'quotation'>('sales_order');
  const [selectedSourceId, setSelectedSourceId] = useState('');

  // Custom Invoice form
  const [customForm, setCustomForm] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'net_30',
    reference_number: '',
    notes: '',
  });

  const [customItems, setCustomItems] = useState<any[]>([
    { item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', hsn_code: '' }
  ]);

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const result = await api.getCurrentUserDetails();
      setCurrentUser(result.user);
    } catch (error: any) {
      console.error('Failed to load user:', error.message);
    }
  };

  const loadData = async () => {
    try {
      const [invoicesResult, ordersResult, quotationsResult, customersResult, itemsResult] = await Promise.all([
        api.getInvoices(),
        api.getSalesOrders(),
        api.getSalesQuotations(),
        api.getParties('customer'),
        api.getItems(),
      ]);
      
      setInvoices(invoicesResult.invoices || []);
      setSalesOrders(ordersResult.orders || []);
      setQuotations(quotationsResult.quotations || []);
      setCustomers(customersResult.parties || []);
      setItems(itemsResult.items?.filter((i: any) => i.type === 'finished_good') || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get eligible sales orders (completed production or ready to ship)
  const getEligibleSalesOrders = () => {
    return salesOrders.filter(order => 
      ['ready_to_ship', 'shipped', 'delivered'].includes(order.status) ||
      order.fulfillment_status === 'ready'
    );
  };

  // Get approved quotations
  const getApprovedQuotations = () => {
    return quotations.filter(q => q.status === 'approved');
  };

  // Handle auto invoice generation from Sales Order or Quotation
  const handleGenerateAutoInvoice = async () => {
    try {
      if (!selectedSourceId) {
        toast.error('Please select a sales order or quotation');
        return;
      }

      const result = await api.generateInvoiceFromSource({
        source_type: autoSource,
        source_id: selectedSourceId
      });

      toast.success('✅ Invoice generated successfully!');
      setAutoInvoiceDialog(false);
      setSelectedSourceId('');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to generate invoice: ${error.message}`);
    }
  };

  // Custom invoice item management
  const addCustomItem = () => {
    setCustomItems([...customItems, { 
      item_id: '', 
      quantity: '', 
      rate: '', 
      discount: '0', 
      tax_rate: '18',
      hsn_code: ''
    }]);
  };

  const removeCustomItem = (index: number) => {
    const updated = customItems.filter((_, i) => i !== index);
    setCustomItems(updated.length > 0 ? updated : [{ 
      item_id: '', 
      quantity: '', 
      rate: '', 
      discount: '0', 
      tax_rate: '18',
      hsn_code: ''
    }]);
  };

  const updateCustomItem = (index: number, field: string, value: any) => {
    const updated = [...customItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill item details
    if (field === 'item_id' && value) {
      const item = items.find(i => i.id === value);
      if (item) {
        updated[index].rate = item.selling_price?.toString() || '';
        updated[index].hsn_code = item.hsn_code || '';
        updated[index].tax_rate = item.gst_rate?.toString() || '18';
      }
    }
    
    setCustomItems(updated);
  };

  const calculateItemTotal = (item: any) => {
    const qty = parseFloat(item.quantity || '0');
    const rate = parseFloat(item.rate || '0');
    const discount = parseFloat(item.discount || '0');
    const taxRate = parseFloat(item.tax_rate || '0');
    
    const subtotal = qty * rate;
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    
    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      total: taxableAmount + taxAmount
    };
  };

  const calculateInvoiceTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    customItems.forEach(item => {
      const calc = calculateItemTotal(item);
      subtotal += calc.subtotal;
      totalDiscount += calc.discountAmount;
      totalTax += calc.taxAmount;
    });
    
    const taxableAmount = subtotal - totalDiscount;
    const grandTotal = taxableAmount + totalTax;
    
    return { subtotal, totalDiscount, taxableAmount, totalTax, grandTotal };
  };

  // Handle custom invoice creation
  const handleCreateCustomInvoice = async () => {
    try {
      if (!customForm.customer_id || !customForm.due_date || customItems.length === 0) {
        toast.error('Please fill all required fields and add at least one item');
        return;
      }

      // Validate items
      for (const item of customItems) {
        if (!item.item_id || !item.quantity || !item.rate) {
          toast.error('All items must have product, quantity, and rate');
          return;
        }
      }

      const items = customItems.map(item => {
        const calc = calculateItemTotal(item);
        return {
          item_id: item.item_id,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          discount_percent: parseFloat(item.discount || '0'),
          discount_amount: calc.discountAmount,
          tax_rate: parseFloat(item.tax_rate),
          tax_amount: calc.taxAmount,
          total_amount: calc.total,
          hsn_code: item.hsn_code
        };
      });

      const result = await api.createCustomInvoice({
        ...customForm,
        items
      });

      toast.success('✅ Custom invoice created successfully!');
      setCustomInvoiceDialog(false);
      resetCustomForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create invoice: ${error.message}`);
    }
  };

  const resetCustomForm = () => {
    setCustomForm({
      customer_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_terms: 'net_30',
      reference_number: '',
      notes: '',
    });
    setCustomItems([{ 
      item_id: '', 
      quantity: '', 
      rate: '', 
      discount: '0', 
      tax_rate: '18',
      hsn_code: ''
    }]);
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || 'Unknown';
  };

  const getItemName = (itemId: string) => {
    return items.find(i => i.id === itemId)?.name || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { bg: string, text: string }> = {
      'draft': { bg: 'bg-gray-100', text: 'text-gray-800' },
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'sent': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'partially_paid': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'paid': { bg: 'bg-green-100', text: 'text-green-800' },
      'overdue': { bg: 'bg-red-100', text: 'text-red-800' },
      'cancelled': { bg: 'bg-gray-100', text: 'text-gray-600' },
    };
    const variant = variants[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return <Badge className={`${variant.bg} ${variant.text}`}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  const totals = calculateInvoiceTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="size-8" />
            Sales Invoice Management
          </h1>
          <p className="text-gray-500 mt-1">Generate invoices from orders or create custom invoices</p>
        </div>
        <div className="flex gap-2">
          {/* Auto Invoice from Sales Order/Quotation */}
          <Dialog open={autoInvoiceDialog} onOpenChange={setAutoInvoiceDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <ShoppingCart className="size-4 mr-2" />
                From Order/Quotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Invoice from Order/Quotation</DialogTitle>
                <DialogDescription>
                  Create invoice automatically from approved quotation or completed sales order
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Source Type</Label>
                  <Tabs value={autoSource} onValueChange={(v) => setAutoSource(v as any)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sales_order">Sales Order</TabsTrigger>
                      <TabsTrigger value="quotation">Quotation</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <Label>
                    Select {autoSource === 'sales_order' ? 'Sales Order' : 'Quotation'}
                  </Label>
                  <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${autoSource === 'sales_order' ? 'Order' : 'Quotation'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {autoSource === 'sales_order' 
                        ? getEligibleSalesOrders().map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.order_number} - {getCustomerName(order.party_id)} - ₹{order.total_amount?.toLocaleString('en-IN')}
                            </SelectItem>
                          ))
                        : getApprovedQuotations().map((quot) => (
                            <SelectItem key={quot.id} value={quot.id}>
                              {quot.quotation_number} - {getCustomerName(quot.party_id)} - ₹{quot.total_amount?.toLocaleString('en-IN')}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                  {autoSource === 'sales_order' && getEligibleSalesOrders().length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">
                      No eligible sales orders. Orders must be "Ready to Ship" or "Completed".
                    </p>
                  )}
                  {autoSource === 'quotation' && getApprovedQuotations().length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">
                      No approved quotations available.
                    </p>
                  )}
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <CheckCircle className="size-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Auto-Generate Invoice</AlertTitle>
                  <AlertDescription className="text-blue-800">
                    System will automatically pull customer details, items, quantities, prices, and GST calculations 
                    from the selected {autoSource === 'sales_order' ? 'sales order' : 'quotation'}.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAutoInvoiceDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateAutoInvoice} disabled={!selectedSourceId}>
                  <FileText className="size-4 mr-2" />
                  Generate Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Custom Invoice */}
          <Dialog open={customInvoiceDialog} onOpenChange={setCustomInvoiceDialog}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="size-4 mr-2" />
                Create Custom Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Custom Invoice</DialogTitle>
                <DialogDescription>
                  For direct orders or available stock - manually enter invoice details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer & Invoice Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Customer *</Label>
                    <Select
                      value={customForm.customer_id}
                      onValueChange={(value) => setCustomForm({ ...customForm, customer_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.gstin || 'No GSTIN'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment_terms">Payment Terms *</Label>
                    <Select
                      value={customForm.payment_terms}
                      onValueChange={(value) => setCustomForm({ ...customForm, payment_terms: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="net_15">Net 15 Days</SelectItem>
                        <SelectItem value="net_30">Net 30 Days</SelectItem>
                        <SelectItem value="net_45">Net 45 Days</SelectItem>
                        <SelectItem value="net_60">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="invoice_date">Invoice Date *</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={customForm.invoice_date}
                      onChange={(e) => setCustomForm({ ...customForm, invoice_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={customForm.due_date}
                      onChange={(e) => setCustomForm({ ...customForm, due_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="reference_number">Reference Number</Label>
                    <Input
                      id="reference_number"
                      placeholder="PO/Ref No."
                      value={customForm.reference_number}
                      onChange={(e) => setCustomForm({ ...customForm, reference_number: e.target.value })}
                    />
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Invoice Items</Label>
                    <Button onClick={addCustomItem} variant="outline" size="sm">
                      <Plus className="size-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product *</TableHead>
                          <TableHead>HSN Code</TableHead>
                          <TableHead>Qty *</TableHead>
                          <TableHead>Rate (₹) *</TableHead>
                          <TableHead>Discount %</TableHead>
                          <TableHead>GST %</TableHead>
                          <TableHead>Total (₹)</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Select
                                value={item.item_id}
                                onValueChange={(value) => updateCustomItem(index, 'item_id', value)}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Select Product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {items.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="HSN"
                                value={item.hsn_code}
                                onChange={(e) => updateCustomItem(index, 'hsn_code', e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.quantity}
                                onChange={(e) => updateCustomItem(index, 'quantity', e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.rate}
                                onChange={(e) => updateCustomItem(index, 'rate', e.target.value)}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="0"
                                value={item.discount}
                                onChange={(e) => updateCustomItem(index, 'discount', e.target.value)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                placeholder="18"
                                value={item.tax_rate}
                                onChange={(e) => updateCustomItem(index, 'tax_rate', e.target.value)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="font-semibold">
                              ₹{calculateItemTotal(item).total.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomItem(index)}
                                disabled={customItems.length === 1}
                              >
                                <Trash2 className="size-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Invoice Totals */}
                  <div className="flex justify-end">
                    <Card className="w-80">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Discount:</span>
                          <span className="text-red-600">-₹{totals.totalDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Taxable Amount:</span>
                          <span>₹{totals.taxableAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>GST:</span>
                          <span>₹{totals.totalTax.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center">
                          <span className="font-semibold">Grand Total:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ₹{totals.grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes / Terms & Conditions</Label>
                  <Textarea
                    id="notes"
                    placeholder="Payment terms, delivery instructions, etc."
                    value={customForm.notes}
                    onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomInvoiceDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomInvoice}>
                  <CheckCircle className="size-4 mr-2" />
                  Create Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{invoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {invoices.filter(i => i.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {invoices.filter(i => i.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ₹{invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0).toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sales Invoices</CardTitle>
          <CardDescription>Complete list of customer invoices with payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{getCustomerName(invoice.party_id || invoice.customer_id)}</TableCell>
                  <TableCell>{invoice.invoice_date}</TableCell>
                  <TableCell>{invoice.due_date}</TableCell>
                  <TableCell className="font-semibold">
                    ₹{invoice.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {invoice.source_type || 'custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setViewInvoiceDialog(true);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No invoices yet. Create your first invoice to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* How It Works Guide */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            <FileText className="size-5" />
            📋 Invoice Creation Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">🔄 Automatic Invoice (From Order/Quotation)</h4>
              <ol className="space-y-2 list-decimal list-inside text-gray-700">
                <li>Click "From Order/Quotation" button</li>
                <li>Choose source: Sales Order or Quotation</li>
                <li>Select approved quotation or ready order</li>
                <li>System auto-generates invoice with all details</li>
                <li>Customer, items, prices, GST - all automatic!</li>
              </ol>
              <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-800">
                <strong>Best for:</strong> Orders that went through full workflow (Quotation → Order → Production → Ready)
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">✏️ Custom Invoice (Direct Entry)</h4>
              <ol className="space-y-2 list-decimal list-inside text-gray-700">
                <li>Click "Create Custom Invoice" button</li>
                <li>Select customer from dropdown</li>
                <li>Add products manually (stock available)</li>
                <li>Set quantities, rates, discounts</li>
                <li>System calculates GST automatically</li>
                <li>Create invoice - Done!</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                <strong>Best for:</strong> Walk-in customers, cash sales, stock clearance, or direct orders without quotation
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
