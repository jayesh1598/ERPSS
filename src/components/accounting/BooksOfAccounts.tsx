import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  BookOpen, 
  Banknote, 
  Building2, 
  FileText, 
  Download,
  Search,
  Eye,
  Calendar
} from 'lucide-react';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';

interface VoucherEntry {
  ledger_id: string;
  ledger_name: string;
  type: 'debit' | 'credit';
  amount: number;
}

interface Voucher {
  id: string;
  voucher_type: string;
  voucher_number: string;
  date: string;
  reference_number?: string;
  entries: VoucherEntry[];
  total_amount: number;
  narration?: string;
  status: string;
}

interface Ledger {
  id: string;
  name: string;
  group_name?: string;
  current_balance: number;
  is_bank_account: boolean;
}

export function BooksOfAccounts() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLedger, setSelectedLedger] = useState('');

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
      setVouchers(vouchersData.filter((v: Voucher) => v.status !== 'cancelled'));
      setLedgers(ledgersData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Filter vouchers by date range
  const getFilteredVouchers = () => {
    return vouchers.filter((v) => {
      const voucherDate = new Date(v.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      
      if (voucherDate < start || voucherDate > end) return false;
      
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          v.voucher_number.toLowerCase().includes(search) ||
          v.narration?.toLowerCase().includes(search) ||
          v.entries.some(e => e.ledger_name.toLowerCase().includes(search))
        );
      }
      
      return true;
    });
  };

  // Day Book - All transactions
  const getDayBookEntries = () => {
    const filtered = getFilteredVouchers();
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Cash Book - Only cash transactions
  const getCashBookEntries = () => {
    const cashLedgers = ledgers.filter(l => 
      l.name.toLowerCase().includes('cash') || 
      l.group_name?.toLowerCase().includes('cash')
    );
    const cashLedgerIds = cashLedgers.map(l => l.id);
    
    return getFilteredVouchers().filter(v =>
      v.entries.some(e => cashLedgerIds.includes(e.ledger_id))
    );
  };

  // Bank Book - Only bank transactions
  const getBankBookEntries = () => {
    const bankLedgers = ledgers.filter(l => l.is_bank_account);
    const bankLedgerIds = bankLedgers.map(l => l.id);
    
    return getFilteredVouchers().filter(v =>
      v.entries.some(e => bankLedgerIds.includes(e.ledger_id))
    );
  };

  // Ledger Book - Specific ledger transactions
  const getLedgerBookEntries = () => {
    if (!selectedLedger) return [];
    
    const entries: any[] = [];
    let runningBalance = 0;
    
    // Get ledger opening balance
    const ledger = ledgers.find(l => l.id === selectedLedger);
    if (ledger) {
      runningBalance = ledger.current_balance;
      // Subtract all transactions to get opening balance
      const allLedgerVouchers = vouchers.filter(v =>
        v.entries.some(e => e.ledger_id === selectedLedger)
      );
      
      for (const voucher of allLedgerVouchers) {
        for (const entry of voucher.entries) {
          if (entry.ledger_id === selectedLedger) {
            if (entry.type === 'debit') {
              runningBalance -= entry.amount;
            } else {
              runningBalance += entry.amount;
            }
          }
        }
      }
    }
    
    // Add opening balance entry
    entries.push({
      id: 'opening',
      date: startDate,
      particulars: 'Opening Balance',
      voucher_number: '-',
      debit: runningBalance > 0 ? runningBalance : 0,
      credit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      balance: runningBalance,
    });
    
    // Add all transactions
    const filtered = getFilteredVouchers().filter(v =>
      v.entries.some(e => e.ledger_id === selectedLedger)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (const voucher of filtered) {
      const entry = voucher.entries.find(e => e.ledger_id === selectedLedger);
      if (!entry) continue;
      
      const otherEntries = voucher.entries.filter(e => e.ledger_id !== selectedLedger);
      const particulars = otherEntries.map(e => e.ledger_name).join(', ') || 'Multiple';
      
      if (entry.type === 'debit') {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }
      
      entries.push({
        id: voucher.id,
        date: voucher.date,
        particulars,
        voucher_number: voucher.voucher_number,
        voucher_type: voucher.voucher_type,
        debit: entry.type === 'debit' ? entry.amount : 0,
        credit: entry.type === 'credit' ? entry.amount : 0,
        balance: runningBalance,
        narration: voucher.narration,
      });
    }
    
    // Add closing balance
    entries.push({
      id: 'closing',
      date: endDate,
      particulars: 'Closing Balance',
      voucher_number: '-',
      debit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      credit: runningBalance > 0 ? runningBalance : 0,
      balance: runningBalance,
    });
    
    return entries;
  };

  const getVoucherTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      payment: 'bg-red-100 text-red-800',
      receipt: 'bg-green-100 text-green-800',
      journal: 'bg-purple-100 text-purple-800',
      contra: 'bg-yellow-100 text-yellow-800',
      sales: 'bg-blue-100 text-blue-800',
      purchase: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading books...</div>
      </div>
    );
  }

  const dayBookData = getDayBookEntries();
  const cashBookData = getCashBookEntries();
  const bankBookData = getBankBookEntries();
  const ledgerBookData = getLedgerBookEntries();

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      // Day Book Sheet
      const dayBookExport = dayBookData.map((voucher) => ({
        Date: new Date(voucher.date).toLocaleDateString(),
        'Voucher No': voucher.voucher_number,
        Type: voucher.voucher_type,
        Particulars: voucher.entries.map((e: VoucherEntry) => e.ledger_name).join(', '),
        Narration: voucher.narration || '',
        Debit: voucher.entries.filter((e: VoucherEntry) => e.type === 'debit').reduce((sum: number, e: VoucherEntry) => sum + e.amount, 0),
        Credit: voucher.entries.filter((e: VoucherEntry) => e.type === 'credit').reduce((sum: number, e: VoucherEntry) => sum + e.amount, 0),
      }));

      // Cash Book Sheet
      const cashBookExport = cashBookData.map((voucher) => {
        const cashEntry = voucher.entries.find((e: VoucherEntry) => e.ledger_name.toLowerCase().includes('cash'));
        const otherEntries = voucher.entries.filter((e: VoucherEntry) => e.ledger_id !== cashEntry?.ledger_id);
        return {
          Date: new Date(voucher.date).toLocaleDateString(),
          'Voucher No': voucher.voucher_number,
          Particulars: otherEntries.map((e: VoucherEntry) => e.ledger_name).join(', '),
          Receipt: cashEntry?.type === 'debit' ? cashEntry.amount : 0,
          Payment: cashEntry?.type === 'credit' ? cashEntry.amount : 0,
        };
      });

      // Bank Book Sheet
      const bankBookExport = bankBookData.map((voucher) => {
        const bankEntry = voucher.entries.find((e: VoucherEntry) => ledgers.find(l => l.id === e.ledger_id)?.is_bank_account);
        const otherEntries = voucher.entries.filter((e: VoucherEntry) => e.ledger_id !== bankEntry?.ledger_id);
        return {
          Date: new Date(voucher.date).toLocaleDateString(),
          'Voucher No': voucher.voucher_number,
          Bank: bankEntry?.ledger_name || '',
          Particulars: otherEntries.map((e: VoucherEntry) => e.ledger_name).join(', '),
          Deposit: bankEntry?.type === 'debit' ? bankEntry.amount : 0,
          Withdrawal: bankEntry?.type === 'credit' ? bankEntry.amount : 0,
        };
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      if (dayBookExport.length > 0) {
        const dayBookSheet = XLSX.utils.json_to_sheet(dayBookExport);
        XLSX.utils.book_append_sheet(wb, dayBookSheet, 'Day Book');
      }
      
      if (cashBookExport.length > 0) {
        const cashBookSheet = XLSX.utils.json_to_sheet(cashBookExport);
        XLSX.utils.book_append_sheet(wb, cashBookSheet, 'Cash Book');
      }
      
      if (bankBookExport.length > 0) {
        const bankBookSheet = XLSX.utils.json_to_sheet(bankBookExport);
        XLSX.utils.book_append_sheet(wb, bankBookSheet, 'Bank Book');
      }

      // Ledger Book if selected
      if (selectedLedger && ledgerBookData.length > 0) {
        const ledgerName = ledgers.find(l => l.id === selectedLedger)?.name || 'Ledger';
        const ledgerExport = ledgerBookData.map((entry) => ({
          Date: new Date(entry.date).toLocaleDateString(),
          Particulars: entry.particulars,
          'Voucher No': entry.voucher_number,
          Debit: entry.debit,
          Credit: entry.credit,
          Balance: entry.balance,
        }));
        const ledgerSheet = XLSX.utils.json_to_sheet(ledgerExport);
        XLSX.utils.book_append_sheet(wb, ledgerSheet, ledgerName.substring(0, 31)); // Excel sheet name limit
      }

      // Generate filename
      const filename = `Books_of_Accounts_${startDate}_to_${endDate}.xlsx`;
      
      // Download
      XLSX.writeFile(wb, filename);
      
      toast.success('Books exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export books');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Books of Accounts</h2>
          <p className="text-gray-600">View all accounting books and registers</p>
        </div>
        <Button variant="outline" onClick={handleExportToExcel}>
          <Download className="size-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div>
            <Label>From Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>To Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vouchers..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Button onClick={loadData} variant="outline">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Books Tabs */}
      <Tabs defaultValue="day-book" className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="day-book" className="flex items-center gap-2">
            <BookOpen className="size-4" />
            Day Book
          </TabsTrigger>
          <TabsTrigger value="cash-book" className="flex items-center gap-2">
            <Banknote className="size-4" />
            Cash Book
          </TabsTrigger>
          <TabsTrigger value="bank-book" className="flex items-center gap-2">
            <Building2 className="size-4" />
            Bank Book
          </TabsTrigger>
          <TabsTrigger value="ledger-book" className="flex items-center gap-2">
            <FileText className="size-4" />
            Ledger Book
          </TabsTrigger>
        </TabsList>

        {/* Day Book */}
        <TabsContent value="day-book">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Day Book</h3>
              <Badge>{dayBookData.length} entries</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Voucher No.</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Particulars</th>
                    <th className="text-right p-2">Debit</th>
                    <th className="text-right p-2">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {dayBookData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No transactions found for the selected period
                      </td>
                    </tr>
                  ) : (
                    dayBookData.map((voucher) => (
                      <tr key={voucher.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(voucher.date).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">{voucher.voucher_number}</td>
                        <td className="p-2">
                          <Badge className={getVoucherTypeColor(voucher.voucher_type)}>
                            {voucher.voucher_type}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="space-y-1">
                            {voucher.entries.map((entry: VoucherEntry, idx: number) => (
                              <div key={idx}>
                                <span className="font-medium">{entry.ledger_name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {entry.type === 'debit' ? 'Dr.' : 'Cr.'}
                                </span>
                              </div>
                            ))}
                            {voucher.narration && (
                              <div className="text-xs text-gray-600 italic">{voucher.narration}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-right font-semibold text-red-600">
                          {voucher.entries
                            .filter((e: VoucherEntry) => e.type === 'debit')
                            .reduce((sum: number, e: VoucherEntry) => sum + e.amount, 0)
                            .toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-semibold text-green-600">
                          {voucher.entries
                            .filter((e: VoucherEntry) => e.type === 'credit')
                            .reduce((sum: number, e: VoucherEntry) => sum + e.amount, 0)
                            .toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {dayBookData.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={4} className="p-2 text-right">
                        Total:
                      </td>
                      <td className="p-2 text-right text-red-600">
                        ₹
                        {dayBookData
                          .reduce(
                            (sum, v) =>
                              sum +
                              v.entries
                                .filter((e: VoucherEntry) => e.type === 'debit')
                                .reduce((s: number, e: VoucherEntry) => s + e.amount, 0),
                            0
                          )
                          .toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-green-600">
                        ₹
                        {dayBookData
                          .reduce(
                            (sum, v) =>
                              sum +
                              v.entries
                                .filter((e: VoucherEntry) => e.type === 'credit')
                                .reduce((s: number, e: VoucherEntry) => s + e.amount, 0),
                            0
                          )
                          .toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Cash Book */}
        <TabsContent value="cash-book">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cash Book</h3>
              <Badge>{cashBookData.length} entries</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Voucher No.</th>
                    <th className="text-left p-2">Particulars</th>
                    <th className="text-right p-2">Receipt</th>
                    <th className="text-right p-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {cashBookData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-500">
                        No cash transactions found
                      </td>
                    </tr>
                  ) : (
                    cashBookData.map((voucher) => {
                      const cashEntry = voucher.entries.find(
                        (e: VoucherEntry) =>
                          e.ledger_name.toLowerCase().includes('cash')
                      );
                      const otherEntries = voucher.entries.filter(
                        (e: VoucherEntry) => e.ledger_id !== cashEntry?.ledger_id
                      );

                      return (
                        <tr key={voucher.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{new Date(voucher.date).toLocaleDateString()}</td>
                          <td className="p-2 font-medium">{voucher.voucher_number}</td>
                          <td className="p-2">{otherEntries.map((e: VoucherEntry) => e.ledger_name).join(', ')}</td>
                          <td className="p-2 text-right font-semibold text-green-600">
                            {cashEntry?.type === 'debit' ? `₹${cashEntry.amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2 text-right font-semibold text-red-600">
                            {cashEntry?.type === 'credit' ? `₹${cashEntry.amount.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Bank Book */}
        <TabsContent value="bank-book">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Bank Book</h3>
              <Badge>{bankBookData.length} entries</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Voucher No.</th>
                    <th className="text-left p-2">Bank</th>
                    <th className="text-left p-2">Particulars</th>
                    <th className="text-right p-2">Deposit</th>
                    <th className="text-right p-2">Withdrawal</th>
                  </tr>
                </thead>
                <tbody>
                  {bankBookData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No bank transactions found
                      </td>
                    </tr>
                  ) : (
                    bankBookData.map((voucher) => {
                      const bankEntry = voucher.entries.find(
                        (e: VoucherEntry) => ledgers.find(l => l.id === e.ledger_id)?.is_bank_account
                      );
                      const otherEntries = voucher.entries.filter(
                        (e: VoucherEntry) => e.ledger_id !== bankEntry?.ledger_id
                      );

                      return (
                        <tr key={voucher.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">{new Date(voucher.date).toLocaleDateString()}</td>
                          <td className="p-2 font-medium">{voucher.voucher_number}</td>
                          <td className="p-2">{bankEntry?.ledger_name}</td>
                          <td className="p-2">{otherEntries.map((e: VoucherEntry) => e.ledger_name).join(', ')}</td>
                          <td className="p-2 text-right font-semibold text-green-600">
                            {bankEntry?.type === 'debit' ? `₹${bankEntry.amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2 text-right font-semibold text-red-600">
                            {bankEntry?.type === 'credit' ? `₹${bankEntry.amount.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Ledger Book */}
        <TabsContent value="ledger-book">
          <Card className="p-6">
            <div className="mb-4">
              <Label>Select Ledger</Label>
              <Select value={selectedLedger} onValueChange={setSelectedLedger}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a ledger to view" />
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

            {selectedLedger && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {ledgers.find(l => l.id === selectedLedger)?.name} - Ledger Statement
                  </h3>
                  <Badge>{ledgerBookData.length - 2} transactions</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Particulars</th>
                        <th className="text-left p-2">Vch No.</th>
                        <th className="text-right p-2">Debit</th>
                        <th className="text-right p-2">Credit</th>
                        <th className="text-right p-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerBookData.map((entry) => (
                        <tr
                          key={entry.id}
                          className={`border-b hover:bg-gray-50 ${
                            entry.id === 'opening' || entry.id === 'closing' ? 'bg-blue-50 font-semibold' : ''
                          }`}
                        >
                          <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                          <td className="p-2">
                            {entry.particulars}
                            {entry.narration && (
                              <div className="text-xs text-gray-600 italic">{entry.narration}</div>
                            )}
                          </td>
                          <td className="p-2">{entry.voucher_number}</td>
                          <td className="p-2 text-right text-red-600">
                            {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2 text-right text-green-600">
                            {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-2 text-right font-semibold">
                            ₹{Math.abs(entry.balance).toLocaleString()}{' '}
                            <span className="text-xs">{entry.balance >= 0 ? 'Dr' : 'Cr'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!selectedLedger && (
              <div className="text-center p-8 text-gray-500">
                Select a ledger to view its statement
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}