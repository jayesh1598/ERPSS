import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { 
  Building2, 
  Upload, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  FileText,
  Plus,
  Check,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface Ledger {
  id: string;
  name: string;
  group_name: string;
  account_number?: string;
  bank_name?: string;
  current_balance: number;
}

interface BankStatement {
  id: string;
  bank_ledger_id: string;
  date: string;
  transaction_date: string;
  description: string;
  reference_number: string;
  debit: number;
  credit: number;
  balance: number;
  reconciled: boolean;
  voucher_id?: string;
}

interface BookEntry {
  id: string;
  voucher_number: string;
  date: string;
  ledger_id: string;
  description: string;
  debit: number;
  credit: number;
  reconciled: boolean;
  statement_id?: string;
}

export function BankReconciliation() {
  const [bankLedgers, setBankLedgers] = useState<Ledger[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [bookEntries, setBookEntries] = useState<BookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Bank Statement Entry Form
  const [showStatementForm, setShowStatementForm] = useState(false);
  const [statementForm, setStatementForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference_number: '',
    debit: 0,
    credit: 0,
    balance: 0,
  });

  // Reconciliation State
  const [selectedStatements, setSelectedStatements] = useState<Set<string>>(new Set());
  const [selectedBookEntries, setSelectedBookEntries] = useState<Set<string>>(new Set());

  // Date Range
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadBankLedgers();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      loadData();
    }
  }, [selectedBank, startDate, endDate]);

  const loadBankLedgers = async () => {
    try {
      setLoading(true);
      const ledgersData = await api.getAccountLedgers();
      const banks = ledgersData.filter((l: Ledger) =>
        l.group_name?.toLowerCase().includes('bank')
      );
      setBankLedgers(banks);
      if (banks.length > 0 && !selectedBank) {
        setSelectedBank(banks[0].id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load bank ledgers');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Load bank statements and book entries
      const [statementsData, vouchersData] = await Promise.all([
        api.getBankStatements(selectedBank, startDate, endDate),
        api.getVouchers(),
      ]);

      setStatements(statementsData || []);

      // Extract book entries for selected bank from vouchers
      const entries: BookEntry[] = [];
      for (const voucher of vouchersData) {
        if (voucher.status !== 'posted') continue;

        const voucherDate = new Date(voucher.date);
        if (voucherDate < new Date(startDate) || voucherDate > new Date(endDate)) continue;

        for (let entryIndex = 0; entryIndex < voucher.entries.length; entryIndex++) {
          const entry = voucher.entries[entryIndex];
          if (entry.ledger_id === selectedBank) {
            entries.push({
              id: `${voucher.id}-${entry.ledger_id}-${entryIndex}`,
              voucher_number: voucher.voucher_number,
              date: voucher.date,
              ledger_id: entry.ledger_id,
              description: `${voucher.voucher_type} - ${voucher.narration || ''}`,
              debit: entry.type === 'debit' ? entry.amount : 0,
              credit: entry.type === 'credit' ? entry.amount : 0,
              reconciled: false,
              statement_id: undefined,
            });
          }
        }
      }
      setBookEntries(entries);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatement = async () => {
    try {
      if (!selectedBank) {
        toast.error('Please select a bank account');
        return;
      }

      if (!statementForm.description) {
        toast.error('Description is required');
        return;
      }

      if (statementForm.debit === 0 && statementForm.credit === 0) {
        toast.error('Either debit or credit amount is required');
        return;
      }

      const newStatement = {
        bank_ledger_id: selectedBank,
        transaction_date: statementForm.date,
        description: statementForm.description,
        reference_number: statementForm.reference_number,
        debit: statementForm.debit,
        credit: statementForm.credit,
        balance: statementForm.balance,
        reconciled: false,
      };

      await api.createBankStatement(newStatement);

      toast.success('Bank statement entry added');
      setShowStatementForm(false);
      setStatementForm({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference_number: '',
        debit: 0,
        credit: 0,
        balance: 0,
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add statement entry');
    }
  };

  const handleMatchTransaction = async () => {
    try {
      if (selectedStatements.size === 0 || selectedBookEntries.size === 0) {
        toast.error('Please select at least one statement and one book entry to match');
        return;
      }

      // Verify amounts match
      const statementTotal = Array.from(selectedStatements).reduce((sum, id) => {
        const stmt = statements.find((s) => s.id === id);
        return sum + (stmt ? stmt.credit - stmt.debit : 0);
      }, 0);

      const bookTotal = Array.from(selectedBookEntries).reduce((sum, id) => {
        const entry = bookEntries.find((e) => e.id === id);
        return sum + (entry ? entry.credit - entry.debit : 0);
      }, 0);

      if (Math.abs(statementTotal - bookTotal) > 0.01) {
        toast.error(
          `Amounts do not match: Statement ₹${statementTotal.toFixed(2)} vs Book ₹${bookTotal.toFixed(2)}`
        );
        return;
      }

      // Mark as reconciled
      for (const stmtId of selectedStatements) {
        await api.updateBankStatement(stmtId, { reconciled: true });
      }

      toast.success('Transactions matched and reconciled');
      setSelectedStatements(new Set());
      setSelectedBookEntries(new Set());
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to match transactions');
    }
  };

  const handleUnmatch = async (statementId: string) => {
    try {
      await api.updateBankStatement(statementId, { reconciled: false });
      toast.success('Transaction unmatched');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to unmatch transaction');
    }
  };

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import Statement from Excel/CSV
  const handleImportStatement = () => {
    if (!selectedBank) {
      toast.error('Please select a bank account first');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('No data found in file');
        return;
      }

      // Expected columns: Date, Description, Reference, Debit, Credit, Balance
      let imported = 0;
      for (const row of jsonData) {
        try {
          const newStatement = {
            bank_ledger_id: selectedBank,
            transaction_date: row.Date || row.date || new Date().toISOString().split('T')[0],
            description: row.Description || row.description || '',
            reference_number: row.Reference || row.reference || '',
            debit: parseFloat(row.Debit || row.debit || 0),
            credit: parseFloat(row.Credit || row.credit || 0),
            balance: parseFloat(row.Balance || row.balance || 0),
            reconciled: false,
          };

          await api.createBankStatement(newStatement);
          imported++;
        } catch (error) {
          console.error('Error importing row:', error);
        }
      }

      toast.success(`Successfully imported ${imported} statement entries`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to import file');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Export Reconciliation Report to Excel
  const handleExportReport = () => {
    if (!selectedBank) {
      toast.error('Please select a bank account first');
      return;
    }

    try {
      // Prepare report data
      const reportData = {
        'Bank Account': selectedBankLedger?.name || '',
        'Period': `${startDate} to ${endDate}`,
        'Book Balance': bookBalance.toFixed(2),
        'Statement Balance': statementBalance.toFixed(2),
        'Difference': difference.toFixed(2),
        'Status': difference < 0.01 ? 'Reconciled' : 'Not Reconciled',
      };

      const summarySheet = XLSX.utils.json_to_sheet([reportData]);

      // Bank Statements
      const statementsData = statements.map((stmt) => ({
        Date: new Date(stmt.transaction_date).toLocaleDateString(),
        Description: stmt.description,
        Reference: stmt.reference_number,
        Debit: stmt.debit,
        Credit: stmt.credit,
        Balance: stmt.balance,
        Status: stmt.reconciled ? 'Reconciled' : 'Unreconciled',
      }));
      const statementsSheet = XLSX.utils.json_to_sheet(statementsData);

      // Book Entries
      const bookEntriesData = bookEntries.map((entry) => ({
        Date: new Date(entry.date).toLocaleDateString(),
        Voucher: entry.voucher_number,
        Description: entry.description,
        Debit: entry.debit,
        Credit: entry.credit,
        Status: entry.reconciled ? 'Reconciled' : 'Unreconciled',
      }));
      const bookEntriesSheet = XLSX.utils.json_to_sheet(bookEntriesData);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      XLSX.utils.book_append_sheet(wb, statementsSheet, 'Bank Statements');
      XLSX.utils.book_append_sheet(wb, bookEntriesSheet, 'Book Entries');

      // Generate filename
      const filename = `Bank_Reconciliation_${selectedBankLedger?.name?.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast.success('Reconciliation report exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export report');
    }
  };

  const selectedBankLedger = bankLedgers.find((b) => b.id === selectedBank);

  // Calculate statistics
  const totalStatements = statements.length;
  const reconciledStatements = statements.filter((s) => s.reconciled).length;
  const unreconciledStatements = totalStatements - reconciledStatements;

  const totalBookEntries = bookEntries.length;
  const reconciledBookEntries = bookEntries.filter((e) => e.reconciled).length;
  const unreconciledBookEntries = totalBookEntries - reconciledBookEntries;

  const bookBalance = bookEntries.reduce((sum, e) => sum + e.credit - e.debit, 0);
  const statementBalance = statements.reduce((sum, s) => sum + s.credit - s.debit, 0);
  const difference = Math.abs(bookBalance - statementBalance);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading bank reconciliation...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for importing statements */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank Reconciliation</h2>
          <p className="text-gray-600">Match bank statements with book entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportStatement}>
            <Upload className="size-4 mr-2" />
            Import Statement
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="size-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Bank Selection & Date Range */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <Label>Bank Account</Label>
            <select
              className="w-full p-2 border rounded"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              <option value="">Select Bank Account</option>
              {bankLedgers.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                  {bank.account_number && ` - ${bank.account_number}`}
                  {bank.bank_name && ` (${bank.bank_name})`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {!selectedBank ? (
        <Card className="p-8 text-center">
          <Building2 className="size-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">Please select a bank account to start reconciliation</p>
        </Card>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Book Balance</div>
              <div className="text-2xl font-bold">₹{bookBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-gray-500 mt-1">{selectedBankLedger?.name}</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Statement Balance</div>
              <div className="text-2xl font-bold">₹{statementBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-gray-500 mt-1">As per bank</div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Difference</div>
              <div className={`text-2xl font-bold ${difference < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {difference < 0.01 ? 'Reconciled ✓' : 'Not Reconciled'}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">Reconciliation Status</div>
              <div className="text-2xl font-bold">
                {reconciledStatements}/{totalStatements}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {totalStatements > 0 ? Math.round((reconciledStatements / totalStatements) * 100) : 0}% Complete
              </div>
            </Card>
          </div>

          {/* Alert for differences */}
          {difference >= 0.01 && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="size-5" />
                <div>
                  <div className="font-semibold">Reconciliation Difference Found</div>
                  <div className="text-sm">
                    There is a difference of ₹{difference.toFixed(2)} between book and statement. Please review unreconciled transactions.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Reconciliation Interface */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bank Statement Side */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="size-5 text-blue-600" />
                    Bank Statement
                  </h3>
                  <p className="text-sm text-gray-600">
                    {unreconciledStatements} unreconciled
                  </p>
                </div>
                <Button size="sm" onClick={() => setShowStatementForm(!showStatementForm)}>
                  <Plus className="size-4 mr-1" />
                  Add Entry
                </Button>
              </div>

              {/* Add Statement Form */}
              {showStatementForm && (
                <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
                  <h4 className="font-semibold mb-3">New Statement Entry</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={statementForm.date}
                        onChange={(e) =>
                          setStatementForm({ ...statementForm, date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={statementForm.description}
                        onChange={(e) =>
                          setStatementForm({ ...statementForm, description: e.target.value })
                        }
                        placeholder="Transaction description"
                      />
                    </div>
                    <div>
                      <Label>Reference Number</Label>
                      <Input
                        value={statementForm.reference_number}
                        onChange={(e) =>
                          setStatementForm({ ...statementForm, reference_number: e.target.value })
                        }
                        placeholder="Cheque/UTR number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Debit (Withdrawal)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={statementForm.debit || ''}
                          onChange={(e) =>
                            setStatementForm({ ...statementForm, debit: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div>
                        <Label>Credit (Deposit)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={statementForm.credit || ''}
                          onChange={(e) =>
                            setStatementForm({ ...statementForm, credit: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={statementForm.balance || ''}
                        onChange={(e) =>
                          setStatementForm({ ...statementForm, balance: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddStatement} size="sm">
                        <Check className="size-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowStatementForm(false)}
                      >
                        <X className="size-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Statement List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {statements.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No bank statement entries. Click "Add Entry" to start.
                  </div>
                ) : (
                  statements.map((stmt) => (
                    <Card
                      key={stmt.id}
                      className={`p-3 cursor-pointer border-2 transition ${
                        stmt.reconciled
                          ? 'bg-green-50 border-green-200'
                          : selectedStatements.has(stmt.id)
                          ? 'bg-blue-50 border-blue-400'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (!stmt.reconciled) {
                          const newSet = new Set(selectedStatements);
                          if (newSet.has(stmt.id)) {
                            newSet.delete(stmt.id);
                          } else {
                            newSet.add(stmt.id);
                          }
                          setSelectedStatements(newSet);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {new Date(stmt.transaction_date).toLocaleDateString()}
                            </span>
                            {stmt.reconciled && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="size-3 mr-1" />
                                Matched
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">{stmt.description}</div>
                          {stmt.reference_number && (
                            <div className="text-xs text-gray-500 mt-1">
                              Ref: {stmt.reference_number}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {stmt.debit > 0 && (
                            <div className="text-red-600 font-semibold">
                              -₹{stmt.debit.toLocaleString()}
                            </div>
                          )}
                          {stmt.credit > 0 && (
                            <div className="text-green-600 font-semibold">
                              +₹{stmt.credit.toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Bal: ₹{stmt.balance.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {stmt.reconciled && (
                        <div className="mt-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnmatch(stmt.id);
                            }}
                          >
                            <X className="size-3 mr-1" />
                            Unmatch
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </Card>

            {/* Book Entries Side */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="size-5 text-purple-600" />
                    Book Entries
                  </h3>
                  <p className="text-sm text-gray-600">
                    {unreconciledBookEntries} unreconciled
                  </p>
                </div>
              </div>

              {/* Book Entries List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bookEntries.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    No book entries found for this period
                  </div>
                ) : (
                  bookEntries.map((entry) => (
                    <Card
                      key={entry.id}
                      className={`p-3 cursor-pointer border-2 transition ${
                        entry.reconciled
                          ? 'bg-green-50 border-green-200'
                          : selectedBookEntries.has(entry.id)
                          ? 'bg-purple-50 border-purple-400'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (!entry.reconciled) {
                          const newSet = new Set(selectedBookEntries);
                          if (newSet.has(entry.id)) {
                            newSet.delete(entry.id);
                          } else {
                            newSet.add(entry.id);
                          }
                          setSelectedBookEntries(newSet);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                            {entry.reconciled && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="size-3 mr-1" />
                                Matched
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">{entry.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Voucher: {entry.voucher_number}
                          </div>
                        </div>
                        <div className="text-right">
                          {entry.debit > 0 && (
                            <div className="text-red-600 font-semibold">
                              -₹{entry.debit.toLocaleString()}
                            </div>
                          )}
                          {entry.credit > 0 && (
                            <div className="text-green-600 font-semibold">
                              +₹{entry.credit.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Match Button */}
          {(selectedStatements.size > 0 || selectedBookEntries.size > 0) && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    Selected: {selectedStatements.size} statement(s) and {selectedBookEntries.size} book entry(ies)
                  </div>
                  <div className="text-sm text-gray-600">
                    Click "Match & Reconcile" to mark these transactions as reconciled
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedStatements(new Set());
                      setSelectedBookEntries(new Set());
                    }}
                  >
                    <X className="size-4 mr-1" />
                    Clear Selection
                  </Button>
                  <Button onClick={handleMatchTransaction}>
                    <Check className="size-4 mr-1" />
                    Match & Reconcile
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Reconciliation Summary */}
          {difference < 0.01 && totalStatements > 0 && (
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-green-600" />
                <div>
                  <div className="font-semibold text-green-900">
                    Bank Reconciliation Complete!
                  </div>
                  <div className="text-sm text-green-700">
                    All transactions have been successfully reconciled. Book balance matches statement balance.
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}