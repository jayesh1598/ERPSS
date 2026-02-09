import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Package,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Factory,
  Eye,
  Receipt,
  CreditCard
} from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { PaymentRecorder } from './PaymentRecorder';
import { PaymentHistory } from './PaymentHistory';

export function SalesOrderManagement() {
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewOrderDialog, setViewOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Payment tracking state
  const [paymentRecorderOpen, setPaymentRecorderOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const [orderPayments, setOrderPayments] = useState<Record<string, number>>({});

  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    payment_terms: 'net_30',
    remarks: '',
  });

  const [orderItems, setOrderItems] = useState<any[]>([
    { item_id: '', quantity: '', rate: '', discount: '0', tax_rate: '18', available_stock: 0, shortfall: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersResult, customersResult, itemsResult, inventoryResult] = await Promise.all([
        api.getSalesOrders(),
        api.getParties('customer'),
        api.getItems(),
        api.getInventory(),
      ]);
      
      setSalesOrders(ordersResult.orders || []);
      setCustomers(customersResult.parties || []);
      
      // Filter for finished goods
      const finishedGoods = itemsResult.items?.filter((i: any) => i.type === 'FG') || [];
      console.log('📦 Sales Order - All Items:', itemsResult.items);
      console.log('✅ Sales Order - Finished Goods:', finishedGoods);
      setItems(finishedGoods);
      setInventory(inventoryResult.inventory || []);
      
      if (finishedGoods.length === 0) {
        toast.error('No finished goods found! Please create items with type "Finished Goods" in Master Data.');
      }
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStock = (itemId: string) => {
    const itemInventory = inventory.filter(inv => inv.item_id === itemId);
    return itemInventory.reduce((sum, inv) => sum + (inv.quantity_available || 0), 0);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { 
      item_id: '', 
      quantity: '', 
      rate: '', 
      discount: '0', 
      tax_rate: '18',
      available_stock: 0,
      shortfall: 0 
    }]);
  };

  const removeOrderItem = (index: number) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated.length > 0 ? updated : [{ 
      item_id: '', 
      quantity: '', 
      rate: '', 
      discount: '0', 
      tax_rate: '18',
      available_stock: 0,
      shortfall: 0 
    }]);
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // When item is selected, get available stock
    if (field === 'item_id' && value) {
      const availableStock = getAvailableStock(value);
      updated[index].available_stock = availableStock;
      
      // Get item details for auto-filling rate
      const item = items.find(i => i.id === value);
      if (item && item.selling_price) {
        updated[index].rate = item.selling_price.toString();
      }
    }

    // Calculate shortfall when quantity changes
    if (field === 'quantity' || field === 'item_id') {
      const qty = parseFloat(updated[index].quantity || '0');
      const available = updated[index].available_stock || 0;
      updated[index].shortfall = Math.max(0, qty - available);
    }
    
    setOrderItems(updated);
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
    
    return taxableAmount + taxAmount;
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleCreateOrder = async () => {
    try {
      if (!formData.customer_id || !formData.delivery_date || orderItems.length === 0) {
        toast.error('Please fill all required fields and add at least one item');
        return;
      }

      // Validate items
      for (const item of orderItems) {
        if (!item.item_id || !item.quantity || !item.rate) {
          toast.error('All items must have product, quantity, and rate');
          return;
        }
      }

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
        party_id: formData.customer_id,
        order_date: formData.order_date,
        delivery_date: formData.delivery_date,
        payment_terms: formData.payment_terms,
        items,
        remarks: formData.remarks
      });

      // Check response for production orders
      const needsProduction = result.items?.some((i: any) => i.needs_production);
      
      if (needsProduction) {
        const itemsNeedingProduction = result.items.filter((i: any) => i.needs_production);
        toast.success(
          `✅ Sales Order Created!\n🏭 ${itemsNeedingProduction.length} Production Order(s) auto-generated for stock shortfall`,
          { duration: 8000 }
        );
      } else {
        toast.success('✅ Sales Order Created! All items available in stock.');
      }

      setShowCreateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create order: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      payment_terms: 'net_30',
      remarks: '',
    });
    setOrderItems([{ 
      item_id: '', 
      quantity: '', 
      rate: '', 
      discount: '0', 
      tax_rate: '18',
      available_stock: 0,
      shortfall: 0 
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
      'confirmed': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'in_production': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'ready_to_ship': { bg: 'bg-green-100', text: 'text-green-800' },
      'shipped': { bg: 'bg-teal-100', text: 'text-teal-800' },
      'delivered': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const variant = variants[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return <Badge className={`${variant.bg} ${variant.text}`}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading sales orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="size-8" />
            Sales Order Management
          </h1>
          <p className="text-gray-500 mt-1">Create customer orders with automatic inventory & production integration</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="size-4 mr-2" />
              Create Sales Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Sales Order</DialogTitle>
              <DialogDescription>
                Enter customer and product details. System will auto-check inventory and create production orders if needed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer & Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment_terms">Payment Terms *</Label>
                  <Select
                    value={formData.payment_terms}
                    onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net_15">Net 15 Days</SelectItem>
                      <SelectItem value="net_30">Net 30 Days</SelectItem>
                      <SelectItem value="net_45">Net 45 Days</SelectItem>
                      <SelectItem value="net_60">Net 60 Days</SelectItem>
                      <SelectItem value="cash">Cash on Delivery</SelectItem>
                      <SelectItem value="advance">100% Advance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order_date">Order Date *</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="delivery_date">Expected Delivery Date *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Order Items</Label>
                  <Button onClick={addOrderItem} variant="outline" size="sm">
                    <Plus className="size-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product *</TableHead>
                        <TableHead>Qty *</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Rate (₹) *</TableHead>
                        <TableHead>Discount %</TableHead>
                        <TableHead>GST %</TableHead>
                        <TableHead>Total (₹)</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Select
                              value={item.item_id}
                              onValueChange={(value) => updateOrderItem(index, 'item_id', value)}
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
                              type="number"
                              placeholder="0"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            {item.item_id && (
                              <div className="text-sm">
                                <div className={`font-semibold ${item.shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {item.available_stock}
                                </div>
                                {item.shortfall > 0 && (
                                  <div className="text-xs text-red-600 flex items-center gap-1">
                                    <Factory className="size-3" />
                                    Need: {item.shortfall}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.rate}
                              onChange={(e) => updateOrderItem(index, 'rate', e.target.value)}
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0"
                              value={item.discount}
                              onChange={(e) => updateOrderItem(index, 'discount', e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="18"
                              value={item.tax_rate}
                              onChange={(e) => updateOrderItem(index, 'tax_rate', e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{calculateItemTotal(item).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOrderItem(index)}
                              disabled={orderItems.length === 1}
                            >
                              <Trash2 className="size-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <Card className="w-64">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Order Total:</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ₹{calculateOrderTotal().toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stock Warning */}
                {orderItems.some(item => item.shortfall > 0) && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Factory className="size-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">Production Orders Will Be Auto-Generated</AlertTitle>
                    <AlertDescription className="text-amber-800">
                      Some items have insufficient stock. Production orders will be automatically created when you confirm this sales order.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Remarks */}
              <div>
                <Label htmlFor="remarks">Remarks / Special Instructions</Label>
                <Textarea
                  id="remarks"
                  placeholder="Additional notes or special instructions for this order"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrder}>
                  <CheckCircle className="size-4 mr-2" />
                  Create Order
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{salesOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Confirmed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {salesOrders.filter(o => o.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {salesOrders.filter(o => o.status === 'in_production').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ₹{salesOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sales Orders</CardTitle>
          <CardDescription>Complete list of customer orders with fulfillment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{getCustomerName(order.party_id)}</TableCell>
                  <TableCell>{order.order_date}</TableCell>
                  <TableCell>{order.delivery_date}</TableCell>
                  <TableCell className="font-semibold">
                    ₹{order.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {order.payment_terms?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewOrderDialog(true);
                      }}
                    >
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {salesOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    No sales orders yet. Create your first order to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <TrendingUp className="size-5" />
            Automated Integration Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">📦 When You Create a Sales Order:</h4>
              <ol className="space-y-1 list-decimal list-inside">
                <li>System checks inventory for each product</li>
                <li>If stock available → Order confirmed immediately</li>
                <li>If stock insufficient → Auto-creates Production Order</li>
                <li>Production team receives notification</li>
                <li>Order status updates automatically</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔗 Connected Modules:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Inventory:</strong> Real-time stock checking</li>
                <li><strong>Production:</strong> Auto-generate work orders</li>
                <li><strong>Purchase:</strong> Trigger material procurement</li>
                <li><strong>Quality Control:</strong> QC before dispatch</li>
                <li><strong>Delivery:</strong> Generate challans & e-way bills</li>
                <li><strong>Invoicing:</strong> Create tax invoices with GST</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}