import { useState, useEffect } from 'react';
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
import { Factory, Plus, Eye, Package, Settings, PlayCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { MaterialIssue } from './MaterialIssue';
import { ProductionEntry } from './ProductionEntry';
import { QCInspection } from './QCInspection';
import { WorkOrderActions } from './WorkOrderActions';

export function Production() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [boms, setBOMs] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Dialog states
  const [createBOMOpen, setCreateBOMOpen] = useState(false);
  const [createWOOpen, setCreateWOOpen] = useState(false);
  const [viewBOMOpen, setViewBOMOpen] = useState(false);
  const [viewWOOpen, setViewWOOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [produceOpen, setProduceOpen] = useState(false);

  // New workflow dialog states
  const [materialIssueOpen, setMaterialIssueOpen] = useState(false);
  const [productionEntryOpen, setProductionEntryOpen] = useState(false);
  const [qcInspectionOpen, setQCInspectionOpen] = useState(false);

  const [selectedBOM, setSelectedBOM] = useState<any>(null);
  const [selectedWO, setSelectedWO] = useState<any>(null);
  const [bomComponents, setBOMComponents] = useState<any[]>([]);
  const [woComponents, setWOComponents] = useState<any[]>([]);

  // BOM form state
  const [bomFinishedItem, setBOMFinishedItem] = useState('');
  const [bomVersion, setBOMVersion] = useState('1.0');
  const [bomComponents_Form, setBOMComponents_Form] = useState<any[]>([
    { item_id: '', quantity: '', uom: '', is_optional: false }
  ]);
  const [bomDescription, setBOMDescription] = useState('');

  // Work Order form state
  const [woBOMId, setWOBOMId] = useState('');
  const [woQuantity, setWOQuantity] = useState('');
  const [woWarehouseId, setWOWarehouseId] = useState('');
  const [woPlannedStart, setWOPlannedStart] = useState(new Date().toISOString().split('T')[0]);
  const [woPlannedEnd, setWOPlannedEnd] = useState('');
  const [woRemarks, setWORemarks] = useState('');

  // Consume material form
  const [consumeItemId, setConsumeItemId] = useState('');
  const [consumeQuantity, setConsumeQuantity] = useState('');
  const [consumeBatch, setConsumeBatch] = useState('');

  // Produce output form
  const [produceQuantity, setProduceQuantity] = useState('');
  const [produceBatch, setProduceBatch] = useState('');
  const [produceRemarks, setProduceRemarks] = useState('');

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
      const [wosResult, bomsResult, itemsResult, warehousesResult, stockResult] = await Promise.all([
        api.getWorkOrders(),
        api.getBOMs(),
        api.getItems(),
        api.getWarehouses(),
        api.getStock()
      ]);
      
      console.log('📦 Production - All Items from API:', itemsResult.items);
      console.log('🔍 Production - Item Types:', itemsResult.items?.map((i: any) => ({ id: i.id, name: i.name, type: i.type })));
      
      setWorkOrders(wosResult.wos || []);
      setBOMs(bomsResult.boms || []);
      setItems(itemsResult.items || []);
      setWarehouses(warehousesResult.warehouses || []);
      setStock(stockResult.stock || []);
      
      // Log filtered items
      const fgItems = itemsResult.items?.filter((i: any) => i.type === 'FG') || [];
      const rmItems = itemsResult.items?.filter((i: any) => i.type === 'RM') || [];
      console.log('✅ Production - FG Items Count:', fgItems.length);
      console.log('✅ Production - RM Items Count:', rmItems.length);
    } catch (error: any) {
      toast.error(`Failed to load production data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBOM = async () => {
    if (!bomFinishedItem || bomComponents_Form.length === 0) {
      toast.error('Please select finished item and add at least one component');
      return;
    }

    // Validate components
    for (const comp of bomComponents_Form) {
      if (!comp.item_id || !comp.quantity) {
        toast.error('All components must have item and quantity');
        return;
      }
    }

    try {
      await api.createBOM({
        finished_item_id: bomFinishedItem,
        version: bomVersion,
        components: bomComponents_Form.map(c => ({
          item_id: c.item_id,
          quantity: parseFloat(c.quantity),
          is_optional: c.is_optional
        })),
        description: bomDescription
      });

      toast.success('BOM created successfully!');
      setCreateBOMOpen(false);
      resetBOMForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create BOM: ${error.message}`);
    }
  };

  const handleCreateWorkOrder = async () => {
    if (!woBOMId || !woQuantity || !woWarehouseId || !woPlannedEnd) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createWorkOrder({
        bom_id: woBOMId,
        quantity: parseFloat(woQuantity),
        warehouse_id: woWarehouseId,
        planned_start_date: woPlannedStart,
        planned_end_date: woPlannedEnd,
        remarks: woRemarks
      });

      toast.success('Work Order created successfully! Materials are reserved.');
      setCreateWOOpen(false);
      resetWOForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create Work Order: ${error.message}`);
    }
  };

  const handleConsumeMaterial = async () => {
    if (!consumeItemId || !consumeQuantity) {
      toast.error('Please select item and enter quantity');
      return;
    }

    try {
      await api.consumeMaterial(
        selectedWO.id,
        consumeItemId,
        parseFloat(consumeQuantity),
        consumeBatch || undefined
      );

      toast.success('Material consumed and stock deducted!');
      setConsumeOpen(false);
      resetConsumeForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to consume material: ${error.message}`);
    }
  };

  const handleProduceOutput = async () => {
    if (!produceQuantity || !produceBatch) {
      toast.error('Please enter quantity and batch number');
      return;
    }

    try {
      await api.produceOutput(selectedWO.id, {
        quantity: parseFloat(produceQuantity),
        batch_number: produceBatch,
        remarks: produceRemarks
      });

      toast.success('Production output recorded and stock added!');
      setProduceOpen(false);
      resetProduceForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to record production: ${error.message}`);
    }
  };

  const addBOMComponent = () => {
    setBOMComponents_Form([...bomComponents_Form, { item_id: '', quantity: '', uom: '', is_optional: false }]);
  };

  const removeBOMComponent = (index: number) => {
    const updated = bomComponents_Form.filter((_, i) => i !== index);
    setBOMComponents_Form(updated);
  };

  const updateBOMComponent = (index: number, field: string, value: any) => {
    const updated = [...bomComponents_Form];
    updated[index] = { ...updated[index], [field]: value };
    setBOMComponents_Form(updated);
  };

  const resetBOMForm = () => {
    setBOMFinishedItem('');
    setBOMVersion('1.0');
    setBOMComponents_Form([{ item_id: '', quantity: '', uom: '', is_optional: false }]);
    setBOMDescription('');
  };

  const resetWOForm = () => {
    setWOBOMId('');
    setWOQuantity('');
    setWOWarehouseId('');
    setWOPlannedStart(new Date().toISOString().split('T')[0]);
    setWOPlannedEnd('');
    setWORemarks('');
  };

  const resetConsumeForm = () => {
    setConsumeItemId('');
    setConsumeQuantity('');
    setConsumeBatch('');
  };

  const resetProduceForm = () => {
    setProduceQuantity('');
    setProduceBatch('');
    setProduceRemarks('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'planned': return <Badge className="bg-blue-500">Planned</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-500">In Progress</Badge>;
      case 'qc_pending': return <Badge className="bg-purple-500">QC Pending</Badge>;
      case 'qc_rejected': return <Badge className="bg-orange-500">QC Rejected</Badge>;
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'active': return <Badge className="bg-green-500">Active</Badge>;
      case 'obsolete': return <Badge variant="outline">Obsolete</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.code} - ${item.name}` : 'Unknown Item';
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  };

  const getMaterialRequirement = (bomId: string, woQuantity: number) => {
    const bom = boms.find(b => b.id === bomId);
    if (!bom) return [];
    
    // Calculate material requirements based on BOM and WO quantity
    return bomComponents.map(comp => ({
      ...comp,
      required_quantity: comp.quantity * woQuantity
    }));
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
          <h1 className="text-3xl font-bold">Production Management</h1>
          <p className="text-gray-500 mt-1">BOM & work order management with material planning</p>
        </div>
      </div>

      <Tabs defaultValue="work-orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="boms">Bill of Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Factory className="size-5" />
                  Work Orders ({workOrders.length})
                </CardTitle>
                <Dialog open={createWOOpen} onOpenChange={setCreateWOOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Work Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Work Order</DialogTitle>
                      <DialogDescription>
                        Plan production and reserve materials automatically
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="wo-bom">Select BOM *</Label>
                        <Select value={woBOMId} onValueChange={setWOBOMId}>
                          <SelectTrigger id="wo-bom">
                            <SelectValue placeholder="Select BOM" />
                          </SelectTrigger>
                          <SelectContent>
                            {boms.filter(b => b.status === 'active').map(bom => (
                              <SelectItem key={bom.id} value={bom.id}>
                                {getItemName(bom.finished_item_id)} - v{bom.version}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="wo-quantity">Quantity to Produce *</Label>
                        <Input
                          id="wo-quantity"
                          type="number"
                          min="1"
                          step="0.01"
                          value={woQuantity}
                          onChange={(e) => setWOQuantity(e.target.value)}
                          placeholder="Enter production quantity"
                        />
                      </div>

                      <div>
                        <Label htmlFor="wo-warehouse">Production Warehouse *</Label>
                        <Select value={woWarehouseId} onValueChange={setWOWarehouseId}>
                          <SelectTrigger id="wo-warehouse">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="wo-start">Planned Start Date *</Label>
                          <Input
                            id="wo-start"
                            type="date"
                            value={woPlannedStart}
                            onChange={(e) => setWOPlannedStart(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="wo-end">Planned End Date *</Label>
                          <Input
                            id="wo-end"
                            type="date"
                            value={woPlannedEnd}
                            onChange={(e) => setWOPlannedEnd(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="wo-remarks">Remarks</Label>
                        <Textarea
                          id="wo-remarks"
                          value={woRemarks}
                          onChange={(e) => setWORemarks(e.target.value)}
                          placeholder="Enter any additional notes"
                          rows={3}
                        />
                      </div>

                      {woBOMId && woQuantity && (
                        <Alert>
                          <AlertTriangle className="size-4" />
                          <AlertTitle>Material Requirement Preview</AlertTitle>
                          <AlertDescription>
                            Creating this work order will reserve materials from stock.
                            Ensure sufficient stock is available.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateWOOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateWorkOrder}>
                        Create Work Order
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {workOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Factory className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No work orders found</p>
                  <p className="text-sm">Create your first work order to start production</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>WO Number</TableHead>
                      <TableHead>Finished Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Planned Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workOrders.map((wo) => (
                      <TableRow key={wo.id}>
                        <TableCell className="font-medium">{wo.wo_number}</TableCell>
                        <TableCell>{getItemName(wo.finished_item_id)}</TableCell>
                        <TableCell>{wo.quantity}</TableCell>
                        <TableCell>{getWarehouseName(wo.warehouse_id)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(wo.planned_start_date).toLocaleDateString()} - 
                          {new Date(wo.planned_end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(wo.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedWO(wo);
                                // Find and set the BOM for this work order
                                const woBom = boms.find(b => b.id === wo.bom_id);
                                setSelectedBOM(woBom || null);
                                setViewWOOpen(true);
                              }}
                            >
                              <Eye className="size-3 mr-1" />
                              View
                            </Button>

                            {/* Use WorkOrderActions for workflow buttons */}
                            {(() => {
                              const woBom = boms.find(b => b.id === wo.bom_id);
                              return woBom ? (
                                <WorkOrderActions
                                  workOrder={wo}
                                  bom={woBom}
                                  items={items}
                                  stock={stock}
                                  onUpdate={loadData}
                                  onOpenMaterialIssue={() => {
                                    setSelectedWO(wo);
                                    setSelectedBOM(woBom);
                                    setMaterialIssueOpen(true);
                                  }}
                                  onOpenProductionEntry={() => {
                                    setSelectedWO(wo);
                                    setSelectedBOM(woBom);
                                    setProductionEntryOpen(true);
                                  }}
                                  onOpenQCInspection={() => {
                                    setSelectedWO(wo);
                                    setSelectedBOM(woBom);
                                    setQCInspectionOpen(true);
                                  }}
                                />
                              ) : null;
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boms" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  Bill of Materials ({boms.length})
                </CardTitle>
                <Dialog open={createBOMOpen} onOpenChange={setCreateBOMOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create BOM
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Bill of Materials</DialogTitle>
                      <DialogDescription>
                        Define the materials and components required to produce an item
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bom-item">Finished Item *</Label>
                        <Select value={bomFinishedItem} onValueChange={setBOMFinishedItem}>
                          <SelectTrigger id="bom-item">
                            <SelectValue placeholder="Select finished good" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.filter(i => i.type === 'FG').map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.code} - {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="bom-version">Version</Label>
                        <Input
                          id="bom-version"
                          value={bomVersion}
                          onChange={(e) => setBOMVersion(e.target.value)}
                          placeholder="e.g., 1.0, 2.0"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bom-description">Description</Label>
                        <Textarea
                          id="bom-description"
                          value={bomDescription}
                          onChange={(e) => setBOMDescription(e.target.value)}
                          placeholder="Enter BOM description"
                          rows={2}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold">Components *</Label>
                          <Button size="sm" variant="outline" onClick={addBOMComponent}>
                            <Plus className="size-3 mr-1" />
                            Add Component
                          </Button>
                        </div>

                        <div className="space-y-3 border rounded p-3">
                          {bomComponents_Form.map((comp, index) => (
                            <div key={index} className="flex gap-2 items-start border-b pb-3 last:border-b-0 last:pb-0">
                              <div className="flex-1">
                                <Select 
                                  value={comp.item_id} 
                                  onValueChange={(value) => updateBOMComponent(index, 'item_id', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select component (RM)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.filter(i => i.type === 'RM').length === 0 ? (
                                      <div className="p-2 text-sm text-gray-500">
                                        No RM items found. Please create RM items in Master Data first.
                                      </div>
                                    ) : (
                                      items.filter(i => i.type === 'RM').map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                          [RM] {item.code} - {item.name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-28">
                                <Input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={comp.quantity}
                                  onChange={(e) => updateBOMComponent(index, 'quantity', e.target.value)}
                                  placeholder="Qty"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600">Optional</label>
                                <input
                                  type="checkbox"
                                  checked={comp.is_optional}
                                  onChange={(e) => updateBOMComponent(index, 'is_optional', e.target.checked)}
                                  className="rounded"
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeBOMComponent(index)}
                                disabled={bomComponents_Form.length === 1}
                              >
                                <XCircle className="size-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateBOMOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateBOM}>
                        Create BOM
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {boms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No BOMs found</p>
                  <p className="text-sm">Create a BOM to define production recipes</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BOM Code</TableHead>
                      <TableHead>Finished Item</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Components</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boms.map((bom) => (
                      <TableRow key={bom.id}>
                        <TableCell className="font-medium">{bom.bom_code}</TableCell>
                        <TableCell>{getItemName(bom.finished_item_id)}</TableCell>
                        <TableCell>{bom.version}</TableCell>
                        <TableCell>{bom.component_count || 0} items</TableCell>
                        <TableCell>{getStatusBadge(bom.status)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="size-3 mr-1" />
                            View Details
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
      </Tabs>

      {/* Workflow Dialogs */}
      {selectedWO && selectedBOM && (
        <>
          <MaterialIssue
            isOpen={materialIssueOpen}
            onClose={() => setMaterialIssueOpen(false)}
            workOrder={selectedWO}
            bom={selectedBOM}
            items={items}
            stock={stock}
            onIssued={loadData}
          />

          <ProductionEntry
            isOpen={productionEntryOpen}
            onClose={() => setProductionEntryOpen(false)}
            workOrder={selectedWO}
            onRecorded={loadData}
          />

          <QCInspection
            isOpen={qcInspectionOpen}
            onClose={() => setQCInspectionOpen(false)}
            workOrder={selectedWO}
            onInspected={loadData}
          />
        </>
      )}
    </div>
  );
}