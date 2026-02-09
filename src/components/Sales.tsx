import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { DollarSign, Plus, Eye, Users, FileText, TrendingUp, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function Sales() {
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [salesQuotations, setSalesQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Dialog states
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createQuotationOpen, setCreateQuotationOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [viewQuotationOpen, setViewQuotationOpen] = useState(false);
  const [viewOrderOpen, setViewOrderOpen] = useState(false);

  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Customer form state
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custGSTIN, setCustGSTIN] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState('');
  const [custCreditDays, setCustCreditDays] = useState('30');

  // Quotation form state
  const [quotCustomerId, setQuotCustomerId] = useState('');
  const [quotDate, setQuotDate] = useState(new Date().toISOString().split('T')[0]);
  const [quotValidUntil, setQuotValidUntil] = useState('');
  const [quotItems, setQuotItems] = useState<any[]>([
    { item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', total_amount: 0 }
  ]);
  const [quotRemarks, setQuotRemarks] = useState('');

  // Sales Order form state
  const [orderQuotationId, setOrderQuotationId] = useState('');
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState('');
  const [orderItems, setOrderItems] = useState<any[]>([
    { item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', total_amount: 0 }
  ]);
  const [orderRemarks, setOrderRemarks] = useState('');
  const [orderPaymentTerms, setOrderPaymentTerms] = useState('net_30');

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
      setLoading(true);
      const [ordersResult, quotationsResult, customersResult, itemsResult] = await Promise.all([
        api.getSalesOrders(),
        api.getSalesQuotations(),
        api.getParties('customer'),
        api.getItems()
      ]);
      
      setSalesOrders(ordersResult.orders || []);
      setSalesQuotations(quotationsResult.quotations || []);
      setCustomers(customersResult.parties || []);
      
      // Filter for finished goods
      const finishedGoods = itemsResult.items?.filter((i: any) => i.type === 'FG') || [];
      console.log('📦 All Items:', itemsResult.items);
      console.log('✅ Finished Goods Items:', finishedGoods);
      setItems(finishedGoods);
      
      if (finishedGoods.length === 0) {
        toast.error('No finished goods found! Please create items with type "Finished Goods" in Master Data.');
      }
    } catch (error: any) {
      toast.error(`Failed to load sales data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!custCode || !custName || !custPhone) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createParty({
        code: custCode,
        name: custName,
        type: 'customer',
        email: custEmail,
        phone: custPhone,
        address: custAddress,
        gstin: custGSTIN,
        credit_limit: custCreditLimit ? parseFloat(custCreditLimit) : null,
        credit_days: parseInt(custCreditDays)
      });

      toast.success('Customer created successfully!');
      setCreateCustomerOpen(false);
      resetCustomerForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create customer: ${error.message}`);
    }
  };

  const handleCreateQuotation = async () => {
    if (!quotCustomerId || quotItems.length === 0 || !quotValidUntil) {
      toast.error('Please fill all required fields and add at least one item');
      return;
    }

    // Validate items
    for (const item of quotItems) {
      if (!item.item_id || !item.quantity || !item.rate) {
        toast.error('All items must have item, quantity, and rate');
        return;
      }
    }

    try {
      const items = quotItems.map(item => {
        const qty = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const discount = parseFloat(item.discount || '0');
        const taxRate = parseFloat(item.tax_rate);
        
        const subtotal = qty * rate;
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        const total = taxableAmount + taxAmount;

        return {
          item_id: item.item_id,
          quantity: qty,
          rate,
          discount_percent: discount,
          discount_amount: discountAmount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total
        };
      });

      await api.createSalesQuotation({
        party_id: quotCustomerId,
        quotation_date: quotDate,
        valid_until: quotValidUntil,
        items,
        remarks: quotRemarks
      });

      toast.success('Sales quotation created successfully!');
      setCreateQuotationOpen(false);
      resetQuotationForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create quotation: ${error.message}`);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderCustomerId || orderItems.length === 0 || !orderDeliveryDate) {
      toast.error('Please fill all required fields and add at least one item');
      return;
    }

    // Validate items
    for (const item of orderItems) {
      if (!item.item_id || !item.quantity || !item.rate) {
        toast.error('All items must have item, quantity, and rate');
        return;
      }
    }

    // Check customer credit limit
    const customer = customers.find(c => c.id === orderCustomerId);
    if (customer && customer.credit_limit) {
      const totalAmount = orderItems.reduce((sum, item) => {
        const qty = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const discount = parseFloat(item.discount || '0');
        const taxRate = parseFloat(item.tax_rate);
        
        const subtotal = qty * rate;
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        return sum + (taxableAmount + taxAmount);
      }, 0);

      // TODO: Check outstanding balance from previous orders
      if (totalAmount > customer.credit_limit) {
        toast.error(`Order amount (₹${totalAmount.toFixed(2)}) exceeds customer credit limit (₹${customer.credit_limit})`);
        return;
      }
    }

    try {
      const items = orderItems.map(item => {
        const qty = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const discount = parseFloat(item.discount || '0');
        const taxRate = parseFloat(item.tax_rate);
        
        const subtotal = qty * rate;
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        const total = taxableAmount + taxAmount;

        return {
          item_id: item.item_id,
          quantity: qty,
          rate,
          discount_percent: discount,
          discount_amount: discountAmount,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: total
        };
      });

      const result = await api.createSalesOrder({
        quotation_id: orderQuotationId && orderQuotationId !== 'none' ? orderQuotationId : null,
        party_id: orderCustomerId,
        order_date: orderDate,
        delivery_date: orderDeliveryDate,
        payment_terms: orderPaymentTerms,
        items,
        remarks: orderRemarks
      });

      // Check if production orders were auto-generated
      const needsProduction = result.items?.some((i: any) => i.needs_production);
      
      if (needsProduction) {
        const itemsNeedingProduction = result.items.filter((i: any) => i.needs_production);
        toast.success(
          `Sales order created! ${itemsNeedingProduction.length} item(s) triggered automatic production orders due to stock shortfall.`,
          { duration: 6000 }
        );
      } else {
        toast.success('Sales order created successfully! All items in stock.');
      }
      
      setCreateOrderOpen(false);
      resetOrderForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create order: ${error.message}`);
    }
  };

  const addQuotationItem = () => {
    setQuotItems([...quotItems, { item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', total_amount: 0 }]);
  };

  const removeQuotationItem = (index: number) => {
    const updated = quotItems.filter((_, i) => i !== index);
    setQuotItems(updated);
  };

  const updateQuotationItem = (index: number, field: string, value: any) => {
    const updated = [...quotItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Calculate total
    if (['quantity', 'rate', 'discount', 'tax_rate'].includes(field)) {
      const item = updated[index];
      if (item.quantity && item.rate) {
        const qty = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const discount = parseFloat(item.discount || '0');
        const taxRate = parseFloat(item.tax_rate);
        
        const subtotal = qty * rate;
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        item.total_amount = taxableAmount + taxAmount;
      }
    }
    
    setQuotItems(updated);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', total_amount: 0 }]);
  };

  const removeOrderItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Calculate total
    if (['quantity', 'rate', 'discount', 'tax_rate'].includes(field)) {
      const item = updated[index];
      if (item.quantity && item.rate) {
        const qty = parseFloat(item.quantity);
        const rate = parseFloat(item.rate);
        const discount = parseFloat(item.discount || '0');
        const taxRate = parseFloat(item.tax_rate);
        
        const subtotal = qty * rate;
        const discountAmount = subtotal * (discount / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (taxRate / 100);
        item.total_amount = taxableAmount + taxAmount;
      }
    }
    
    setOrderItems(updated);
  };

  const handleApproveQuotation = async (id: string) => {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎯 FRONTEND: Starting quotation approval');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Quotation ID:', id);
      console.log('📋 ID Type:', typeof id);
      console.log('📋 ID Value:', JSON.stringify(id));
      console.log('📋 selectedQuotation:', selectedQuotation ? {
        id: selectedQuotation.id,
        quotation_number: selectedQuotation.quotation_number,
        status: selectedQuotation.status
      } : 'None selected');
      
      await api.approveSalesQuotation(id);
      
      console.log('✅ Approval completed successfully');
      toast.success('Sales quotation approved successfully!');
      setViewQuotationOpen(false);
      loadData();
    } catch (error: any) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ FRONTEND: Approval failed');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ Error object:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      toast.error(`Failed to approve quotation: ${error.message}`);
    }
  };

  const handleRejectQuotation = async (id: string) => {
    try {
      await api.rejectSalesQuotation(id);
      toast.success('Sales quotation rejected.');
      setViewQuotationOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(`Failed to reject quotation: ${error.message}`);
    }
  };

  const resetCustomerForm = () => {
    setCustCode('');
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustAddress('');
    setCustGSTIN('');
    setCustCreditLimit('');
    setCustCreditDays('30');
  };

  const resetQuotationForm = () => {
    setQuotCustomerId('');
    setQuotDate(new Date().toISOString().split('T')[0]);
    setQuotValidUntil('');
    setQuotItems([{ item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', total_amount: 0 }]);
    setQuotRemarks('');
  };

  const resetOrderForm = () => {
    setOrderQuotationId('');
    setOrderCustomerId('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setOrderDeliveryDate('');
    setOrderItems([{ item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', total_amount: 0 }]);
    setOrderRemarks('');
    setOrderPaymentTerms('net_30');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'confirmed': return <Badge className="bg-blue-500">Confirmed</Badge>;
      case 'in_progress': return <Badge className="bg-purple-500">In Progress</Badge>;
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'approved': return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.code} - ${item.name}` : 'Unknown Item';
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Management</h1>
          <p className="text-gray-500 mt-1">Manage sales orders, quotations & customer relationships</p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Sales Orders</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="size-5" />
                  Sales Orders ({salesOrders.length})
                </CardTitle>
                <Dialog open={createOrderOpen} onOpenChange={setCreateOrderOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Sales Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Sales Order</DialogTitle>
                      <DialogDescription>
                        Create a sales order to confirm customer purchase
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="order-quotation">From Quotation (Optional)</Label>
                          <Select value={orderQuotationId} onValueChange={setOrderQuotationId}>
                            <SelectTrigger id="order-quotation">
                              <SelectValue placeholder="Select quotation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {salesQuotations.filter(q => q.status === 'approved').map(quot => (
                                <SelectItem key={quot.id} value={quot.id}>
                                  {quot.quotation_number} - {formatCurrency(quot.total_amount)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="order-customer">Customer *</Label>
                          <Select value={orderCustomerId} onValueChange={setOrderCustomerId}>
                            <SelectTrigger id="order-customer">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name} {customer.credit_limit && `(Limit: ${formatCurrency(customer.credit_limit)})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="order-date">Order Date *</Label>
                          <Input
                            id="order-date"
                            type="date"
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="order-delivery">Delivery Date *</Label>
                          <Input
                            id="order-delivery"
                            type="date"
                            value={orderDeliveryDate}
                            onChange={(e) => setOrderDeliveryDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="order-payment">Payment Terms</Label>
                          <Select value={orderPaymentTerms} onValueChange={setOrderPaymentTerms}>
                            <SelectTrigger id="order-payment">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="net_15">Net 15</SelectItem>
                              <SelectItem value="net_30">Net 30</SelectItem>
                              <SelectItem value="net_45">Net 45</SelectItem>
                              <SelectItem value="advance">100% Advance</SelectItem>
                              <SelectItem value="cod">Cash on Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Order Items *</Label>
                          <Button size="sm" variant="outline" onClick={addOrderItem}>
                            <Plus className="size-3 mr-1" />
                            Add Item
                          </Button>
                        </div>

                        <div className="space-y-3 border rounded p-3 max-h-64 overflow-y-auto">
                          {orderItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start border-b pb-3 last:border-b-0 last:pb-0">
                              <div className="col-span-4">
                                <Select 
                                  value={item.item_id} 
                                  onValueChange={(value) => updateOrderItem(index, 'item_id', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Item" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.map(it => (
                                      <SelectItem key={it.id} value={it.id}>
                                        {it.code} - {it.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                                  placeholder="Qty"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(e) => updateOrderItem(index, 'rate', e.target.value)}
                                  placeholder="Rate"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={item.discount}
                                  onChange={(e) => updateOrderItem(index, 'discount', e.target.value)}
                                  placeholder="%"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  value={item.total_amount ? formatCurrency(item.total_amount) : '₹0.00'}
                                  disabled
                                  className="h-9 bg-gray-50"
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeOrderItem(index)}
                                  disabled={orderItems.length === 1}
                                  className="h-9"
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex justify-end">
                          <div className="text-right">
                            <p className="text-sm font-semibold">Total Amount:</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(orderItems.reduce((sum, item) => sum + (item.total_amount || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="order-remarks">Remarks</Label>
                        <Textarea
                          id="order-remarks"
                          value={orderRemarks}
                          onChange={(e) => setOrderRemarks(e.target.value)}
                          placeholder="Enter order notes"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateOrderOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateOrder}>
                        Create Order
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {salesOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No sales orders found</p>
                  <p className="text-sm">Create your first sales order</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{getCustomerName(order.party_id)}</TableCell>
                        <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(order.delivery_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="size-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Sales Quotations ({salesQuotations.length})
                </CardTitle>
                <Dialog open={createQuotationOpen} onOpenChange={setCreateQuotationOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Quotation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Sales Quotation</DialogTitle>
                      <DialogDescription>
                        Create a quotation for customer inquiry
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="quot-customer">Customer *</Label>
                          <Select value={quotCustomerId} onValueChange={setQuotCustomerId}>
                            <SelectTrigger id="quot-customer">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="quot-date">Quotation Date *</Label>
                          <Input
                            id="quot-date"
                            type="date"
                            value={quotDate}
                            onChange={(e) => setQuotDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="quot-valid">Valid Until *</Label>
                        <Input
                          id="quot-valid"
                          type="date"
                          value={quotValidUntil}
                          onChange={(e) => setQuotValidUntil(e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Quotation Items *</Label>
                          <Button size="sm" variant="outline" onClick={addQuotationItem}>
                            <Plus className="size-3 mr-1" />
                            Add Item
                          </Button>
                        </div>

                        <div className="space-y-3 border rounded p-3 max-h-64 overflow-y-auto">
                          {quotItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-start border-b pb-3 last:border-b-0 last:pb-0">
                              <div className="col-span-4">
                                <Select 
                                  value={item.item_id} 
                                  onValueChange={(value) => updateQuotationItem(index, 'item_id', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Item" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.map(it => (
                                      <SelectItem key={it.id} value={it.id}>
                                        {it.code} - {it.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuotationItem(index, 'quantity', e.target.value)}
                                  placeholder="Qty"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.rate}
                                  onChange={(e) => updateQuotationItem(index, 'rate', e.target.value)}
                                  placeholder="Rate"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={item.discount}
                                  onChange={(e) => updateQuotationItem(index, 'discount', e.target.value)}
                                  placeholder="%"
                                  className="h-9"
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  value={item.total_amount ? formatCurrency(item.total_amount) : '₹0.00'}
                                  disabled
                                  className="h-9 bg-gray-50"
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeQuotationItem(index)}
                                  disabled={quotItems.length === 1}
                                  className="h-9"
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 flex justify-end">
                          <div className="text-right">
                            <p className="text-sm font-semibold">Total Amount:</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(quotItems.reduce((sum, item) => sum + (item.total_amount || 0), 0))}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="quot-remarks">Remarks</Label>
                        <Textarea
                          id="quot-remarks"
                          value={quotRemarks}
                          onChange={(e) => setQuotRemarks(e.target.value)}
                          placeholder="Enter quotation notes"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateQuotationOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateQuotation}>
                        Create Quotation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {salesQuotations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No quotations found</p>
                  <p className="text-sm">Create your first sales quotation</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesQuotations.map((quot) => (
                      <TableRow key={quot.id}>
                        <TableCell className="font-medium">{quot.quotation_number}</TableCell>
                        <TableCell>{getCustomerName(quot.party_id)}</TableCell>
                        <TableCell>{new Date(quot.quotation_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(quot.valid_until).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(quot.total_amount)}</TableCell>
                        <TableCell>{getStatusBadge(quot.status)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedQuotation(quot);
                              setViewQuotationOpen(true);
                            }}
                          >
                            <Eye className="size-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5" />
                  Customers ({customers.length})
                </CardTitle>
                <Dialog open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Add Customer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                      <DialogDescription>
                        Register a new customer with credit management
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cust-code">Customer Code *</Label>
                          <Input
                            id="cust-code"
                            value={custCode}
                            onChange={(e) => setCustCode(e.target.value)}
                            placeholder="e.g., CUST001"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cust-name">Customer Name *</Label>
                          <Input
                            id="cust-name"
                            value={custName}
                            onChange={(e) => setCustName(e.target.value)}
                            placeholder="Enter customer name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cust-email">Email</Label>
                          <Input
                            id="cust-email"
                            type="email"
                            value={custEmail}
                            onChange={(e) => setCustEmail(e.target.value)}
                            placeholder="customer@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cust-phone">Phone *</Label>
                          <Input
                            id="cust-phone"
                            value={custPhone}
                            onChange={(e) => setCustPhone(e.target.value)}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cust-address">Address</Label>
                        <Textarea
                          id="cust-address"
                          value={custAddress}
                          onChange={(e) => setCustAddress(e.target.value)}
                          placeholder="Enter customer address"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cust-gstin">GSTIN</Label>
                          <Input
                            id="cust-gstin"
                            value={custGSTIN}
                            onChange={(e) => setCustGSTIN(e.target.value)}
                            placeholder="e.g., 29ABCDE1234F1Z5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cust-credit-days">Credit Days</Label>
                          <Input
                            id="cust-credit-days"
                            type="number"
                            min="0"
                            value={custCreditDays}
                            onChange={(e) => setCustCreditDays(e.target.value)}
                            placeholder="e.g., 30"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cust-credit-limit">Credit Limit (₹)</Label>
                        <Input
                          id="cust-credit-limit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={custCreditLimit}
                          onChange={(e) => setCustCreditLimit(e.target.value)}
                          placeholder="e.g., 100000"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateCustomerOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCustomer}>
                        Add Customer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No customers found</p>
                  <p className="text-sm">Add your first customer</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Credit Limit</TableHead>
                      <TableHead>Credit Days</TableHead>
                      <TableHead>GSTIN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.code}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>
                          {customer.credit_limit ? (
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(customer.credit_limit)}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{customer.credit_days || '-'}</TableCell>
                        <TableCell className="text-xs">{customer.gstin || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Quotation Dialog */}
      <Dialog open={viewQuotationOpen} onOpenChange={setViewQuotationOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
            <DialogDescription>
              View complete quotation information
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-sm text-gray-500">Quotation Number</p>
                  <p className="font-semibold text-lg">{selectedQuotation.quotation_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedQuotation.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{getCustomerName(selectedQuotation.party_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Quotation Date</p>
                  <p className="font-medium">{new Date(selectedQuotation.quotation_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valid Until</p>
                  <p className="font-medium">{new Date(selectedQuotation.valid_until).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium">{selectedQuotation.created_by_name || 'Unknown'}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Quotation Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedQuotation.items?.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{getItemName(item.item_id)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.rate)}</TableCell>
                        <TableCell>{item.discount_percent}%</TableCell>
                        <TableCell>{item.tax_rate}%</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="border-t pt-4 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatCurrency(selectedQuotation.total_amount)}
                  </p>
                </div>
              </div>

              {/* Remarks */}
              {selectedQuotation.remarks && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Remarks</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedQuotation.remarks}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                <p>Created: {new Date(selectedQuotation.created_at).toLocaleString()}</p>
                {selectedQuotation.updated_at && (
                  <p>Last Updated: {new Date(selectedQuotation.updated_at).toLocaleString()}</p>
                )}
                {selectedQuotation.approved_at && (
                  <p className="text-green-600">
                    Approved: {new Date(selectedQuotation.approved_at).toLocaleString()}
                  </p>
                )}
                {selectedQuotation.rejected_at && (
                  <p className="text-red-600">
                    Rejected: {new Date(selectedQuotation.rejected_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedQuotation?.status === 'draft' && (
              <>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => handleRejectQuotation(selectedQuotation.id)}
                >
                  <AlertTriangle className="size-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveQuotation(selectedQuotation.id)}
                >
                  <CheckCircle className="size-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setViewQuotationOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}