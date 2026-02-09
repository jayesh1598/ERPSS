import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  Package, 
  PackageCheck, 
  Search, 
  Filter,
  Warehouse,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Factory,
  Eye,
  Download,
  FileText
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function FinishedGoods() {
  const [loading, setLoading] = useState(true);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState<any[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalValue: 0,
    totalQuantity: 0,
    uniqueItems: 0,
    lowStock: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryResult, itemsResult, warehousesResult, workOrdersResult] = await Promise.all([
        api.getInventory(),
        api.getItems(),
        api.getWarehouses(),
        api.getWorkOrders(),
      ]);

      const allInventory = inventoryResult.inventory || [];
      const allItems = itemsResult.items || [];
      const fgItems = allItems.filter((item: any) => item.type === 'FG');
      
      // Filter inventory for finished goods only
      const fgInventory = allInventory.filter((inv: any) => {
        const item = allItems.find((i: any) => i.id === inv.item_id);
        return item?.type === 'FG';
      });

      setFinishedGoods(fgInventory);
      setItems(fgItems);
      setWarehouses(warehousesResult.warehouses || []);
      setWorkOrders(workOrdersResult.workOrders || []);

      // Calculate statistics
      const totalValue = fgInventory.reduce((sum: number, inv: any) => {
        const item = allItems.find((i: any) => i.id === inv.item_id);
        return sum + (inv.quantity * (item?.standard_cost || 0));
      }, 0);

      const totalQuantity = fgInventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0);

      const uniqueItems = new Set(fgInventory.map((inv: any) => inv.item_id)).size;

      const lowStock = fgInventory.filter((inv: any) => {
        const item = allItems.find((i: any) => i.id === inv.item_id);
        return item && inv.quantity < (item.min_stock_level || 0);
      }).length;

      setStats({
        totalValue,
        totalQuantity,
        uniqueItems,
        lowStock,
      });

    } catch (error: any) {
      toast.error(`Failed to load finished goods: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (inventory: any) => {
    const item = items.find((i: any) => i.id === inventory.item_id);
    setSelectedItem({ ...inventory, itemDetails: item });
    
    // Load stock movements for this item
    try {
      const movements = workOrders.filter((wo: any) => 
        wo.bom_id && wo.status === 'completed'
      );
      setStockMovements(movements);
    } catch (error) {
      console.error('Failed to load movements:', error);
    }
    
    setViewDetailsOpen(true);
  };

  const filteredInventory = finishedGoods.filter((inv: any) => {
    const item = items.find((i: any) => i.id === inv.item_id);
    const warehouse = warehouses.find((w: any) => w.id === inv.warehouse_id);
    
    const matchesSearch = !searchTerm || 
      item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.batch_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWarehouse = selectedWarehouse === 'all' || inv.warehouse_id === selectedWarehouse;
    
    return matchesSearch && matchesWarehouse;
  });

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStockStatus = (inventory: any, item: any) => {
    if (!item) return { label: 'Unknown', color: 'gray' };
    
    if (inventory.quantity === 0) {
      return { label: 'Out of Stock', color: 'red' };
    } else if (inventory.quantity < (item.min_stock_level || 0)) {
      return { label: 'Low Stock', color: 'yellow' };
    } else if (inventory.quantity > (item.max_stock_level || Infinity)) {
      return { label: 'Overstock', color: 'purple' };
    } else {
      return { label: 'In Stock', color: 'green' };
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PackageCheck className="size-8 text-green-600" />
            Finished Goods Inventory
          </h1>
          <p className="text-gray-500 mt-1">Track and manage completed products ready for sale</p>
        </div>
        <Badge className="bg-green-500 text-white text-lg px-4 py-2">
          Step 11: Finished Goods
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-gray-500 mt-1">Total inventory worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
            <Package className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
            <Factory className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.uniqueItems}</div>
            <p className="text-xs text-gray-500 mt-1">Different FG items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.lowStock}
            </div>
            <p className="text-xs text-gray-500 mt-1">Items below minimum</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for low stock */}
      {stats.lowStock > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="size-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Low Stock Alert</AlertTitle>
          <AlertDescription className="text-yellow-800">
            {stats.lowStock} finished goods item(s) are below minimum stock level. Consider creating new work orders.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search by item name, code, or batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((wh: any) => (
                    <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Finished Goods Stock ({filteredInventory.length})</span>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <PackageCheck className="size-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No Finished Goods Found</p>
              <p className="text-sm mt-1">
                {searchTerm || selectedWarehouse !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Complete production work orders to see finished goods here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>UoM</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((inv: any) => {
                    const item = items.find((i: any) => i.id === inv.item_id);
                    const warehouse = warehouses.find((w: any) => w.id === inv.warehouse_id);
                    const status = getStockStatus(inv, item);
                    const totalValue = inv.quantity * (item?.standard_cost || 0);

                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{item?.code || 'N/A'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold">{item?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{item?.description || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {inv.batch_number || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Warehouse className="size-4 text-gray-400" />
                            {warehouse?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {inv.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell>{item?.uom || 'PCS'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item?.standard_cost || 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(totalValue)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              status.color === 'green' ? 'bg-green-500' :
                              status.color === 'yellow' ? 'bg-yellow-500' :
                              status.color === 'red' ? 'bg-red-500' :
                              status.color === 'purple' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(inv)}
                          >
                            <Eye className="size-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finished Goods Details</DialogTitle>
            <DialogDescription>
              Complete information about this inventory item
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              {/* Item Information */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Item Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Item Code</p>
                    <p className="font-semibold">{selectedItem.itemDetails?.code}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Item Name</p>
                    <p className="font-semibold">{selectedItem.itemDetails?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Category</p>
                    <p className="font-semibold">{selectedItem.itemDetails?.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">UoM</p>
                    <p className="font-semibold">{selectedItem.itemDetails?.uom}</p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Stock Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Current Quantity</p>
                    <p className="font-semibold text-lg">{selectedItem.quantity} {selectedItem.itemDetails?.uom}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Batch Number</p>
                    <p className="font-semibold">{selectedItem.batch_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Warehouse</p>
                    <p className="font-semibold">
                      {warehouses.find((w: any) => w.id === selectedItem.warehouse_id)?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Value</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(selectedItem.quantity * (selectedItem.itemDetails?.standard_cost || 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Levels */}
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3">Stock Levels</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Minimum Level</p>
                    <p className="font-semibold">{selectedItem.itemDetails?.min_stock_level || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Reorder Level</p>
                    <p className="font-semibold">{selectedItem.itemDetails?.reorder_level || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Maximum Level</p>
                    <p className="font-semibold">{selectedItem.itemDetails?.max_stock_level || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
