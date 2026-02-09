import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { TrendingUp, TrendingDown, Download, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';

interface Ledger {
  id: string;
  name: string;
  group_id: string;
  group_name: string;
  current_balance: number;
}

interface OutstandingItem {
  ledger_id: string;
  ledger_name: string;
  outstanding_amount: number;
  age_days: number;
  last_transaction_date: string;
}

export function OutstandingReports() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgersData, vouchersData] = await Promise.all([
        api.getAccountLedgers(),
        api.getVouchers(),
      ]);
      setLedgers(ledgersData);
      setVouchers(vouchersData.filter((v: any) => v.status === 'posted'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate ledger balance with transaction details
  const calculateLedgerBalance = (ledgerId: string) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    if (!ledger) return { balance: 0, lastDate: null };

    let balance = ledger.current_balance || 0;
    let lastDate: string | null = null;

    const ledgerVouchers = vouchers
      .filter(v => v.entries.some((e: any) => e.ledger_id === ledgerId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (ledgerVouchers.length > 0) {
      lastDate = ledgerVouchers[0].date;
    }

    return { balance, lastDate };
  };

  const getAgeDays = (lastDate: string | null) => {
    if (!lastDate) return 0;
    const diff = Date.now() - new Date(lastDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Accounts Receivable (Sundry Debtors)
  const getReceivables = (): OutstandingItem[] => {
    const debtorLedgers = ledgers.filter(l => 
      l.group_name?.toLowerCase().includes('debtor') || 
      l.group_name?.toLowerCase().includes('receivable')
    );

    const receivables: OutstandingItem[] = [];

    for (const ledger of debtorLedgers) {
      const { balance, lastDate } = calculateLedgerBalance(ledger.id);
      
      if (balance > 0) {
        receivables.push({
          ledger_id: ledger.id,
          ledger_name: ledger.name,
          outstanding_amount: balance,
          age_days: getAgeDays(lastDate),
          last_transaction_date: lastDate || 'N/A',
        });
      }
    }

    return receivables.sort((a, b) => b.outstanding_amount - a.outstanding_amount);
  };

  // Accounts Payable (Sundry Creditors)
  const getPayables = (): OutstandingItem[] => {
    const creditorLedgers = ledgers.filter(l => 
      l.group_name?.toLowerCase().includes('creditor') || 
      l.group_name?.toLowerCase().includes('payable')
    );

    const payables: OutstandingItem[] = [];

    for (const ledger of creditorLedgers) {
      const { balance, lastDate } = calculateLedgerBalance(ledger.id);
      
      if (balance < 0) {
        payables.push({
          ledger_id: ledger.id,
          ledger_name: ledger.name,
          outstanding_amount: Math.abs(balance),
          age_days: getAgeDays(lastDate),
          last_transaction_date: lastDate || 'N/A',
        });
      }
    }

    return payables.sort((a, b) => b.outstanding_amount - a.outstanding_amount);
  };

  const getAgeingBucket = (days: number) => {
    if (days <= 30) return '0-30 days';
    if (days <= 60) return '31-60 days';
    if (days <= 90) return '61-90 days';
    return '90+ days';
  };

  const getAgeingColor = (days: number) => {
    if (days <= 30) return 'bg-green-100 text-green-800';
    if (days <= 60) return 'bg-yellow-100 text-yellow-800';
    if (days <= 90) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const receivables = getReceivables();
  const payables = getPayables();

  const totalReceivables = receivables.reduce((sum, r) => sum + r.outstanding_amount, 0);
  const totalPayables = payables.reduce((sum, p) => sum + p.outstanding_amount, 0);
  const netPosition = totalReceivables - totalPayables;

  // Export to Excel function
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Receivables Sheet
      const receivablesExport = receivables.map(item => ({
        'Party Name': item.ledger_name,
        'Outstanding Amount': item.outstanding_amount.toFixed(2),
        'Age (Days)': item.age_days,
        'Ageing Bucket': getAgeingBucket(item.age_days),
        'Last Transaction': item.last_transaction_date !== 'N/A' 
          ? new Date(item.last_transaction_date).toLocaleDateString() 
          : 'N/A'
      }));
      const receivablesSheet = XLSX.utils.json_to_sheet(receivablesExport);
      XLSX.utils.book_append_sheet(wb, receivablesSheet, 'Receivables');

      // Payables Sheet
      const payablesExport = payables.map(item => ({
        'Party Name': item.ledger_name,
        'Outstanding Amount': item.outstanding_amount.toFixed(2),
        'Age (Days)': item.age_days,
        'Ageing Bucket': getAgeingBucket(item.age_days),
        'Last Transaction': item.last_transaction_date !== 'N/A' 
          ? new Date(item.last_transaction_date).toLocaleDateString() 
          : 'N/A'
      }));
      const payablesSheet = XLSX.utils.json_to_sheet(payablesExport);
      XLSX.utils.book_append_sheet(wb, payablesSheet, 'Payables');

      // Summary Sheet
      const summaryExport = [
        {
          'Metric': 'Total Receivables',
          'Amount (₹)': totalReceivables.toFixed(2),
          'Count': receivables.length
        },
        {
          'Metric': 'Total Payables',
          'Amount (₹)': totalPayables.toFixed(2),
          'Count': payables.length
        },
        {
          'Metric': 'Net Position',
          'Amount (₹)': netPosition.toFixed(2),
          'Count': ''
        }
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryExport);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Download
      const filename = `Outstanding_Reports_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('Outstanding reports exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export reports');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading outstanding reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Outstanding Reports</h2>
          <p className="text-gray-600">Track receivables and payables</p>
        </div>
        <Button variant="outline" onClick={() => exportToExcel()}>
          <Download className="size-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Receivables</div>
            <TrendingUp className="size-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600">₹{totalReceivables.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">{receivables.length} parties</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Payables</div>
            <TrendingDown className="size-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">₹{totalPayables.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">{payables.length} parties</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Net Position</div>
            <AlertCircle className="size-5 text-blue-600" />
          </div>
          <div className={`text-3xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netPosition >= 0 ? '+' : ''}₹{netPosition.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {netPosition >= 0 ? 'Net Receivable' : 'Net Payable'}
          </div>
        </Card>
      </div>

      {/* Outstanding Tabs */}
      <Tabs defaultValue="receivables" className="space-y-4">
        <TabsList className="grid grid-cols-2 gap-4">
          <TabsTrigger value="receivables" className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Accounts Receivable
            <Badge>{receivables.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="payables" className="flex items-center gap-2">
            <TrendingDown className="size-4" />
            Accounts Payable
            <Badge>{payables.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Receivables */}
        <TabsContent value="receivables">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Accounts Receivable (Debtors)</h3>
              <p className="text-sm text-gray-600">Outstanding amounts to be received from customers</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Party Name</th>
                    <th className="text-right p-3">Outstanding Amount</th>
                    <th className="text-center p-3">Age</th>
                    <th className="text-center p-3">Ageing Bucket</th>
                    <th className="text-left p-3">Last Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-500">
                        No outstanding receivables
                      </td>
                    </tr>
                  ) : (
                    receivables.map((item) => (
                      <tr key={item.ledger_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.ledger_name}</td>
                        <td className="p-3 text-right font-bold text-green-600">
                          ₹{item.outstanding_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">{item.age_days} days</td>
                        <td className="p-3 text-center">
                          <Badge className={getAgeingColor(item.age_days)}>
                            {getAgeingBucket(item.age_days)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {item.last_transaction_date !== 'N/A'
                            ? new Date(item.last_transaction_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {receivables.length > 0 && (
                  <tfoot className="bg-green-50 font-bold">
                    <tr>
                      <td className="p-3">Total Receivables</td>
                      <td className="p-3 text-right text-green-600 text-lg">
                        ₹{totalReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Ageing Analysis */}
            {receivables.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Ageing Analysis</h4>
                <div className="grid grid-cols-4 gap-4">
                  {['0-30 days', '31-60 days', '61-90 days', '90+ days'].map((bucket) => {
                    const items = receivables.filter((r) => getAgeingBucket(r.age_days) === bucket);
                    const total = items.reduce((sum, r) => sum + r.outstanding_amount, 0);
                    
                    return (
                      <Card key={bucket} className="p-4">
                        <div className="text-sm text-gray-600 mb-1">{bucket}</div>
                        <div className="text-xl font-bold">₹{total.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{items.length} parties</div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Payables */}
        <TabsContent value="payables">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Accounts Payable (Creditors)</h3>
              <p className="text-sm text-gray-600">Outstanding amounts to be paid to suppliers</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Party Name</th>
                    <th className="text-right p-3">Outstanding Amount</th>
                    <th className="text-center p-3">Age</th>
                    <th className="text-center p-3">Ageing Bucket</th>
                    <th className="text-left p-3">Last Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {payables.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-gray-500">
                        No outstanding payables
                      </td>
                    </tr>
                  ) : (
                    payables.map((item) => (
                      <tr key={item.ledger_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.ledger_name}</td>
                        <td className="p-3 text-right font-bold text-red-600">
                          ₹{item.outstanding_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">{item.age_days} days</td>
                        <td className="p-3 text-center">
                          <Badge className={getAgeingColor(item.age_days)}>
                            {getAgeingBucket(item.age_days)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {item.last_transaction_date !== 'N/A'
                            ? new Date(item.last_transaction_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {payables.length > 0 && (
                  <tfoot className="bg-red-50 font-bold">
                    <tr>
                      <td className="p-3">Total Payables</td>
                      <td className="p-3 text-right text-red-600 text-lg">
                        ₹{totalPayables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Ageing Analysis */}
            {payables.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Ageing Analysis</h4>
                <div className="grid grid-cols-4 gap-4">
                  {['0-30 days', '31-60 days', '61-90 days', '90+ days'].map((bucket) => {
                    const items = payables.filter((p) => getAgeingBucket(p.age_days) === bucket);
                    const total = items.reduce((sum, p) => sum + p.outstanding_amount, 0);
                    
                    return (
                      <Card key={bucket} className="p-4">
                        <div className="text-sm text-gray-600 mb-1">{bucket}</div>
                        <div className="text-xl font-bold">₹{total.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{items.length} parties</div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}