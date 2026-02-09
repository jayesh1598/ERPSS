import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { Package, Plus, Trash2, AlertTriangle, ShoppingCart, CheckCircle, XCircle } from 'lucide-react';
import { api, getAccessToken } from '../lib/api'; // Import getAccessToken helper

interface MaterialIssueProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  bom: any;
  items: any[];
  stock: any[];
  onIssued: () => void;
}

export function MaterialIssue({ isOpen, onClose, workOrder, bom, items, stock, onIssued }: MaterialIssueProps) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [showPRDialog, setShowPRDialog] = useState(false);
  const [prReason, setPRReason] = useState('');
  const [bomComponents, setBOMComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load BOM components when dialog opens
  useEffect(() => {
    if (isOpen && bom?.id) {
      loadBOMComponents();
    }
  }, [isOpen, bom?.id]);

  const loadBOMComponents = async () => {
    try {
      setLoading(true);
      const result = await api.getBOMComponents(bom.id);
      setBOMComponents(result.components || []);
    } catch (error: any) {
      console.error('Failed to load BOM components:', error);
      toast.error('Failed to load BOM components');
      setBOMComponents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bom && bomComponents.length > 0) {
      // Pre-populate materials from BOM components
      const bomMaterials = bomComponents.map((comp: any) => {
        const requiredQty = comp.quantity * workOrder.quantity;
        const availableStock = getAvailableStock(comp.item_id);
        const item = items.find((i) => i.id === comp.item_id);
        
        return {
          item_id: comp.item_id,
          quantity: requiredQty.toString(),
          batch_number: '',
          available_stock: availableStock,
          uom: comp.uom,
          item_name: item?.name || 'Unknown',
          item_code: item?.code || '',
          min_stock: item?.min_stock_level || 0,
          isLowStock: availableStock < requiredQty,
          shortage: Math.max(0, requiredQty - availableStock)
        };
      });
      
      setMaterials(bomMaterials);
      
      // Identify low stock items
      const lowStock = bomMaterials.filter((m: any) => m.isLowStock);
      setLowStockItems(lowStock);
      
      if (lowStock.length > 0) {
        toast.warning(`⚠️ ${lowStock.length} material(s) have insufficient stock!`, {
          duration: 5000,
        });
      }
    }
  }, [isOpen, bom, bomComponents, workOrder]);

  const getAvailableStock = (itemId: string) => {
    const itemStock = stock.filter((s: any) => s.item_id === itemId && s.warehouse_id === workOrder.warehouse_id);
    return itemStock.reduce((sum, s) => sum + (s.quantity || 0), 0);
  };

  const getItemName = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    return item ? `${item.code} - ${item.name}` : 'Unknown';
  };

  const addMaterial = () => {
    setMaterials([...materials, { 
      item_id: '', 
      quantity: '', 
      batch_number: '', 
      available_stock: 0, 
      uom: '',
      isLowStock: false,
      shortage: 0
    }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: string, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'item_id') {
      const availStock = getAvailableStock(value);
      updated[index].available_stock = availStock;
      const item = items.find((i) => i.id === value);
      if (item) {
        updated[index].uom = item.uom;
        updated[index].item_name = item.name;
        updated[index].item_code = item.code;
        updated[index].min_stock = item.min_stock_level || 0;
      }
    }
    
    // Check if low stock after quantity or item change
    if (field === 'quantity' || field === 'item_id') {
      const reqQty = parseFloat(updated[index].quantity || 0);
      const availStock = updated[index].available_stock;
      updated[index].isLowStock = availStock < reqQty;
      updated[index].shortage = Math.max(0, reqQty - availStock);
    }
    
    setMaterials(updated);
    
    // Update low stock list
    const lowStock = updated.filter((m: any) => m.isLowStock && m.item_id);
    setLowStockItems(lowStock);
  };

  const handleRaisePurchaseRequisition = async () => {
    if (!prReason.trim()) {
      toast.error('Please provide a reason for the purchase requisition');
      return;
    }

    try {
      setSubmitting(true);
      
      // Create PR items for low stock materials
      const prItems = lowStockItems.map((material: any) => ({
        item_id: material.item_id,
        quantity: material.shortage,
        uom: material.uom,
        reason: `Production WO: ${workOrder.wo_number} - Insufficient stock (Required: ${material.quantity}, Available: ${material.available_stock})`
      }));

      const prData = {
        requisition_date: new Date().toISOString().split('T')[0],
        required_by_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        priority: 'high',
        purpose: `${prReason} - WO: ${workOrder.wo_number}`,
        items: prItems
      };

      const result = await api.createPurchaseRequisition(prData);
      
      toast.success(`✅ Purchase Requisition ${result.requisition.pr_number} created for ${lowStockItems.length} item(s)`);
      setPRReason('');
      setShowPRDialog(false);
      
    } catch (error: any) {
      toast.error(`Failed to create purchase requisition: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueMaterials = async () => {
    // Check for materials with insufficient stock
    const insufficientStock = materials.filter((m: any) => 
      m.item_id && parseFloat(m.quantity || 0) > m.available_stock
    );

    if (insufficientStock.length > 0) {
      toast.error(`Cannot issue materials: ${insufficientStock.length} item(s) have insufficient stock. Please raise a purchase requisition first.`);
      return;
    }

    // Validation
    for (const material of materials) {
      if (!material.item_id || !material.quantity) {
        toast.error('All materials must have item and quantity');
        return;
      }
    }

    try {
      setSubmitting(true);

      const materialsToIssue = materials.map((m) => ({
        item_id: m.item_id,
        quantity: parseFloat(m.quantity),
        batch_number: m.batch_number,
      }));

      // Get the access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please log in again to continue');
      }

      const response = await fetch(
        `https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/work-orders/${workOrder.id}/issue-materials`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ materials: materialsToIssue }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to issue materials');
      }

      toast.success('✅ Materials issued successfully! Work order status updated to "In Progress"');
      onIssued();
      onClose();
    } catch (error: any) {
      console.error('Material issue error:', error);
      toast.error(error.message || 'Failed to issue materials');
    } finally {
      setSubmitting(false);
    }
  };

  const hasInsufficientStock = materials.some((m: any) => m.isLowStock && m.item_id);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5 text-blue-600" />
              Issue Materials for Production - WO: {workOrder?.wo_number}
            </DialogTitle>
            <DialogDescription>
              Step 8: Issue raw materials from inventory to start production
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
              <span className="ml-3 text-gray-600">Loading BOM components...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Work Order Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Finished Item</p>
                  <p className="font-semibold">{workOrder && getItemName(workOrder.finished_item_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Production Quantity</p>
                  <p className="font-semibold text-lg">{workOrder?.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Warehouse</p>
                  <p className="font-semibold">{workOrder?.warehouse_id}</p>
                </div>
              </div>

              {/* Low Stock Alert */}
              {lowStockItems.length > 0 && (
                <Alert className="bg-red-50 border-red-300">
                  <AlertTriangle className="size-5 text-red-600" />
                  <AlertTitle className="text-red-900 font-bold">
                    ⚠️ Insufficient Raw Material Stock
                  </AlertTitle>
                  <AlertDescription className="text-red-800">
                    <p className="mb-2">
                      <strong>{lowStockItems.length} material(s)</strong> do not have sufficient stock for this work order.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {lowStockItems.map((item: any, idx: number) => (
                        <li key={idx}>
                          <strong>{item.item_code} - {item.item_name}</strong>: 
                          Required: <span className="font-semibold">{item.quantity}</span>, 
                          Available: <span className="font-semibold text-red-600">{item.available_stock}</span>, 
                          Shortage: <span className="font-semibold text-red-600">{item.shortage}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowPRDialog(true)}
                    >
                      <ShoppingCart className="size-4 mr-2" />
                      Raise Purchase Requisition to Purchase Department
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Materials Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-lg font-semibold">Materials to Issue from Inventory</Label>
                  <Button onClick={addMaterial} variant="outline" size="sm">
                    <Plus className="size-4 mr-1" />
                    Add Material
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Raw Material</TableHead>
                        <TableHead>Required Qty</TableHead>
                        <TableHead>Available Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>UOM</TableHead>
                        <TableHead>Batch No.</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material, index) => (
                        <TableRow 
                          key={index}
                          className={material.isLowStock ? 'bg-red-50' : ''}
                        >
                          <TableCell>
                            <Select
                              value={material.item_id}
                              onValueChange={(value) => updateMaterial(index, 'item_id', value)}
                            >
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select Raw Material (RM)" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.filter((i) => i.type === 'RM').map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.code} - {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={material.quantity}
                              onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold text-lg ${
                                material.isLowStock
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {material.available_stock}
                            </span>
                            {material.shortage > 0 && (
                              <p className="text-xs text-red-600 font-semibold mt-1">
                                Short by: {material.shortage}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {material.item_id && (
                              material.isLowStock ? (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="size-3" />
                                  Insufficient
                                </Badge>
                              ) : (
                                <Badge className="bg-green-500 gap-1">
                                  <CheckCircle className="size-3" />
                                  Available
                                </Badge>
                              )
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{material.uom}</TableCell>
                          <TableCell>
                            <Input
                              value={material.batch_number}
                              onChange={(e) => updateMaterial(index, 'batch_number', e.target.value)}
                              placeholder="Optional"
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMaterial(index)}
                              disabled={materials.length === 1}
                            >
                              <Trash2 className="size-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  💡 <strong>Tip:</strong> Materials are auto-populated from the Bill of Materials (BOM). 
                  Only Raw Materials (RM) can be issued for production.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleIssueMaterials} 
              disabled={submitting || hasInsufficientStock}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Issuing...' : 'Issue Materials & Start Production'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase Requisition Dialog */}
      <Dialog open={showPRDialog} onOpenChange={setShowPRDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-orange-600" />
              Raise Purchase Requisition
            </DialogTitle>
            <DialogDescription>
              Send request to Purchase Department to procure insufficient raw materials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Items to Purchase */}
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">Materials to Purchase:</h3>
              <div className="space-y-2">
                {lowStockItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.item_code} - {item.item_name}</span>
                    <span className="text-orange-700 font-semibold">
                      Qty: {item.shortage} {item.uom}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Purpose/Reason */}
            <div>
              <Label>Purpose / Reason for Purchase *</Label>
              <Textarea
                value={prReason}
                onChange={(e) => setPRReason(e.target.value)}
                placeholder="e.g., Urgent requirement for production work order WO-2026-001"
                rows={4}
              />
            </div>

            <Alert>
              <AlertTriangle className="size-4 text-blue-600" />
              <AlertDescription>
                This will create a <strong>High Priority</strong> Purchase Requisition and notify the Purchase Department.
                Required by date will be set to 7 days from today.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPRDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleRaisePurchaseRequisition}
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? 'Creating PR...' : 'Create Purchase Requisition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}