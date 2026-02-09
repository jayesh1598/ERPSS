import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  Edit2, 
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';

interface VoucherEntry {
  ledger_id: string;
  ledger_name?: string;
  type: 'debit' | 'credit';
  amount: number;
  narration?: string;
}

interface Voucher {
  id: string;
  voucher_type: 'payment' | 'receipt' | 'journal' | 'contra' | 'sales' | 'purchase';
  voucher_number: string;
  date: string;
  reference_number?: string;
  entries: VoucherEntry[];
  total_amount: number;
  narration?: string;
  status: 'draft' | 'posted' | 'cancelled';
  created_by?: string;
  created_at?: string;
}

interface Ledger {
  id: string;
  name: string;
  group_id: string;
  group_name?: string;
  current_balance: number;
  is_bank_account: boolean;
  enable_gst: boolean;
}

export function VoucherEntry() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [showVoucherDialog, setShowVoucherDialog] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Voucher form state
  const [voucherType, setVoucherType] = useState<'payment' | 'receipt' | 'journal' | 'contra' | 'sales' | 'purchase'>('payment');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [narration, setNarration] = useState('');
  const [entries, setEntries] = useState<VoucherEntry[]>([
    { ledger_id: '', type: 'debit', amount: 0 },
    { ledger_id: '', type: 'credit', amount: 0 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vouchersData, ledgersData] = await Promise.all([
        api.getVouchers(),
        api.getAccountLedgers(),
      ]);
      setVouchers(vouchersData);
      setLedgers(ledgersData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getVoucherTypeConfig = (type: string) => {
    const configs: Record<string, { icon: any; color: string; label: string; description: string }> = {
      payment: { icon: ArrowUpCircle, color: 'bg-red-100 text-red-800 border-red-300', label: 'Payment', description: 'Cash/Bank Payment' },
      receipt: { icon: ArrowDownCircle, color: 'bg-green-100 text-green-800 border-green-300', label: 'Receipt', description: 'Cash/Bank Receipt' },
      journal: { icon: RefreshCw, color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Journal', description: 'Adjustment Entry' },
      contra: { icon: RefreshCw, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Contra', description: 'Cash/Bank Transfer' },
      sales: { icon: DollarSign, color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Sales', description: 'Sales Transaction' },
      purchase: { icon: ShoppingCart, color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Purchase', description: 'Purchase Transaction' },
    };
    return configs[type] || configs.journal;
  };

  const handleCreateVoucher = () => {
    resetVoucherForm();
    setShowVoucherDialog(true);
  };

  const handleEditVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setVoucherType(voucher.voucher_type);
    setVoucherDate(voucher.date);
    setReferenceNumber(voucher.reference_number || '');
    setNarration(voucher.narration || '');
    setEntries(voucher.entries);
    setShowVoucherDialog(true);
  };

  const handleViewVoucher = (voucher: Voucher) => {
    setViewingVoucher(voucher);
  };

  const handleSaveVoucher = async (isDraft: boolean = false) => {
    // Validation
    if (entries.length < 2) {
      toast.error('At least 2 entries required for double-entry');
      return;
    }

    // Check all entries have ledgers
    if (entries.some(e => !e.ledger_id || e.amount <= 0)) {
      toast.error('All entries must have a ledger and amount greater than 0');
      return;
    }

    // Calculate totals
    const debitTotal = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const creditTotal = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

    // Validate double-entry (debits must equal credits)
    if (Math.abs(debitTotal - creditTotal) > 0.01) {
      toast.error(`Debits (₹${debitTotal.toFixed(2)}) must equal Credits (₹${creditTotal.toFixed(2)})`);
      return;
    }

    // Enhance entries with ledger names
    const enhancedEntries = entries.map(entry => {
      const ledger = ledgers.find(l => l.id === entry.ledger_id);
      return {
        ...entry,
        ledger_name: ledger?.name || 'Unknown',
      };
    });

    const voucherData = {
      voucher_type: voucherType,
      date: voucherDate,
      reference_number: referenceNumber,
      entries: enhancedEntries,
      total_amount: debitTotal,
      narration,
      status: isDraft ? 'draft' : 'posted',
    };

    try {
      if (editingVoucher) {
        await api.updateVoucher(editingVoucher.id, voucherData);
        toast.success('Voucher updated successfully');
      } else {
        await api.createVoucher(voucherData);
        toast.success('Voucher created successfully');
      }
      setShowVoucherDialog(false);
      resetVoucherForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save voucher');
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return;

    try {
      await api.deleteVoucher(id);
      toast.success('Voucher deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete voucher');
    }
  };

  const resetVoucherForm = () => {
    setVoucherType('payment');
    setVoucherDate(new Date().toISOString().split('T')[0]);
    setReferenceNumber('');
    setNarration('');
    setEntries([
      { ledger_id: '', type: 'debit', amount: 0 },
      { ledger_id: '', type: 'credit', amount: 0 },
    ]);
    setEditingVoucher(null);
  };

  const addEntry = () => {
    setEntries([...entries, { ledger_id: '', type: 'debit', amount: 0 }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) {
      toast.error('Minimum 2 entries required');
      return;
    }
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof VoucherEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const calculateTotals = () => {
    const debitTotal = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + parseFloat(e.amount.toString() || '0'), 0);
    const creditTotal = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + parseFloat(e.amount.toString() || '0'), 0);
    const difference = debitTotal - creditTotal;
    return { debitTotal, creditTotal, difference };
  };

  const filteredVouchers = vouchers.filter(v => {
    if (filterType !== 'all' && v.voucher_type !== filterType) return false;
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    return true;
  });

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vouchers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Voucher Entry</h2>
          <p className="text-gray-600">Create and manage accounting vouchers</p>
        </div>
        <Button onClick={handleCreateVoucher}>
          <Plus className="size-4 mr-2" />
          Create Voucher
        </Button>
      </div>

      {/* Quick Create Cards */}
      <div className="grid grid-cols-6 gap-3">
        {['payment', 'receipt', 'journal', 'contra', 'sales', 'purchase'].map((type) => {
          const config = getVoucherTypeConfig(type);
          const Icon = config.icon;
          const count = vouchers.filter(v => v.voucher_type === type && v.status === 'posted').length;

          return (
            <Card
              key={type}
              className={`p-4 cursor-pointer hover:shadow-lg transition border-2 ${config.color}`}
              onClick={() => {
                setVoucherType(type as any);
                handleCreateVoucher();
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="size-5" />
                <span className="text-xl font-bold">{count}</span>
              </div>
              <div className="text-sm font-semibold">{config.label}</div>
              <div className="text-xs opacity-75">{config.description}</div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Filter by Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="journal">Journal</SelectItem>
                <SelectItem value="contra">Contra</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Filter by Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Vouchers List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All Vouchers ({filteredVouchers.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Voucher No.</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Reference</th>
                <th className="text-right p-2">Amount</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    No vouchers found. Create your first voucher to get started.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => {
                  const config = getVoucherTypeConfig(voucher.voucher_type);
                  const Icon = config.icon;

                  return (
                    <tr key={voucher.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{voucher.voucher_number}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Icon className="size-4" />
                          <span className="text-sm">{config.label}</span>
                        </div>
                      </td>
                      <td className="p-2 text-sm">{new Date(voucher.date).toLocaleDateString()}</td>
                      <td className="p-2 text-sm">{voucher.reference_number || '-'}</td>
                      <td className="p-2 text-right font-semibold">₹{voucher.total_amount.toLocaleString()}</td>
                      <td className="p-2">
                        <Badge
                          variant={
                            voucher.status === 'posted' ? 'default' : voucher.status === 'draft' ? 'secondary' : 'destructive'
                          }
                        >
                          {voucher.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewVoucher(voucher)}>
                            <Eye className="size-3" />
                          </Button>
                          {voucher.status === 'draft' && (
                            <Button size="sm" variant="ghost" onClick={() => handleEditVoucher(voucher)}>
                              <Edit2 className="size-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteVoucher(voucher.id)}>
                            <Trash2 className="size-3 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Voucher Dialog */}
      <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Create New Voucher'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Voucher Type Selection */}
            <div className="grid grid-cols-6 gap-2">
              {['payment', 'receipt', 'journal', 'contra', 'sales', 'purchase'].map((type) => {
                const config = getVoucherTypeConfig(type);
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setVoucherType(type as any)}
                    className={`p-3 rounded border-2 transition ${
                      voucherType === type ? config.color : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="size-5 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{config.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Voucher Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} />
              </div>
              <div>
                <Label>Reference Number</Label>
                <Input
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Optional reference"
                />
              </div>
            </div>

            {/* Entries */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-lg">Voucher Entries</Label>
                <Button size="sm" onClick={addEntry}>
                  <Plus className="size-4 mr-1" />
                  Add Entry
                </Button>
              </div>

              <div className="space-y-2">
                {entries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded border">
                    <div className="col-span-5">
                      <Label className="text-xs">Ledger *</Label>
                      <Select
                        value={entry.ledger_id}
                        onValueChange={(value) => updateEntry(index, 'ledger_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ledger" />
                        </SelectTrigger>
                        <SelectContent>
                          {ledgers.map((ledger) => (
                            <SelectItem key={ledger.id} value={ledger.id}>
                              {ledger.name} ({ledger.group_name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Type *</Label>
                      <Select value={entry.type} onValueChange={(value: any) => updateEntry(index, 'type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debit">Debit (Dr.)</SelectItem>
                          <SelectItem value="credit">Credit (Cr.)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Amount *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={entry.amount}
                        onChange={(e) => updateEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      {entries.length > 2 && (
                        <Button size="sm" variant="ghost" onClick={() => removeEntry(index)}>
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Display */}
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Debit</div>
                    <div className="text-lg font-bold text-blue-600">₹{totals.debitTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Credit</div>
                    <div className="text-lg font-bold text-green-600">₹{totals.creditTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Difference</div>
                    <div
                      className={`text-lg font-bold ${
                        Math.abs(totals.difference) < 0.01 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {Math.abs(totals.difference) < 0.01 ? (
                        '✓ Balanced'
                      ) : (
                        <>
                          <AlertCircle className="size-4 inline mr-1" />₹{Math.abs(totals.difference).toFixed(2)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Narration */}
            <div>
              <Label>Narration</Label>
              <Textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Enter voucher narration/description"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoucherDialog(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => handleSaveVoucher(true)}>
              Save as Draft
            </Button>
            <Button onClick={() => handleSaveVoucher(false)} disabled={Math.abs(totals.difference) > 0.01}>
              <Save className="size-4 mr-2" />
              Post Voucher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Voucher Dialog */}
      <Dialog open={!!viewingVoucher} onOpenChange={() => setViewingVoucher(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voucher Details</DialogTitle>
          </DialogHeader>

          {viewingVoucher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Voucher Number</Label>
                  <div className="font-semibold">{viewingVoucher.voucher_number}</div>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="font-semibold">{getVoucherTypeConfig(viewingVoucher.voucher_type).label}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="font-semibold">{new Date(viewingVoucher.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Reference</Label>
                  <div className="font-semibold">{viewingVoucher.reference_number || '-'}</div>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Entries</Label>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Ledger</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-right p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingVoucher.entries.map((entry, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{entry.ledger_name}</td>
                        <td className="p-2">
                          <Badge variant={entry.type === 'debit' ? 'default' : 'secondary'}>
                            {entry.type === 'debit' ? 'Dr.' : 'Cr.'}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-semibold">₹{entry.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={2} className="p-2 text-right">
                        Total:
                      </td>
                      <td className="p-2 text-right">₹{viewingVoucher.total_amount.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {viewingVoucher.narration && (
                <div>
                  <Label>Narration</Label>
                  <div className="p-3 bg-gray-50 rounded border text-sm">{viewingVoucher.narration}</div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewingVoucher(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
