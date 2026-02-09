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
import { toast } from 'sonner@2.0.3';
import { Truck, Plus, Eye, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function DeliveryChallan() {
  const [challans, setChallans] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Dialog states
  const [createChallanOpen, setCreateChallanOpen] = useState(false);
  const [viewChallanOpen, setViewChallanOpen] = useState(false);
  const [approveChallanOpen, setApproveChallanOpen] = useState(false);

  const [selectedChallan, setSelectedChallan] = useState<any>(null);
  const [challanItems, setChallanItems] = useState<any[]>([]);

  // Challan form state
  const [challanOrderId, setChallanOrderId] = useState('');
  const [challanCustomerId, setChallanCustomerId] = useState('');
  const [challanWarehouseId, setChallanWarehouseId] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanTransporter, setChallanTransporter] = useState('');
  const [challanVehicleNumber, setChallanVehicleNumber] = useState('');
  const [challanLRNumber, setChallanLRNumber] = useState('');
  const [challanItems_Form, setChallanItems_Form] = useState<any[]>([
    { item_id: '', quantity: '', batch_number: '' }
  ]);
  const [challanRemarks, setChallanRemarks] = useState('');

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
      const [challansResult, ordersResult, customersResult, warehousesResult, itemsResult] = await Promise.all([
        api.getDeliveryChallans(),
        api.getSalesOrders(),
        api.getParties('customer'),
        api.getWarehouses(),
        api.getItems()
      ]);
      
      setChallans(challansResult.challans || []);
      setSalesOrders(ordersResult.orders?.filter((o: any) => o.status === 'confirmed') || []);
      setCustomers(customersResult.parties || []);
      setWarehouses(warehousesResult.warehouses || []);
      setItems(itemsResult.items || []);
    } catch (error: any) {
      toast.error(`Failed to load delivery challans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallan = async () => {
    if (!challanCustomerId || !challanWarehouseId || !challanTransporter || !challanVehicleNumber || challanItems_Form.length === 0) {
      toast.error('Please fill all required fields and add at least one item');
      return;
    }

    // Validate items
    for (const item of challanItems_Form) {
      if (!item.item_id || !item.quantity) {
        toast.error('All items must have item and quantity');
        return;
      }
    }

    try {
      const items = challanItems_Form.map(item => ({
        item_id: item.item_id,
        quantity: parseFloat(item.quantity),
        batch_number: item.batch_number || null
      }));

      await api.createDeliveryChallan({
        order_id: challanOrderId && challanOrderId !== 'none' ? challanOrderId : null, // Handle "none" value
        party_id: challanCustomerId,
        warehouse_id: challanWarehouseId,
        challan_date: challanDate,
        transporter_name: challanTransporter,
        vehicle_number: challanVehicleNumber,
        lr_number: challanLRNumber || null,
        items,
        remarks: challanRemarks
      });

      toast.success('Delivery challan created successfully! Awaiting approval.');
      setCreateChallanOpen(false);
      resetChallanForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create challan: ${error.message}`);
    }
  };

  const handleApproveChallan = async (challanId: string) => {
    try {
      await api.approveDeliveryChallan(challanId);
      toast.success('Delivery challan approved! Stock has been deducted.');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to approve challan: ${error.message}`);
    }
  };

  const addChallanItem = () => {
    setChallanItems_Form([...challanItems_Form, { item_id: '', quantity: '', batch_number: '' }]);
  };

  const removeChallanItem = (index: number) => {
    const updated = challanItems_Form.filter((_, i) => i !== index);
    setChallanItems_Form(updated);
  };

  const updateChallanItem = (index: number, field: string, value: any) => {
    const updated = [...challanItems_Form];
    updated[index] = { ...updated[index], [field]: value };
    setChallanItems_Form(updated);
  };

  const resetChallanForm = () => {
    setChallanOrderId('');
    setChallanCustomerId('');
    setChallanWarehouseId('');
    setChallanDate(new Date().toISOString().split('T')[0]);
    setChallanTransporter('');
    setChallanVehicleNumber('');
    setChallanLRNumber('');
    setChallanItems_Form([{ item_id: '', quantity: '', batch_number: '' }]);
    setChallanRemarks('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval': return <Badge className="bg-yellow-500">Pending Approval</Badge>;
      case 'approved': return <Badge className="bg-green-500">Approved</Badge>;
      case 'in_transit': return <Badge className="bg-blue-500">In Transit</Badge>;
      case 'delivered': return <Badge className="bg-purple-500">Delivered</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
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

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  };

  const canApprove = () => {
    // TODO: Check if user has approval permission
    return true;
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
          <h1 className="text-3xl font-bold">Delivery Challan</h1>
          <p className="text-gray-500 mt-1">Manage delivery challans & dispatch with stock deduction</p>
        </div>
        <Dialog open={createChallanOpen} onOpenChange={setCreateChallanOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Create Challan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Delivery Challan</DialogTitle>
              <DialogDescription>
                Create a delivery challan for outbound shipment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="challan-order">Sales Order (Optional)</Label>
                  <Select value={challanOrderId} onValueChange={setChallanOrderId}>
                    <SelectTrigger id="challan-order">
                      <SelectValue placeholder="Select sales order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem> {/* Changed from empty string to "none" */}
                      {salesOrders.map(order => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number} - {getCustomerName(order.party_id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="challan-customer">Customer *</Label>
                  <Select value={challanCustomerId} onValueChange={setChallanCustomerId}>
                    <SelectTrigger id="challan-customer">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="challan-warehouse">Dispatch From Warehouse *</Label>
                  <Select value={challanWarehouseId} onValueChange={setChallanWarehouseId}>
                    <SelectTrigger id="challan-warehouse">
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="challan-date">Challan Date *</Label>
                  <Input
                    id="challan-date"
                    type="date"
                    value={challanDate}
                    onChange={(e) => setChallanDate(e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Truck className="size-4" />
                <AlertTitle>Transporter Details</AlertTitle>
                <AlertDescription>
                  Required for E-Way Bill generation
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="challan-transporter">Transporter Name *</Label>
                  <Input
                    id="challan-transporter"
                    value={challanTransporter}
                    onChange={(e) => setChallanTransporter(e.target.value)}
                    placeholder="Enter transporter name"
                  />
                </div>

                <div>
                  <Label htmlFor="challan-vehicle">Vehicle Number *</Label>
                  <Input
                    id="challan-vehicle"
                    value={challanVehicleNumber}
                    onChange={(e) => setChallanVehicleNumber(e.target.value)}
                    placeholder="e.g., KA01AB1234"
                  />
                </div>

                <div>
                  <Label htmlFor="challan-lr">LR/Consignment Number</Label>
                  <Input
                    id="challan-lr"
                    value={challanLRNumber}
                    onChange={(e) => setChallanLRNumber(e.target.value)}
                    placeholder="Enter LR number"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Dispatch Items *</Label>
                  <Button size="sm" variant="outline" onClick={addChallanItem}>
                    <Plus className="size-3 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3 border rounded p-3">
                  {challanItems_Form.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start border-b pb-3 last:border-b-0 last:pb-0">
                      <div className="flex-1">
                        <Select 
                          value={item.item_id} 
                          onValueChange={(value) => updateChallanItem(index, 'item_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.filter(i => i.type === 'finished_good').map(it => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.code} - {it.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateChallanItem(index, 'quantity', e.target.value)}
                          placeholder="Quantity"
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          value={item.batch_number}
                          onChange={(e) => updateChallanItem(index, 'batch_number', e.target.value)}
                          placeholder="Batch (opt)"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeChallanItem(index)}
                        disabled={challanItems_Form.length === 1}
                      >
                        <XCircle className="size-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="challan-remarks">Remarks</Label>
                <Textarea
                  id="challan-remarks"
                  value={challanRemarks}
                  onChange={(e) => setChallanRemarks(e.target.value)}
                  placeholder="Enter delivery notes"
                  rows={2}
                />
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="size-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Approval Required</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Challan will require admin approval before stock deduction and dispatch.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateChallanOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChallan}>
                Create Challan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="size-5" />
            Delivery Challans ({challans.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {challans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="size-12 mx-auto mb-4 opacity-20" />
              <p>No delivery challans found</p>
              <p className="text-sm">Create your first delivery challan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Transporter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challans.map((challan) => (
                  <TableRow key={challan.id}>
                    <TableCell className="font-medium">{challan.challan_number}</TableCell>
                    <TableCell>{getCustomerName(challan.party_id)}</TableCell>
                    <TableCell>{getWarehouseName(challan.warehouse_id)}</TableCell>
                    <TableCell>{new Date(challan.challan_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-sm">{challan.vehicle_number}</TableCell>
                    <TableCell>{challan.transporter_name}</TableCell>
                    <TableCell>{getStatusBadge(challan.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="size-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Delivery Challan: {challan.challan_number}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-semibold">Customer</Label>
                                  <p>{getCustomerName(challan.party_id)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Warehouse</Label>
                                  <p>{getWarehouseName(challan.warehouse_id)}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Date</Label>
                                  <p>{new Date(challan.challan_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-semibold">Status</Label>
                                  <p>{getStatusBadge(challan.status)}</p>
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <Label className="text-sm font-semibold mb-2 block">Transport Details</Label>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
                                  <div>
                                    <p className="text-xs text-gray-500">Transporter</p>
                                    <p className="font-medium">{challan.transporter_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Vehicle Number</p>
                                    <p className="font-medium font-mono">{challan.vehicle_number}</p>
                                  </div>
                                  {challan.lr_number && (
                                    <div>
                                      <p className="text-xs text-gray-500">LR Number</p>
                                      <p className="font-medium">{challan.lr_number}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {challan.remarks && (
                                <div>
                                  <Label className="text-sm font-semibold">Remarks</Label>
                                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{challan.remarks}</p>
                                </div>
                              )}

                              {challan.approved_at && (
                                <Alert className="bg-green-50 border-green-200">
                                  <CheckCircle className="size-4 text-green-600" />
                                  <AlertTitle className="text-green-800">Approved</AlertTitle>
                                  <AlertDescription className="text-green-700">
                                    Approved on {new Date(challan.approved_at).toLocaleString()}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {challan.status === 'pending_approval' && canApprove() && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleApproveChallan(challan.id)}
                          >
                            <CheckCircle className="size-3 mr-1" />
                            Approve
                          </Button>
                        )}

                        {challan.status === 'approved' && (
                          <Button size="sm" variant="outline" disabled>
                            <FileText className="size-3 mr-1" />
                            E-Way Bill
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}