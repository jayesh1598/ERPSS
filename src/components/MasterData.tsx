import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { useNavigate } from 'react-router';
import {
  Database,
  Building2,
  Building,
  Warehouse,
  Ruler,
  FolderTree,
  Package,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

export function MasterData() {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [partyDialogOpen, setPartyDialogOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [whResult, deptResult, uomResult, catResult, itemResult, partyResult] = await Promise.all([
        api.getWarehouses(),
        api.getDepartments(),
        api.getUOMs(),
        api.getCategories(),
        api.getItems(),
        api.getParties(),
      ]);

      setWarehouses(whResult.warehouses || []);
      setDepartments(deptResult.departments || []);
      setUoms(uomResult.uoms || []);
      setCategories(catResult.categories || []);
      setItems(itemResult.items || []);
      setParties(partyResult.parties || []);
    } catch (error: any) {
      console.error('Load data error:', error);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Warehouse Form
  const WarehouseForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [formData, setFormData] = useState({ code: '', name: '', location: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const result = await api.createWarehouse(formData.code, formData.name, formData.location);
        console.log('Warehouse creation result:', result);
        toast.success('Warehouse created successfully');
        setFormData({ code: '', name: '', location: '' });
        onSuccess();
      } catch (error: any) {
        console.error('Warehouse creation error:', error);
        // Provide more helpful error messages
        if (error.message.includes('Unauthorized')) {
          toast.error('Session expired. Please log in again.');
        } else if (error.message.includes('already exists')) {
          toast.error(error.message);
        } else {
          toast.error(`Failed to create warehouse: ${error.message}`);
        }
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Code</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Warehouse'}
        </Button>
      </form>
    );
  };

  // Department Form
  const DepartmentForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [formData, setFormData] = useState({ code: '', name: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const result = await api.createDepartment(formData.code, formData.name);
        console.log('Department creation result:', result);
        toast.success('Department created successfully');
        setFormData({ code: '', name: '' });
        onSuccess();
      } catch (error: any) {
        console.error('Department creation error:', error);
        if (error.message.includes('Unauthorized')) {
          toast.error('Session expired. Please log in again.');
        } else if (error.message.includes('already exists')) {
          toast.error(error.message);
        } else {
          toast.error(`Failed to create department: ${error.message}`);
        }
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Code</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Department'}
        </Button>
      </form>
    );
  };

  // Item Form
  const ItemForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [formData, setFormData] = useState({
      code: '',
      name: '',
      description: '',
      type: 'RM',
      category_id: '',
      uom_id: '',
      hsn_code: '',
      gst_rate: '',
      reorder_level: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await api.createItem({
          ...formData,
          gst_rate: formData.gst_rate ? parseFloat(formData.gst_rate) : undefined,
          reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : undefined,
        });
        toast.success('Item created successfully');
        setFormData({
          code: '',
          name: '',
          description: '',
          type: 'RM',
          category_id: '',
          uom_id: '',
          hsn_code: '',
          gst_rate: '',
          reorder_level: '',
        });
        onSuccess();
      } catch (error: any) {
        toast.error(`Failed to create item: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Code</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RM">Raw Material</SelectItem>
                <SelectItem value="SFG">Semi-Finished Goods</SelectItem>
                <SelectItem value="FG">Finished Goods</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>UOM</Label>
            <Select value={formData.uom_id} onValueChange={(val) => setFormData({ ...formData, uom_id: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Select UOM" />
              </SelectTrigger>
              <SelectContent>
                {uoms.map((uom) => (
                  <SelectItem key={uom.id} value={uom.id}>
                    {uom.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>HSN Code</Label>
            <Input
              value={formData.hsn_code}
              onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
            />
          </div>
          <div>
            <Label>GST Rate (%)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.gst_rate}
              onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
            />
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Item'}
        </Button>
      </form>
    );
  };

  // Party Form
  const PartyForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [formData, setFormData] = useState({
      code: '',
      name: '',
      type: 'supplier',
      gstin: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await api.createParty(formData);
        toast.success('Party created successfully');
        setFormData({
          code: '',
          name: '',
          type: 'supplier',
          gstin: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
        });
        onSuccess();
      } catch (error: any) {
        toast.error(`Failed to create party: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Code</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="job_worker">Job Worker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>GSTIN</Label>
            <Input
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>City</Label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <Label>State</Label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Party'}
        </Button>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading master data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Master Data Management</h1>
        <p className="text-gray-500 mt-1">Configure system master data</p>
      </div>

      <Tabs defaultValue="warehouses">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="parties">Parties</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="size-5" />
                Warehouses ({warehouses.length})
              </CardTitle>
              <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Add Warehouse
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Warehouse</DialogTitle>
                  </DialogHeader>
                  <WarehouseForm onSuccess={() => {
                    loadAllData();
                    setWarehouseDialogOpen(false);
                  }} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((wh) => (
                    <TableRow key={wh.id}>
                      <TableCell className="font-medium">{wh.code}</TableCell>
                      <TableCell>{wh.name}</TableCell>
                      <TableCell>{wh.location}</TableCell>
                      <TableCell>
                        <Badge variant={wh.is_active ? 'default' : 'secondary'}>
                          {wh.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {warehouses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No warehouses found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="size-5" />
                Departments ({departments.length})
              </CardTitle>
              <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Department</DialogTitle>
                  </DialogHeader>
                  <DepartmentForm onSuccess={() => {
                    loadAllData();
                    setDepartmentDialogOpen(false);
                  }} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.code}</TableCell>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell>
                        <Badge variant={dept.is_active ? 'default' : 'secondary'}>
                          {dept.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {departments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No departments found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Items ({items.length})
              </CardTitle>
              <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                  </DialogHeader>
                  <ItemForm onSuccess={() => {
                    loadAllData();
                    setItemDialogOpen(false);
                  }} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type}</Badge>
                      </TableCell>
                      <TableCell>{item.hsn_code || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No items found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Parties ({parties.length})
              </CardTitle>
              <Dialog open={partyDialogOpen} onOpenChange={setPartyDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Add Party
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Party</DialogTitle>
                  </DialogHeader>
                  <PartyForm onSuccess={() => {
                    loadAllData();
                    setPartyDialogOpen(false);
                  }} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell className="font-medium">{party.code}</TableCell>
                      <TableCell>{party.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{party.type}</Badge>
                      </TableCell>
                      <TableCell>{party.gstin || '-'}</TableCell>
                      <TableCell>{party.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={party.is_active ? 'default' : 'secondary'}>
                          {party.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {parties.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        No parties found. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}