import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { Plus, Edit, Trash2, Package, Calculator, FileText } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAccessToken } from '../lib/api'; // ADDED: Import getAccessToken helper

interface BOMItem {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  scrap_percentage: number;
}

interface BOM {
  id: string;
  product_id: string;
  product_name: string;
  bom_items: BOMItem[];
  total_material_cost: number;
  total_scrap_cost: number;
  final_cost_per_unit: number;
  created_at: string;
  created_by: string;
  status: 'active' | 'inactive' | 'draft';
}

export function BillOfMaterials() {
  const [boms, setBOMs] = useState<BOM[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [bomItems, setBOMItems] = useState<BOMItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    material_id: '',
    quantity: '',
    scrap_percentage: '5',
  });

  useEffect(() => {
    fetchBOMs();
    fetchProducts();
    fetchMaterials();
  }, []);

  const fetchBOMs = async () => {
    setLoading(true);
    try {
      const accessToken = await getAccessToken(); // ADDED: Use getAccessToken helper
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
      setBOMs(data);
    } catch (error: any) {
      console.error('Error fetching BOMs:', error);
      toast.error('Failed to load BOMs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const accessToken = await getAccessToken(); // ADDED: Use getAccessToken helper
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/items`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      console.log('📦 BOM - All Items from API:', data.items);
      
      // Filter for only Finished Goods (FG) items
      const finishedGoods = data.items?.filter((item: any) => item.type === 'FG') || [];
      console.log('✅ BOM - Filtered FG Items:', finishedGoods);
      console.log('🔢 BOM - FG Items Count:', finishedGoods.length);
      
      setProducts(finishedGoods);
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      toast.error('Failed to fetch products: ' + error.message);
    }
  };

  const fetchMaterials = async () => {
    try {
      const accessToken = await getAccessToken(); // ADDED: Use getAccessToken helper
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/materials`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();
      setMaterials(data);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
    }
  };

  const addBOMItem = () => {
    if (!currentItem.material_id || !currentItem.quantity) {
      toast.error('Please select material and enter quantity');
      return;
    }

    const material = materials.find(m => m.id === currentItem.material_id);
    if (!material) return;

    const quantity = parseFloat(currentItem.quantity);
    const scrapPercentage = parseFloat(currentItem.scrap_percentage);
    const costPerUnit = material.cost || 0;
    const totalCost = quantity * costPerUnit;

    const newItem: BOMItem = {
      material_id: material.id,
      material_name: material.name,
      quantity,
      unit: material.unit || 'PCS',
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
      scrap_percentage: scrapPercentage,
    };

    setBOMItems([...bomItems, newItem]);
    setCurrentItem({ material_id: '', quantity: '', scrap_percentage: '5' });
    toast.success('Material added to BOM');
  };

  const removeBOMItem = (index: number) => {
    const updated = bomItems.filter((_, i) => i !== index);
    setBOMItems(updated);
  };

  const calculateCosts = () => {
    const totalMaterialCost = bomItems.reduce((sum, item) => sum + item.total_cost, 0);
    const totalScrapCost = bomItems.reduce(
      (sum, item) => sum + (item.total_cost * item.scrap_percentage / 100),
      0
    );
    const finalCost = totalMaterialCost + totalScrapCost;

    return {
      totalMaterialCost,
      totalScrapCost,
      finalCost,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || bomItems.length === 0) {
      toast.error('Please select product and add at least one material');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    const costs = calculateCosts();

    const bomData = {
      product_id: selectedProduct,
      product_name: product?.name || '',
      bom_items: bomItems,
      total_material_cost: costs.totalMaterialCost,
      total_scrap_cost: costs.totalScrapCost,
      final_cost_per_unit: costs.finalCost,
      status: 'active',
    };

    try {
      const accessToken = await getAccessToken(); // ADDED: Use getAccessToken helper
      const url = editingBOM
        ? `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/bom/${editingBOM.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/bom`;

      const response = await fetch(url, {
        method: editingBOM ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bomData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save BOM');
      }

      toast.success(editingBOM ? 'BOM updated successfully' : 'BOM created successfully');
      setDialogOpen(false);
      resetForm();
      fetchBOMs();
    } catch (error: any) {
      console.error('Error saving BOM:', error);
      toast.error('Failed to save BOM: ' + error.message);
    }
  };

  const handleEdit = (bom: BOM) => {
    setEditingBOM(bom);
    setSelectedProduct(bom.product_id);
    setBOMItems(bom.bom_items);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this BOM?')) return;

    try {
      const accessToken = await getAccessToken(); // ADDED: Use getAccessToken helper
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/bom/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete BOM');
      toast.success('BOM deleted successfully');
      fetchBOMs();
    } catch (error: any) {
      console.error('Error deleting BOM:', error);
      toast.error('Failed to delete BOM: ' + error.message);
    }
  };

  const resetForm = () => {
    setSelectedProduct('');
    setBOMItems([]);
    setCurrentItem({ material_id: '', quantity: '', scrap_percentage: '5' });
    setEditingBOM(null);
  };

  const costs = calculateCosts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bill of Materials (BOM)</h1>
          <p className="text-gray-600 mt-1">Define material requirements and costs for products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create BOM
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBOM ? 'Edit BOM' : 'Create New BOM'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <Label>Select Product (Finished Goods - FG) *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Finished Goods (FG) item" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No FG items found. Please create FG items in Master Data first.
                      </div>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          [FG] {product.name} ({product.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Only Finished Goods (FG) items from Master Data are shown
                </p>
              </div>

              {/* Add Materials Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Materials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label>Material *</Label>
                      <Select
                        value={currentItem.material_id}
                        onValueChange={(value) =>
                          setCurrentItem({ ...currentItem, material_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={currentItem.quantity}
                        onChange={(e) =>
                          setCurrentItem({ ...currentItem, quantity: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Scrap % *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="5"
                        value={currentItem.scrap_percentage}
                        onChange={(e) =>
                          setCurrentItem({ ...currentItem, scrap_percentage: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="button" onClick={addBOMItem} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* BOM Items Table */}
                  {bomItems.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Cost/Unit</TableHead>
                            <TableHead className="text-right">Total Cost</TableHead>
                            <TableHead className="text-right">Scrap %</TableHead>
                            <TableHead className="text-right">Scrap Cost</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bomItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.material_name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell className="text-right">
                                ₹{item.cost_per_unit.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                ₹{item.total_cost.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">{item.scrap_percentage}%</TableCell>
                              <TableCell className="text-right">
                                ₹{(item.total_cost * item.scrap_percentage / 100).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBOMItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Cost Summary */}
                  {bomItems.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Material Cost:</span>
                        <span className="font-semibold">₹{costs.totalMaterialCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Scrap/Waste Cost:</span>
                        <span className="font-semibold text-orange-600">
                          ₹{costs.totalScrapCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t pt-2">
                        <span>Final Cost Per Unit:</span>
                        <span className="text-green-600">₹{costs.finalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingBOM ? 'Update BOM' : 'Create BOM'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* BOM List */}
      <Card>
        <CardHeader>
          <CardTitle>Bill of Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : boms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>No BOMs created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {boms.map((bom) => (
                <Card key={bom.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{bom.product_name}</h3>
                        <p className="text-sm text-gray-600">Product ID: {bom.product_id}</p>
                        <Badge className="mt-2">{bom.status}</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{bom.final_cost_per_unit.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-600">Cost per unit</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm text-gray-600">Material Cost</p>
                        <p className="font-semibold">₹{bom.total_material_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Scrap/Waste Cost</p>
                        <p className="font-semibold text-orange-600">
                          ₹{bom.total_scrap_cost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Materials</p>
                        <p className="font-semibold">{bom.bom_items.length} items</p>
                      </div>
                    </div>

                    <details className="mb-4">
                      <summary className="cursor-pointer font-medium text-sm mb-2">
                        View Material Details
                      </summary>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Cost/Unit</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Scrap %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bom.bom_items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.material_name}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell className="text-right">
                                ₹{item.cost_per_unit.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">
                                ₹{item.total_cost.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right">{item.scrap_percentage}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </details>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(bom)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(bom.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}