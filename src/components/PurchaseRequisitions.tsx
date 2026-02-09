import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { Plus, ShoppingCart, Send, Trash2 } from 'lucide-react';

export function PurchaseRequisitions() {
  const [prs, setPrs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prResult, deptResult, itemResult] = await Promise.all([
        api.getPRs(),
        api.getDepartments(),
        api.getItems(),
      ]);
      setPrs(prResult.prs || []);
      setDepartments(deptResult.departments || []);
      setItems(itemResult.items || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const PRForm = () => {
    const [formData, setFormData] = useState({
      department_id: '',
      remarks: '',
    });
    const [prItems, setPrItems] = useState<any[]>([
      { item_id: '', quantity: '', required_date: '', remarks: '' },
    ]);
    const [submitting, setSubmitting] = useState(false);

    const addItem = () => {
      setPrItems([...prItems, { item_id: '', quantity: '', required_date: '', remarks: '' }]);
    };

    const removeItem = (index: number) => {
      setPrItems(prItems.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
      const updated = [...prItems];
      updated[index] = { ...updated[index], [field]: value };
      setPrItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        const validItems = prItems.filter(item => item.item_id && item.quantity);
        if (validItems.length === 0) {
          toast.error('Please add at least one item');
          return;
        }

        await api.createPR(formData.department_id, validItems, formData.remarks);
        toast.success('Purchase Requisition created successfully');
        setDialogOpen(false);
        loadData();
      } catch (error: any) {
        toast.error(`Failed to create PR: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Department</Label>
          <Select value={formData.department_id} onValueChange={(val) => setFormData({ ...formData, department_id: val })}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Remarks</Label>
          <Input
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Items</Label>
            <Button type="button" size="sm" onClick={addItem}>
              <Plus className="size-4 mr-1" />
              Add Item
            </Button>
          </div>

          {prItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <Select value={item.item_id} onValueChange={(val) => updateItem(index, 'item_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((it) => (
                      <SelectItem key={it.id} value={it.id}>
                        {it.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="date"
                  value={item.required_date}
                  onChange={(e) => updateItem(index, 'required_date', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Remarks"
                  value={item.remarks}
                  onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={prItems.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create PR'}
        </Button>
      </form>
    );
  };

  const handleSubmitPR = async (prId: string) => {
    try {
      await api.submitPR(prId);
      toast.success('PR submitted successfully');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to submit PR: ${error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading purchase requisitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Requisitions</h1>
          <p className="text-gray-500 mt-1">Manage purchase requisition requests</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              New PR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Requisition</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new purchase requisition.
              </DialogDescription>
            </DialogHeader>
            <PRForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Purchase Requisitions ({prs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PR Number</TableHead>
                <TableHead>PR Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prs.map((pr) => {
                const dept = departments.find(d => d.id === pr.department_id);
                return (
                  <TableRow key={pr.id}>
                    <TableCell className="font-medium">{pr.pr_number}</TableCell>
                    <TableCell>{pr.pr_date}</TableCell>
                    <TableCell>{dept?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(pr.status)}>
                        {pr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{pr.remarks || '-'}</TableCell>
                    <TableCell>
                      {pr.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmitPR(pr.id)}
                        >
                          <Send className="size-4 mr-1" />
                          Submit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {prs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No purchase requisitions found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}