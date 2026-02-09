import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Settings, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';
import { Switch } from './ui/switch';

export function ApprovalRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Form state
  const [documentType, setDocumentType] = useState('sales_quotation');
  const [approvalLevel, setApprovalLevel] = useState('1');
  const [roleName, setRoleName] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const result = await api.getApprovalRules();
      setRules(result.rules || []);
    } catch (error: any) {
      toast.error(`Failed to load approval rules: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!documentType || !approvalLevel || !roleName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createApprovalRule({
        document_type: documentType,
        approval_level: parseInt(approvalLevel),
        role_name: roleName,
        min_amount: minAmount ? parseFloat(minAmount) : null,
        max_amount: maxAmount ? parseFloat(maxAmount) : null,
        description,
      });

      toast.success('Approval rule created successfully!');
      setCreateOpen(false);
      resetForm();
      loadRules();
    } catch (error: any) {
      toast.error(`Failed to create rule: ${error.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRule) return;

    try {
      await api.updateApprovalRule(selectedRule.id, {
        document_type: documentType,
        approval_level: parseInt(approvalLevel),
        role_name: roleName,
        min_amount: minAmount ? parseFloat(minAmount) : null,
        max_amount: maxAmount ? parseFloat(maxAmount) : null,
        description,
      });

      toast.success('Approval rule updated successfully!');
      setEditOpen(false);
      setSelectedRule(null);
      resetForm();
      loadRules();
    } catch (error: any) {
      toast.error(`Failed to update rule: ${error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this approval rule?')) return;

    try {
      await api.deleteApprovalRule(id);
      toast.success('Approval rule deleted');
      loadRules();
    } catch (error: any) {
      toast.error(`Failed to delete rule: ${error.message}`);
    }
  };

  const handleToggleActive = async (rule: any) => {
    try {
      await api.updateApprovalRule(rule.id, {
        is_active: !rule.is_active,
      });
      toast.success(rule.is_active ? 'Rule deactivated' : 'Rule activated');
      loadRules();
    } catch (error: any) {
      toast.error(`Failed to toggle rule: ${error.message}`);
    }
  };

  const resetForm = () => {
    setDocumentType('sales_quotation');
    setApprovalLevel('1');
    setRoleName('');
    setMinAmount('');
    setMaxAmount('');
    setDescription('');
  };

  const openEditDialog = (rule: any) => {
    setSelectedRule(rule);
    setDocumentType(rule.document_type);
    setApprovalLevel(rule.approval_level.toString());
    setRoleName(rule.role_name);
    setMinAmount(rule.min_amount ? rule.min_amount.toString() : '');
    setMaxAmount(rule.max_amount ? rule.max_amount.toString() : '');
    setDescription(rule.description || '');
    setEditOpen(true);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'No limit';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getDocumentTypeName = (type: string) => {
    const names: Record<string, string> = {
      sales_quotation: 'Sales Quotation',
      purchase_order: 'Purchase Order',
      sales_order: 'Sales Order',
      invoice: 'Invoice',
      payment: 'Payment',
    };
    return names[type] || type;
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
          <h1 className="text-3xl font-bold">Approval Workflow Rules</h1>
          <p className="text-gray-500 mt-1">Configure multi-level approval workflows based on amount thresholds</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              Approval Rules ({rules.length})
            </CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="size-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Approval Rule</DialogTitle>
                  <DialogDescription>
                    Define an approval level with role and amount thresholds
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="doc-type">Document Type *</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger id="doc-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales_quotation">Sales Quotation</SelectItem>
                          <SelectItem value="sales_order">Sales Order</SelectItem>
                          <SelectItem value="purchase_order">Purchase Order</SelectItem>
                          <SelectItem value="invoice">Invoice</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="approval-level">Approval Level *</Label>
                      <Input
                        id="approval-level"
                        type="number"
                        min="1"
                        value={approvalLevel}
                        onChange={(e) => setApprovalLevel(e.target.value)}
                        placeholder="e.g., 1, 2, 3"
                      />
                      <p className="text-xs text-gray-500 mt-1">Level 1 is first, Level 2 is second, etc.</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="role-name">Approver Role Name *</Label>
                    <Input
                      id="role-name"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g., Sales Manager, Finance Manager"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must match exact role name from User Management</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-amount">Minimum Amount (₹)</Label>
                      <Input
                        id="min-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        placeholder="e.g., 0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no minimum</p>
                    </div>

                    <div>
                      <Label htmlFor="max-amount">Maximum Amount (₹)</Label>
                      <Input
                        id="max-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        placeholder="e.g., 100000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no maximum</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., All quotations above ₹1L require manager approval"
                      rows={2}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm font-semibold text-blue-900 mb-1">💡 Example Workflow</p>
                    <p className="text-xs text-blue-700">
                      <strong>Level 1:</strong> Sales Manager (₹0 - ₹100,000)<br />
                      <strong>Level 2:</strong> Finance Manager (₹100,001 - ₹500,000)<br />
                      <strong>Level 3:</strong> Director (₹500,001 - No limit)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>
                    Create Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="size-12 mx-auto mb-4 opacity-20" />
              <p>No approval rules configured</p>
              <p className="text-sm">Create rules to enable multi-level approval workflows</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Approver Role</TableHead>
                  <TableHead>Min Amount</TableHead>
                  <TableHead>Max Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      {getDocumentTypeName(rule.document_type)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Level {rule.approval_level}</Badge>
                    </TableCell>
                    <TableCell>{rule.role_name}</TableCell>
                    <TableCell>{formatCurrency(rule.min_amount)}</TableCell>
                    <TableCell>{formatCurrency(rule.max_amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                        {rule.is_active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Edit className="size-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="size-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Approval Rule</DialogTitle>
            <DialogDescription>
              Update approval level configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-doc-type">Document Type *</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="edit-doc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_quotation">Sales Quotation</SelectItem>
                    <SelectItem value="sales_order">Sales Order</SelectItem>
                    <SelectItem value="purchase_order">Purchase Order</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-approval-level">Approval Level *</Label>
                <Input
                  id="edit-approval-level"
                  type="number"
                  min="1"
                  value={approvalLevel}
                  onChange={(e) => setApprovalLevel(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-role-name">Approver Role Name *</Label>
              <Input
                id="edit-role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-min-amount">Minimum Amount (₹)</Label>
                <Input
                  id="edit-min-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-max-amount">Maximum Amount (₹)</Label>
                <Input
                  id="edit-max-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              <CheckCircle className="size-4 mr-2" />
              Update Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
