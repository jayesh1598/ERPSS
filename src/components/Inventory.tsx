import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { Package, AlertTriangle, TrendingUp, TrendingDown, ArrowRightLeft, Settings, History, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function Inventory() {
  const [stock, setStock] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [levelsDialogOpen, setLevelsDialogOpen] = useState(false);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);

  // Form states
  const [adjustItem, setAdjustItem] = useState('');
  const [adjustWarehouse, setAdjustWarehouse] = useState('');
  const [adjustType, setAdjustType] = useState('increase');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [adjustBatch, setAdjustBatch] = useState('');

  const [transferItem, setTransferItem] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');
  const [transferBatch, setTransferBatch] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  const [levelsItem, setLevelsItem] = useState('');
  const [levelsWarehouse, setLevelsWarehouse] = useState('');
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stockResult, lowStockResult, itemsResult, warehousesResult, transactionsResult, adjustmentsResult] = await Promise.all([
        api.getStock(),
        api.getLowStock(),
        api.getItems(),
        api.getWarehouses(),
        api.getStockTransactions(),
        api.getStockAdjustments()
      ]);
      
      setStock(stockResult.stock || []);
      setLowStock(lowStockResult.low_stock || []);
      setItems(itemsResult.items || []);
      setWarehouses(warehousesResult.warehouses || []);
      setTransactions(transactionsResult.transactions || []);
      setAdjustments(adjustmentsResult.adjustments || []);
    } catch (error: any) {
      toast.error(`Failed to load inventory data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustItem || !adjustWarehouse || !adjustQuantity || !adjustReason) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.adjustStock({
        item_id: adjustItem,
        warehouse_id: adjustWarehouse,
        batch_number: adjustBatch || null,
        adjustment_quantity: parseFloat(adjustQuantity),
        adjustment_type: adjustType,
        reason: adjustReason,
        remarks: adjustRemarks
      });

      toast.success('Stock adjusted successfully!');
      setAdjustDialogOpen(false);
      resetAdjustForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to adjust stock: ${error.message}`);
    }
  };

  const handleTransferStock = async () => {
    if (!transferItem || !fromWarehouse || !toWarehouse || !transferQuantity) {
      toast.error('Please fill all required fields');
      return;
    }

    if (fromWarehouse === toWarehouse) {
      toast.error('Source and destination warehouses must be different');
      return;
    }

    try {
      await api.transferStock({
        item_id: transferItem,
        from_warehouse_id: fromWarehouse,
        to_warehouse_id: toWarehouse,
        quantity: parseFloat(transferQuantity),
        batch_number: transferBatch || null,
        remarks: transferRemarks
      });

      toast.success('Stock transferred successfully!');
      setTransferDialogOpen(false);
      resetTransferForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to transfer stock: ${error.message}`);
    }
  };

  const handleSetLevels = async () => {
    if (!levelsItem || !levelsWarehouse || !minLevel || !maxLevel || !reorderPoint) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.setStockLevels(levelsItem, levelsWarehouse, {
        min_stock_level: parseFloat(minLevel),
        max_stock_level: parseFloat(maxLevel),
        reorder_point: parseFloat(reorderPoint)
      });

      toast.success('Stock levels set successfully!');
      setLevelsDialogOpen(false);
      resetLevelsForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to set stock levels: ${error.message}`);
    }
  };

  const resetAdjustForm = () => {
    setAdjustItem('');
    setAdjustWarehouse('');
    setAdjustType('increase');
    setAdjustQuantity('');
    setAdjustReason('');
    setAdjustRemarks('');
    setAdjustBatch('');
  };

  const resetTransferForm = () => {
    setTransferItem('');
    setFromWarehouse('');
    setToWarehouse('');
    setTransferQuantity('');
    setTransferBatch('');
    setTransferRemarks('');
  };

  const resetLevelsForm = () => {
    setLevelsItem('');
    setLevelsWarehouse('');
    setMinLevel('');
    setMaxLevel('');
    setReorderPoint('');
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.code} - ${item.name}` : itemId;
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : warehouseId;
  };

  const getStockStatus = (stockItem: any) => {
    if (!stockItem.reorder_point) return null;
    
    if (stockItem.available_quantity <= stockItem.reorder_point) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="size-3" />Low Stock</Badge>;
    }
    if (stockItem.max_stock_level && stockItem.available_quantity >= stockItem.max_stock_level) {
      return <Badge variant="secondary">Overstock</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
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
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-500 mt-1">Multi-warehouse tracking, batch management & stock control</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <TrendingUp className="size-4" />
                Adjust Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stock Adjustment</DialogTitle>
                <DialogDescription>Manually adjust inventory quantities with reason</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item *</Label>
                  <Select value={adjustItem} onValueChange={setAdjustItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={adjustWarehouse} onValueChange={setAdjustWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(wh => (
                          <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number (Optional)</Label>
                    <Input value={adjustBatch} onChange={(e) => setAdjustBatch(e.target.value)} placeholder="BATCH-001" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Adjustment Type *</Label>
                    <Select value={adjustType} onValueChange={setAdjustType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">Increase</SelectItem>
                        <SelectItem value="decrease">Decrease</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input type="number" value={adjustQuantity} onChange={(e) => setAdjustQuantity(e.target.value)} placeholder="0" min="0" step="1" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g., Damaged goods, Found discrepancy" />
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea value={adjustRemarks} onChange={(e) => setAdjustRemarks(e.target.value)} placeholder="Additional details..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdjustStock}>Adjust Stock</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowRightLeft className="size-4" />
                Transfer Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stock Transfer</DialogTitle>
                <DialogDescription>Transfer inventory between warehouses</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Item *</Label>
                  <Select value={transferItem} onValueChange={setTransferItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Warehouse *</Label>
                    <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(wh => (
                          <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Warehouse *</Label>
                    <Select value={toWarehouse} onValueChange={setToWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(wh => (
                          <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input type="number" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} placeholder="0" min="0" step="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number (Optional)</Label>
                    <Input value={transferBatch} onChange={(e) => setTransferBatch(e.target.value)} placeholder="BATCH-001" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea value={transferRemarks} onChange={(e) => setTransferRemarks(e.target.value)} placeholder="Transfer reason..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleTransferStock}>Transfer Stock</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={levelsDialogOpen} onOpenChange={setLevelsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="size-4" />
                Set Levels
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Stock Levels</DialogTitle>
                <DialogDescription>Configure min/max levels and reorder points</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item *</Label>
                    <Select value={levelsItem} onValueChange={setLevelsItem}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.code} - {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={levelsWarehouse} onValueChange={setLevelsWarehouse}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(wh => (
                          <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Minimum Stock Level *</Label>
                  <Input type="number" value={minLevel} onChange={(e) => setMinLevel(e.target.value)} placeholder="0" min="0" step="1" />
                </div>

                <div className="space-y-2">
                  <Label>Maximum Stock Level *</Label>
                  <Input type="number" value={maxLevel} onChange={(e) => setMaxLevel(e.target.value)} placeholder="0" min="0" step="1" />
                </div>

                <div className="space-y-2">
                  <Label>Reorder Point *</Label>
                  <Input type="number" value={reorderPoint} onChange={(e) => setReorderPoint(e.target.value)} placeholder="0" min="0" step="1" />
                  <p className="text-sm text-gray-500">System will alert when stock falls below this level</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLevelsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSetLevels}>Save Levels</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2" onClick={() => setTransactionsDialogOpen(true)}>
            <History className="size-4" />
            History
          </Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {lowStock.length} item(s) are below reorder point and require attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Stock</TabsTrigger>
          <TabsTrigger value="low">Low Stock ({lowStock.length})</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Current Stock ({stock.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{getItemName(s.item_id)}</TableCell>
                      <TableCell>{getWarehouseName(s.warehouse_id)}</TableCell>
                      <TableCell>{s.batch_number || '-'}</TableCell>
                      <TableCell>{s.quantity}</TableCell>
                      <TableCell>{s.reserved_quantity}</TableCell>
                      <TableCell className="font-bold">{s.available_quantity}</TableCell>
                      <TableCell>{s.reorder_point || '-'}</TableCell>
                      <TableCell>{getStockStatus(s)}</TableCell>
                      <TableCell>{new Date(s.last_updated).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {stock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-500">
                        No stock items found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-red-600" />
                Low Stock Items ({lowStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Shortage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{getItemName(s.item_id)}</TableCell>
                      <TableCell>{getWarehouseName(s.warehouse_id)}</TableCell>
                      <TableCell className="text-red-600 font-bold">{s.available_quantity}</TableCell>
                      <TableCell>{s.reorder_point}</TableCell>
                      <TableCell className="text-red-600">{s.reorder_point - s.available_quantity}</TableCell>
                    </TableRow>
                  ))}
                  {lowStock.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No low stock items. All items are at safe levels.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Stock Adjustments History ({adjustments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Old Qty</TableHead>
                    <TableHead>New Qty</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell>{new Date(adj.adjusted_at).toLocaleString()}</TableCell>
                      <TableCell>{getItemName(adj.item_id)}</TableCell>
                      <TableCell>{getWarehouseName(adj.warehouse_id)}</TableCell>
                      <TableCell>
                        <Badge variant={adj.adjustment_type === 'increase' ? 'default' : 'destructive'}>
                          {adj.adjustment_type === 'increase' ? <TrendingUp className="size-3 mr-1" /> : <TrendingDown className="size-3 mr-1" />}
                          {adj.adjustment_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{adj.adjustment_quantity}</TableCell>
                      <TableCell>{adj.old_quantity}</TableCell>
                      <TableCell className="font-bold">{adj.new_quantity}</TableCell>
                      <TableCell className="max-w-xs">{adj.reason}</TableCell>
                    </TableRow>
                  ))}
                  {adjustments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500">
                        No stock adjustments recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transactions History Dialog */}
      <Dialog open={transactionsDialogOpen} onOpenChange={setTransactionsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Transaction History</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 50).map((trans) => (
                <TableRow key={trans.id}>
                  <TableCell>{new Date(trans.transaction_date).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={trans.transaction_type === 'in' ? 'default' : 'secondary'}>
                      {trans.transaction_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getItemName(trans.item_id)}</TableCell>
                  <TableCell>{getWarehouseName(trans.warehouse_id)}</TableCell>
                  <TableCell>{trans.quantity}</TableCell>
                  <TableCell>{trans.reference_type} - {trans.reference_id?.substring(0, 8)}</TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No transactions recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
