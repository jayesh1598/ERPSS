import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { FolderTree, Plus, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';

interface AccountGroup {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'asset' | 'liability' | 'income' | 'expense' | 'capital';
  is_predefined: boolean;
  nature: 'debit' | 'credit';
}

interface Ledger {
  id: string;
  name: string;
  group_id: string;
  group_name?: string;
  opening_balance: number;
  opening_balance_type: 'debit' | 'credit';
  current_balance: number;
  is_bank_account: boolean;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  enable_gst: boolean;
  gstin?: string;
  pan?: string;
  address?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
}

export function ChartOfAccounts() {
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showLedgerDialog, setShowLedgerDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null);
  const [editingLedger, setEditingLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  // Group form state
  const [groupName, setGroupName] = useState('');
  const [groupParent, setGroupParent] = useState('');
  const [groupType, setGroupType] = useState<'asset' | 'liability' | 'income' | 'expense' | 'capital'>('asset');

  // Ledger form state
  const [ledgerName, setLedgerName] = useState('');
  const [ledgerGroup, setLedgerGroup] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openingBalanceType, setOpeningBalanceType] = useState<'debit' | 'credit'>('debit');
  const [isBankAccount, setIsBankAccount] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [enableGst, setEnableGst] = useState(false);
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, ledgersData] = await Promise.all([
        api.getAccountGroups(),
        api.getAccountLedgers(),
      ]);
      setGroups(groupsData);
      setLedgers(ledgersData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter group name');
      return;
    }

    try {
      if (editingGroup) {
        await api.updateAccountGroup(editingGroup.id, {
          name: groupName,
          parent_id: groupParent || null,
        });
        toast.success('Group updated successfully');
      } else {
        await api.createAccountGroup({
          name: groupName,
          parent_id: groupParent || null,
          type: groupType,
        });
        toast.success('Group created successfully');
      }
      setShowGroupDialog(false);
      resetGroupForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save group');
    }
  };

  const handleCreateLedger = async () => {
    if (!ledgerName.trim() || !ledgerGroup) {
      toast.error('Please enter ledger name and select group');
      return;
    }

    if (enableGst && !gstin) {
      toast.error('Please enter GSTIN when GST is enabled');
      return;
    }

    try {
      const ledgerData: any = {
        name: ledgerName,
        group_id: ledgerGroup,
        opening_balance: parseFloat(openingBalance),
        opening_balance_type: openingBalanceType,
        is_bank_account: isBankAccount,
        enable_gst: enableGst,
      };

      if (isBankAccount) {
        ledgerData.bank_name = bankName;
        ledgerData.account_number = accountNumber;
        ledgerData.ifsc_code = ifscCode;
      }

      if (enableGst) {
        ledgerData.gstin = gstin;
        ledgerData.pan = pan;
        ledgerData.address = address;
      }

      if (contactPerson) ledgerData.contact_person = contactPerson;
      if (phone) ledgerData.phone = phone;
      if (email) ledgerData.email = email;

      if (editingLedger) {
        await api.updateAccountLedger(editingLedger.id, ledgerData);
        toast.success('Ledger updated successfully');
      } else {
        await api.createAccountLedger(ledgerData);
        toast.success('Ledger created successfully');
      }

      setShowLedgerDialog(false);
      resetLedgerForm();
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save ledger');
    }
  };

  const handleEditGroup = (group: AccountGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupParent(group.parent_id || '');
    setGroupType(group.type);
    setShowGroupDialog(true);
  };

  const handleEditLedger = (ledger: Ledger) => {
    setEditingLedger(ledger);
    setLedgerName(ledger.name);
    setLedgerGroup(ledger.group_id);
    setOpeningBalance(ledger.opening_balance.toString());
    setOpeningBalanceType(ledger.opening_balance_type);
    setIsBankAccount(ledger.is_bank_account);
    setBankName(ledger.bank_name || '');
    setAccountNumber(ledger.account_number || '');
    setIfscCode(ledger.ifsc_code || '');
    setEnableGst(ledger.enable_gst);
    setGstin(ledger.gstin || '');
    setPan(ledger.pan || '');
    setAddress(ledger.address || '');
    setContactPerson(ledger.contact_person || '');
    setPhone(ledger.phone || '');
    setEmail(ledger.email || '');
    setShowLedgerDialog(true);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? All sub-groups will also be affected.')) return;

    try {
      await api.deleteAccountGroup(id);
      toast.success('Group deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const handleDeleteLedger = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ledger?')) return;

    try {
      await api.deleteAccountLedger(id);
      toast.success('Ledger deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete ledger');
    }
  };

  const resetGroupForm = () => {
    setGroupName('');
    setGroupParent('');
    setGroupType('asset');
    setEditingGroup(null);
  };

  const resetLedgerForm = () => {
    setLedgerName('');
    setLedgerGroup('');
    setOpeningBalance('0');
    setOpeningBalanceType('debit');
    setIsBankAccount(false);
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setEnableGst(false);
    setGstin('');
    setPan('');
    setAddress('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setEditingLedger(null);
  };

  const renderGroupTree = (parentId: string | null, level: number = 0) => {
    const childGroups = groups.filter((g) => g.parent_id === parentId);
    const groupLedgers = ledgers.filter((l) => childGroups.some((g) => g.id === l.group_id));

    return childGroups.map((group) => {
      const isExpanded = expandedGroups.has(group.id);
      const ledgersInGroup = ledgers.filter((l) => l.group_id === group.id);
      const hasChildren = groups.some((g) => g.parent_id === group.id) || ledgersInGroup.length > 0;

      return (
        <div key={group.id} style={{ marginLeft: `${level * 24}px` }}>
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group/item">
            <div className="flex items-center gap-2 flex-1">
              {hasChildren ? (
                <button onClick={() => toggleGroup(group.id)} className="p-1 hover:bg-gray-200 rounded">
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>
              ) : (
                <div className="w-6" />
              )}
              <FolderTree className="size-4 text-blue-600" />
              <span className="font-medium">{group.name}</span>
              <Badge variant="outline" className="text-xs">
                {group.type}
              </Badge>
              {group.is_predefined && (
                <Badge variant="secondary" className="text-xs">
                  Predefined
                </Badge>
              )}
            </div>
            {!group.is_predefined && (
              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100">
                <Button size="sm" variant="ghost" onClick={() => handleEditGroup(group)}>
                  <Edit2 className="size-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDeleteGroup(group.id)}>
                  <Trash2 className="size-3 text-red-600" />
                </Button>
              </div>
            )}
          </div>

          {isExpanded && (
            <>
              {ledgersInGroup.map((ledger) => (
                <div
                  key={ledger.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded ml-6 group/ledger"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-6" />
                    <div className="w-4 h-4 border-2 border-blue-600 rounded-full" />
                    <span>{ledger.name}</span>
                    {ledger.is_bank_account && (
                      <Badge variant="outline" className="text-xs">
                        Bank
                      </Badge>
                    )}
                    {ledger.enable_gst && (
                      <Badge variant="outline" className="text-xs">
                        GST
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500 ml-auto">
                      ₹{ledger.current_balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/ledger:opacity-100">
                    <Button size="sm" variant="ghost" onClick={() => handleEditLedger(ledger)}>
                      <Edit2 className="size-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteLedger(ledger.id)}>
                      <Trash2 className="size-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              {renderGroupTree(group.id, level + 1)}
            </>
          )}
        </div>
      );
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: 'bg-blue-100 text-blue-800',
      liability: 'bg-red-100 text-red-800',
      income: 'bg-green-100 text-green-800',
      expense: 'bg-orange-100 text-orange-800',
      capital: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading chart of accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chart of Accounts</h2>
          <p className="text-gray-600">Manage account groups and ledgers</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              resetGroupForm();
              setShowGroupDialog(true);
            }}
          >
            <Plus className="size-4 mr-2" />
            Create Group
          </Button>
          <Button
            onClick={() => {
              resetLedgerForm();
              setShowLedgerDialog(true);
            }}
          >
            <Plus className="size-4 mr-2" />
            Create Ledger
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        {['asset', 'liability', 'income', 'expense', 'capital'].map((type) => {
          const count = groups.filter((g) => g.type === type).length;
          const ledgerCount = ledgers.filter((l) => {
            const group = groups.find((g) => g.id === l.group_id);
            return group?.type === type;
          }).length;

          return (
            <Card key={type} className="p-4">
              <div className={`inline-block px-2 py-1 rounded text-sm font-medium mb-2 ${getTypeColor(type)}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
              <div className="text-2xl font-bold">{ledgerCount}</div>
              <div className="text-sm text-gray-600">{count} groups</div>
            </Card>
          );
        })}
      </div>

      {/* Account Tree */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Hierarchy</h3>
        <div className="space-y-1">{renderGroupTree(null)}</div>
      </Card>

      {/* Create/Edit Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Current Assets" />
            </div>
            <div>
              <Label>Parent Group</Label>
              <Select value={groupParent} onValueChange={setGroupParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Top Level)</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingGroup && (
              <div>
                <Label>Type</Label>
                <Select value={groupType} onValueChange={(v: any) => setGroupType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="capital">Capital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>{editingGroup ? 'Update' : 'Create'} Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Ledger Dialog */}
      <Dialog open={showLedgerDialog} onOpenChange={setShowLedgerDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLedger ? 'Edit Ledger' : 'Create New Ledger'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Ledger Name *</Label>
                <Input value={ledgerName} onChange={(e) => setLedgerName(e.target.value)} placeholder="e.g., ICICI Bank" />
              </div>
              <div className="col-span-2">
                <Label>Under Group *</Label>
                <Select value={ledgerGroup} onValueChange={setLedgerGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Opening Balance</Label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Balance Type</Label>
                <Select value={openingBalanceType} onValueChange={(v: any) => setOpeningBalanceType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={isBankAccount}
                  onChange={(e) => setIsBankAccount(e.target.checked)}
                  className="rounded"
                />
                <Label>This is a Bank Account</Label>
              </div>
              {isBankAccount && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="ICICI Bank" />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="1234567890"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>IFSC Code</Label>
                    <Input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="ICIC0001234" />
                  </div>
                </div>
              )}
            </div>

            {/* GST Details */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={enableGst}
                  onChange={(e) => setEnableGst(e.target.checked)}
                  className="rounded"
                />
                <Label>Enable GST for this Ledger</Label>
              </div>
              {enableGst && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>GSTIN *</Label>
                    <Input value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="27AAAAA1234A1Z5" />
                  </div>
                  <div>
                    <Label>PAN</Label>
                    <Input value={pan} onChange={(e) => setPan(e.target.value)} placeholder="AAAAA1234A" />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Business address" />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Contact Details (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="col-span-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLedgerDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLedger}>{editingLedger ? 'Update' : 'Create'} Ledger</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
