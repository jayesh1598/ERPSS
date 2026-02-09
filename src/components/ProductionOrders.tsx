import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Plus, Edit, CheckCircle, XCircle, Package2, AlertTriangle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface MaterialConsumption {
  material_id: string;
  material_name: string;
  planned_quantity: number;
  actual_quantity: number;
  waste_quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  waste_cost: number;
}

interface ProductionOrder {
  id: string;
  order_number: string;
  product_id: string;
  product_name: string;
  bom_id: string;
  quantity_planned: number;
  quantity_produced: number;
  quantity_rejected: number;
  material_consumption: MaterialConsumption[];
  total_material_cost: number;
  total_waste_cost: number;
  cost_per_unit: number;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export function ProductionOrders() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [boms, setBOMs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [consumptionDialogOpen, setConsumptionDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bom_id: '',
    quantity_planned: '',
    notes: '',
  });

  // Material consumption tracking
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchBOMs();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/production-orders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch production orders');
      const data = await response.json();
      setOrders(data);
    } catch (error: any) {
      console.error('Error fetching production orders:', error);
      toast.error('Failed to load production orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBOMs = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/bom`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch BOMs');
      const data = await response.json();
      setBOMs(data.filter((b: any) => b.status === 'active'));
    } catch (error: any) {
      console.error('Error fetching BOMs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bom_id || !formData.quantity_planned) {
      toast.error('Please fill all required fields');
      return;
    }

    const selectedBOM = boms.find(b => b.id === formData.bom_id);
    if (!selectedBOM) return;

    const orderData = {
      bom_id: formData.bom_id,
      product_id: selectedBOM.product_id,
      product_name: selectedBOM.product_name,
      quantity_planned: parseInt(formData.quantity_planned),
      notes: formData.notes,
    };

    try {
      const accessToken = localStorage.getItem('access_token');
      const url = editingOrder
        ? `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/production-orders/${editingOrder.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/production-orders`;

      const response = await fetch(url, {
        method: editingOrder ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save production order');
      }

      toast.success(editingOrder ? 'Order updated' : 'Production order created');
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error: any) {
      console.error('Error saving production order:', error);
      toast.error('Failed to save order: ' + error.message);
    }
  };

  const startProduction = async (order: ProductionOrder) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/production-orders/${order.id}/start`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to start production');
      toast.success('Production started');
      fetchOrders();
    } catch (error: any) {
      console.error('Error starting production:', error);
      toast.error('Failed to start production: ' + error.message);
    }
  };

  const openConsumptionDialog = (order: ProductionOrder) => {
    setSelectedOrder(order);
    
    // Initialize consumption data from BOM
    const bom = boms.find(b => b.id === order.bom_id);
    if (bom) {
      const initialConsumptions = bom.bom_items.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material_name,
        planned_quantity: item.quantity * order.quantity_planned,
        actual_quantity: item.quantity * order.quantity_planned,
        waste_quantity: 0,
        unit: item.unit,
        cost_per_unit: item.cost_per_unit,
        total_cost: 0,
        waste_cost: 0,
      }));
      setConsumptions(initialConsumptions);
    }
    
    setConsumptionDialogOpen(true);
  };

  const updateConsumption = (index: number, field: string, value: string) => {
    const updated = [...consumptions];
    const item = updated[index];
    
    if (field === 'actual_quantity') {
      item.actual_quantity = parseFloat(value) || 0;
    } else if (field === 'waste_quantity') {
      item.waste_quantity = parseFloat(value) || 0;
    }
    
    item.total_cost = item.actual_quantity * item.cost_per_unit;
    item.waste_cost = item.waste_quantity * item.cost_per_unit;
    
    setConsumptions(updated);
  };

  const completeProduction = async () => {
    if (!selectedOrder) return;

    const totalMaterialCost = consumptions.reduce((sum, c) => sum + c.total_cost, 0);
    const totalWasteCost = consumptions.reduce((sum, c) => sum + c.waste_cost, 0);
    const quantityProduced = selectedOrder.quantity_planned; // Can be edited

    const completionData = {
      material_consumption: consumptions,
      total_material_cost: totalMaterialCost,
      total_waste_cost: totalWasteCost,
      cost_per_unit: quantityProduced > 0 ? (totalMaterialCost + totalWasteCost) / quantityProduced : 0,
      quantity_produced: quantityProduced,
      quantity_rejected: 0,
    };

    try {
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/production-orders/${selectedOrder.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(completionData),
        }
      );

      if (!response.ok) throw new Error('Failed to complete production');
      toast.success('Production completed successfully');
      setConsumptionDialogOpen(false);
      setSelectedOrder(null);
      setConsumptions([]);
      fetchOrders();
    } catch (error: any) {
      console.error('Error completing production:', error);
      toast.error('Failed to complete production: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ bom_id: '', quantity_planned: '', notes: '' });
    setEditingOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const totalCost = consumptions.reduce((sum, c) => sum + c.total_cost + c.waste_cost, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Orders</h1>
          <p className="text-gray-600 mt-1">Track material consumption and production costs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Production Order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Production Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Select BOM (Product) *</Label>
                <Select
                  value={formData.bom_id}
                  onValueChange={(value) => setFormData({ ...formData, bom_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose product" />
                  </SelectTrigger>
                  <SelectContent>
                    {boms.map((bom) => (
                      <SelectItem key={bom.id} value={bom.id}>
                        {bom.product_name} (₹{bom.final_cost_per_unit.toFixed(2)}/unit)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity to Produce *</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={formData.quantity_planned}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity_planned: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Order</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Material Consumption Dialog */}
      <Dialog open={consumptionDialogOpen} onOpenChange={setConsumptionDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Material Consumption - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm">
                <strong>Product:</strong> {selectedOrder?.product_name}
              </p>
              <p className="text-sm">
                <strong>Planned Quantity:</strong> {selectedOrder?.quantity_planned} units
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Planned Qty</TableHead>
                  <TableHead className="text-right">Actual Used</TableHead>
                  <TableHead className="text-right">Waste/Scrap</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost/Unit</TableHead>
                  <TableHead className="text-right">Material Cost</TableHead>
                  <TableHead className="text-right">Waste Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptions.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.material_name}</TableCell>
                    <TableCell className="text-right">{item.planned_quantity}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="text-right"
                        value={item.actual_quantity}
                        onChange={(e) =>
                          updateConsumption(index, 'actual_quantity', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="text-right"
                        value={item.waste_quantity}
                        onChange={(e) =>
                          updateConsumption(index, 'waste_quantity', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">₹{item.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{item.total_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600">
                      ₹{item.waste_cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Total Material Cost:</span>
                <span className="font-semibold">
                  ₹{consumptions.reduce((sum, c) => sum + c.total_cost, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Waste Cost:</span>
                <span className="font-semibold text-red-600">
                  ₹{consumptions.reduce((sum, c) => sum + c.waste_cost, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total Production Cost:</span>
                <span className="text-green-600">₹{totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost Per Unit:</span>
                <span className="font-semibold">
                  ₹{selectedOrder ? (totalCost / selectedOrder.quantity_planned).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConsumptionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={completeProduction}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Production
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Orders List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              <Package2 className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No production orders yet</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{order.order_number}</h3>
                    <p className="text-sm text-gray-600">{order.product_name}</p>
                    <Badge className={`mt-2 ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {order.status === 'completed' && (
                      <>
                        <div className="text-2xl font-bold text-green-600">
                          ₹{order.cost_per_unit.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-600">per unit</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Planned</p>
                    <p className="font-semibold">{order.quantity_planned} units</p>
                  </div>
                  {order.status === 'completed' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Produced</p>
                        <p className="font-semibold text-green-600">
                          {order.quantity_produced} units
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Material Cost</p>
                        <p className="font-semibold">₹{order.total_material_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Waste Cost</p>
                        <p className="font-semibold text-red-600">
                          ₹{order.total_waste_cost.toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {order.notes && (
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Notes:</strong> {order.notes}
                  </p>
                )}

                <div className="flex gap-2">
                  {order.status === 'draft' && (
                    <Button size="sm" onClick={() => startProduction(order)}>
                      Start Production
                    </Button>
                  )}
                  {order.status === 'in_progress' && (
                    <Button size="sm" onClick={() => openConsumptionDialog(order)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Record Consumption & Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
