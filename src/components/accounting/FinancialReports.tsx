import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { FileText, TrendingUp, Scale, Download, Calendar } from 'lucide-react';
import { api } from '../../lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Ledger {
  id: string;
  name: string;
  group_id: string;
  group_name: string;
  opening_balance: number;
  opening_balance_type: 'debit' | 'credit';
  current_balance: number;
}

interface AccountGroup {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'asset' | 'liability' | 'income' | 'expense' | 'capital';
  nature: 'debit' | 'credit';
}

interface Voucher {
  id: string;
  date: string;
  entries: any[];
  status: string;
}

export function FinancialReports() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]); // April 1st
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgersData, groupsData, vouchersData] = await Promise.all([
        api.getAccountLedgers(),
        api.getAccountGroups(),
        api.getVouchers(),
      ]);
      setLedgers(ledgersData);
      setGroups(groupsData);
      setVouchers(vouchersData.filter((v: Voucher) => v.status !== 'cancelled'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate ledger balance for a period
  const calculateLedgerBalance = (ledgerId: string, upToDate: string) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    if (!ledger) return 0;

    let balance = ledger.opening_balance || 0;
    if (ledger.opening_balance_type === 'credit') {
      balance = -balance;
    }

    const relevantVouchers = vouchers.filter(v => new Date(v.date) <= new Date(upToDate));
    
    for (const voucher of relevantVouchers) {
      for (const entry of voucher.entries) {
        if (entry.ledger_id === ledgerId) {
          if (entry.type === 'debit') {
            balance += entry.amount;
          } else {
            balance -= entry.amount;
          }
        }
      }
    }

    return balance;
  };

  // Trial Balance calculation
  const getTrialBalance = () => {
    const trialBalance: any[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    for (const ledger of ledgers) {
      const balance = calculateLedgerBalance(ledger.id, endDate);
      
      if (Math.abs(balance) < 0.01) continue; // Skip zero balances

      const entry = {
        ledger_id: ledger.id,
        ledger_name: ledger.name,
        group_name: ledger.group_name,
        debit: balance > 0 ? balance : 0,
        credit: balance < 0 ? Math.abs(balance) : 0,
      };

      trialBalance.push(entry);
      totalDebit += entry.debit;
      totalCredit += entry.credit;
    }

    return { entries: trialBalance, totalDebit, totalCredit };
  };

  // Profit & Loss calculation
  const getProfitLoss = () => {
    const income: any[] = [];
    const expenses: any[] = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const ledger of ledgers) {
      const group = groups.find(g => g.id === ledger.group_id);
      if (!group) continue;

      const balance = calculateLedgerBalance(ledger.id, endDate);
      
      if (Math.abs(balance) < 0.01) continue;

      if (group.type === 'income') {
        const amount = Math.abs(balance);
        income.push({ ledger_name: ledger.name, amount });
        totalIncome += amount;
      } else if (group.type === 'expense') {
        const amount = Math.abs(balance);
        expenses.push({ ledger_name: ledger.name, amount });
        totalExpenses += amount;
      }
    }

    const netProfit = totalIncome - totalExpenses;

    return { income, expenses, totalIncome, totalExpenses, netProfit };
  };

  // Balance Sheet calculation
  const getBalanceSheet = () => {
    const assets: any[] = [];
    const liabilities: any[] = [];
    const capital: any[] = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalCapital = 0;

    for (const ledger of ledgers) {
      const group = groups.find(g => g.id === ledger.group_id);
      if (!group) continue;

      const balance = calculateLedgerBalance(ledger.id, endDate);
      
      if (Math.abs(balance) < 0.01) continue;

      const amount = Math.abs(balance);

      if (group.type === 'asset') {
        assets.push({ ledger_name: ledger.name, group_name: ledger.group_name, amount });
        totalAssets += amount;
      } else if (group.type === 'liability') {
        liabilities.push({ ledger_name: ledger.name, group_name: ledger.group_name, amount });
        totalLiabilities += amount;
      } else if (group.type === 'capital') {
        capital.push({ ledger_name: ledger.name, group_name: ledger.group_name, amount });
        totalCapital += amount;
      }
    }

    // Add profit/loss to capital
    const plData = getProfitLoss();
    if (plData.netProfit !== 0) {
      capital.push({
        ledger_name: plData.netProfit > 0 ? 'Net Profit for the Year' : 'Net Loss for the Year',
        group_name: 'Profit & Loss',
        amount: Math.abs(plData.netProfit),
      });
      totalCapital += plData.netProfit;
    }

    const totalLiabilitiesAndCapital = totalLiabilities + totalCapital;

    return {
      assets,
      liabilities,
      capital,
      totalAssets,
      totalLiabilities,
      totalCapital,
      totalLiabilitiesAndCapital,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reports...</div>
      </div>
    );
  }

  const trialBalance = getTrialBalance();
  const profitLoss = getProfitLoss();
  const balanceSheet = getBalanceSheet();

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title and Header
      doc.setFontSize(20);
      doc.text('Financial Reports', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, yPos);
      yPos += 10;

      // Trial Balance
      doc.setFontSize(16);
      doc.text('Trial Balance', 14, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`As on ${new Date(endDate).toLocaleDateString('en-IN')}`, 14, yPos);
      yPos += 10;

      // Trial Balance Table Headers
      const tbHeaders = ['Particulars', 'Group', 'Debit (₹)', 'Credit (₹)'];
      const tbData = trialBalance.entries.map(entry => [
        entry.ledger_name,
        entry.group_name,
        entry.debit > 0 ? entry.debit.toFixed(2) : '-',
        entry.credit > 0 ? entry.credit.toFixed(2) : '-',
      ]);

      // Add Trial Balance table
      autoTable(doc, {
        head: [tbHeaders],
        body: tbData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.text(`Total Debit: ₹${trialBalance.totalDebit.toFixed(2)}`, 14, yPos);
      yPos += 6;
      doc.text(`Total Credit: ₹${trialBalance.totalCredit.toFixed(2)}`, 14, yPos);
      yPos += 6;
      doc.text(
        Math.abs(trialBalance.totalDebit - trialBalance.totalCredit) < 0.01
          ? '✓ Trial Balance Tallied'
          : `⚠ Difference: ₹${Math.abs(trialBalance.totalDebit - trialBalance.totalCredit).toFixed(2)}`,
        14,
        yPos
      );

      // New Page for Profit & Loss
      doc.addPage();
      yPos = 20;

      doc.setFontSize(16);
      doc.text('Profit & Loss Statement', 14, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`From ${new Date(startDate).toLocaleDateString('en-IN')} to ${new Date(endDate).toLocaleDateString('en-IN')}`, 14, yPos);
      yPos += 10;

      // Expenses
      doc.setFontSize(12);
      doc.text('Expenditure:', 14, yPos);
      yPos += 6;

      const expensesData = profitLoss.expenses.map(exp => [
        exp.ledger_name,
        exp.amount.toFixed(2),
      ]);

      autoTable(doc, {
        head: [['Expense', 'Amount (₹)']],
        body: expensesData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;
      doc.text(`Total Expenses: ₹${profitLoss.totalExpenses.toFixed(2)}`, 14, yPos);
      yPos += 10;

      // Income
      doc.setFontSize(12);
      doc.text('Income:', 14, yPos);
      yPos += 6;

      const incomeData = profitLoss.income.map(inc => [
        inc.ledger_name,
        inc.amount.toFixed(2),
      ]);

      autoTable(doc, {
        head: [['Income', 'Amount (₹)']],
        body: incomeData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;
      doc.text(`Total Income: ₹${profitLoss.totalIncome.toFixed(2)}`, 14, yPos);
      yPos += 10;

      doc.setFontSize(14);
      doc.text(
        `${profitLoss.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}: ₹${Math.abs(profitLoss.netProfit).toFixed(2)}`,
        14,
        yPos
      );

      // New Page for Balance Sheet
      doc.addPage();
      yPos = 20;

      doc.setFontSize(16);
      doc.text('Balance Sheet', 14, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.text(`As on ${new Date(endDate).toLocaleDateString('en-IN')}`, 14, yPos);
      yPos += 10;

      // Liabilities & Capital
      doc.setFontSize(12);
      doc.text('Capital & Liabilities:', 14, yPos);
      yPos += 6;

      const liabilitiesData = [
        ...balanceSheet.capital.map(item => [item.ledger_name, item.amount.toFixed(2)]),
        ...balanceSheet.liabilities.map(item => [item.ledger_name, item.amount.toFixed(2)]),
      ];

      autoTable(doc, {
        head: [['Capital & Liabilities', 'Amount (₹)']],
        body: liabilitiesData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;
      doc.text(`Total: ₹${balanceSheet.totalLiabilitiesAndCapital.toFixed(2)}`, 14, yPos);
      yPos += 10;

      // Assets
      doc.setFontSize(12);
      doc.text('Assets:', 14, yPos);
      yPos += 6;

      const assetsData = balanceSheet.assets.map(item => [
        item.ledger_name,
        item.amount.toFixed(2),
      ]);

      autoTable(doc, {
        head: [['Assets', 'Amount (₹)']],
        body: assetsData,
        startY: yPos,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
        styles: { fontSize: 8 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;
      doc.text(`Total Assets: ₹${balanceSheet.totalAssets.toFixed(2)}`, 14, yPos);
      yPos += 6;

      doc.text(
        Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesAndCapital) < 0.01
          ? '✓ Balance Sheet Tallied'
          : `⚠ Difference: ₹${Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesAndCapital).toFixed(2)}`,
        14,
        yPos
      );

      // Save the PDF
      const filename = `Financial_Reports_${new Date(endDate).toLocaleDateString().replace(/\//g, '-')}.pdf`;
      doc.save(filename);

      toast.success('Financial reports exported to PDF successfully');
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      toast.error(error.message || 'Failed to export PDF');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-gray-600">View Trial Balance, Profit & Loss, and Balance Sheet</p>
        </div>
        <Button variant="outline" onClick={exportToPDF}>
          <Download className="size-4 mr-2" />
          Export to PDF
        </Button>
      </div>

      {/* Period Selection */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <Label>Financial Year Start</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Period End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Button onClick={loadData} variant="outline" className="w-full">
              <Calendar className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList className="grid grid-cols-3 gap-4">
          <TabsTrigger value="trial-balance" className="flex items-center gap-2">
            <Scale className="size-4" />
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Profit & Loss
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
            <FileText className="size-4" />
            Balance Sheet
          </TabsTrigger>
        </TabsList>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Trial Balance</h3>
              <p className="text-sm text-gray-600">
                As on {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 bg-gray-50">
                    <th className="text-left p-3 font-semibold">Particulars</th>
                    <th className="text-left p-3 font-semibold">Group</th>
                    <th className="text-right p-3 font-semibold">Debit (₹)</th>
                    <th className="text-right p-3 font-semibold">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.entries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-gray-500">
                        No ledger balances found
                      </td>
                    </tr>
                  ) : (
                    trialBalance.entries.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{entry.ledger_name}</td>
                        <td className="p-3 text-sm text-gray-600">{entry.group_name}</td>
                        <td className="p-3 text-right font-medium text-red-600">
                          {entry.debit > 0 ? entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="p-3 text-right font-medium text-green-600">
                          {entry.credit > 0 ? entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-blue-50 font-bold border-t-2">
                  <tr>
                    <td colSpan={2} className="p-3 text-right">
                      Grand Total:
                    </td>
                    <td className="p-3 text-right text-red-600 text-lg">
                      ₹{trialBalance.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right text-green-600 text-lg">
                      ₹{trialBalance.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-3 text-center">
                      {Math.abs(trialBalance.totalDebit - trialBalance.totalCredit) < 0.01 ? (
                        <Badge className="bg-green-600">✓ Trial Balance Tallied</Badge>
                      ) : (
                        <Badge variant="destructive">
                          ⚠ Difference: ₹
                          {Math.abs(trialBalance.totalDebit - trialBalance.totalCredit).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </Badge>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Profit & Loss Statement</h3>
              <p className="text-sm text-gray-600">
                For the period from {new Date(startDate).toLocaleDateString('en-IN')} to{' '}
                {new Date(endDate).toLocaleDateString('en-IN')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Expenses */}
              <div>
                <h4 className="font-semibold text-lg mb-3 border-b pb-2">Expenditure</h4>
                <table className="w-full">
                  <tbody>
                    {profitLoss.expenses.length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500 text-sm">No expenses</td>
                      </tr>
                    ) : (
                      profitLoss.expenses.map((exp, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{exp.ledger_name}</td>
                          <td className="p-2 text-right font-medium">
                            ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                    {profitLoss.netProfit > 0 && (
                      <tr className="border-t-2 bg-green-50">
                        <td className="p-2 font-bold">Net Profit</td>
                        <td className="p-2 text-right font-bold text-green-600">
                          ₹{profitLoss.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t-2">
                    <tr>
                      <td className="p-2">Total</td>
                      <td className="p-2 text-right">
                        ₹
                        {(profitLoss.totalExpenses + (profitLoss.netProfit > 0 ? profitLoss.netProfit : 0)).toLocaleString(
                          'en-IN',
                          { minimumFractionDigits: 2 }
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Income */}
              <div>
                <h4 className="font-semibold text-lg mb-3 border-b pb-2">Income</h4>
                <table className="w-full">
                  <tbody>
                    {profitLoss.income.length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500 text-sm">No income</td>
                      </tr>
                    ) : (
                      profitLoss.income.map((inc, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{inc.ledger_name}</td>
                          <td className="p-2 text-right font-medium">
                            ₹{inc.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                    {profitLoss.netProfit < 0 && (
                      <tr className="border-t-2 bg-red-50">
                        <td className="p-2 font-bold">Net Loss</td>
                        <td className="p-2 text-right font-bold text-red-600">
                          ₹{Math.abs(profitLoss.netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t-2">
                    <tr>
                      <td className="p-2">Total</td>
                      <td className="p-2 text-right">
                        ₹
                        {(profitLoss.totalIncome + (profitLoss.netProfit < 0 ? Math.abs(profitLoss.netProfit) : 0)).toLocaleString(
                          'en-IN',
                          { minimumFractionDigits: 2 }
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Net Result</div>
                <div className={`text-2xl font-bold ${profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitLoss.netProfit >= 0 ? '📈 Net Profit: ' : '📉 Net Loss: '}₹
                  {Math.abs(profitLoss.netProfit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">Balance Sheet</h3>
              <p className="text-sm text-gray-600">
                As on {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Liabilities & Capital */}
              <div>
                <h4 className="font-semibold text-lg mb-3 border-b pb-2">Liabilities & Capital</h4>
                
                {/* Capital */}
                <div className="mb-4">
                  <div className="font-medium text-blue-600 mb-2">Capital</div>
                  <table className="w-full">
                    <tbody>
                      {balanceSheet.capital.length === 0 ? (
                        <tr>
                          <td className="p-2 text-gray-500 text-sm">No capital</td>
                        </tr>
                      ) : (
                        balanceSheet.capital.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 text-sm">{item.ledger_name}</td>
                            <td className="p-2 text-right font-medium">
                              ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-blue-50">
                      <tr>
                        <td className="p-2 font-semibold">Sub-total</td>
                        <td className="p-2 text-right font-semibold">
                          ₹{balanceSheet.totalCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Liabilities */}
                <div className="mb-4">
                  <div className="font-medium text-red-600 mb-2">Liabilities</div>
                  <table className="w-full">
                    <tbody>
                      {balanceSheet.liabilities.length === 0 ? (
                        <tr>
                          <td className="p-2 text-gray-500 text-sm">No liabilities</td>
                        </tr>
                      ) : (
                        balanceSheet.liabilities.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 text-sm">{item.ledger_name}</td>
                            <td className="p-2 text-right font-medium">
                              ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-red-50">
                      <tr>
                        <td className="p-2 font-semibold">Sub-total</td>
                        <td className="p-2 text-right font-semibold">
                          ₹{balanceSheet.totalLiabilities.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="bg-gray-50 p-3 font-bold border-t-2">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>
                      ₹{balanceSheet.totalLiabilitiesAndCapital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assets */}
              <div>
                <h4 className="font-semibold text-lg mb-3 border-b pb-2">Assets</h4>
                <table className="w-full">
                  <tbody>
                    {balanceSheet.assets.length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500 text-sm">No assets</td>
                      </tr>
                    ) : (
                      balanceSheet.assets.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{item.ledger_name}</td>
                          <td className="p-2 text-right font-medium">
                            ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t-2">
                    <tr>
                      <td className="p-2">Total</td>
                      <td className="p-2 text-right">
                        ₹{balanceSheet.totalAssets.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
              <div className="text-center">
                {Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesAndCapital) < 0.01 ? (
                  <Badge className="bg-green-600 text-lg px-4 py-2">✓ Balance Sheet Tallied</Badge>
                ) : (
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    ⚠ Difference: ₹
                    {Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesAndCapital).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}