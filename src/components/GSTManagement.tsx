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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { Receipt, Plus, DollarSign, FileText, TrendingUp, AlertTriangle, CreditCard, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function GSTManagement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createPaymentOpen, setCreatePaymentOpen] = useState(false);
  const [viewTransactionOpen, setViewTransactionOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Payment form state
  const [paymentPeriod, setPaymentPeriod] = useState('');
  const [paymentCGST, setPaymentCGST] = useState('');
  const [paymentSGST, setPaymentSGST] = useState('');
  const [paymentIGST, setPaymentIGST] = useState('');
  const [paymentInterest, setPaymentInterest] = useState('0');
  const [paymentLateFee, setPaymentLateFee] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('net_banking');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txnResult, payResult] = await Promise.all([
        api.getGSTTransactions(),
        api.getGSTPayments(),
      ]);
      
      setTransactions(txnResult.transactions || []);
      setPayments(payResult.payments || []);
    } catch (error: any) {
      toast.error(`Failed to load GST data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!paymentPeriod || (!paymentCGST && !paymentSGST && !paymentIGST)) {
      toast.error('Please fill period and at least one GST amount');
      return;
    }

    try {
      await api.initiateGSTPayment({
        period: paymentPeriod,
        cgst_amount: parseFloat(paymentCGST || '0'),
        sgst_amount: parseFloat(paymentSGST || '0'),
        igst_amount: parseFloat(paymentIGST || '0'),
        interest_amount: parseFloat(paymentInterest || '0'),
        late_fee_amount: parseFloat(paymentLateFee || '0'),
        payment_method: paymentMethod,
        payment_reference: paymentReference
      });

      toast.success('GST payment initiated successfully!');
      setCreatePaymentOpen(false);
      resetPaymentForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to initiate payment: ${error.message}`);
    }
  };

  const resetPaymentForm = () => {
    setPaymentPeriod('');
    setPaymentCGST('');
    setPaymentSGST('');
    setPaymentIGST('');
    setPaymentInterest('0');
    setPaymentLateFee('0');
    setPaymentMethod('net_banking');
    setPaymentReference('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sales': return <Badge className="bg-blue-500">Sales</Badge>;
      case 'purchase': return <Badge className="bg-purple-500">Purchase</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateSummary = () => {
    const sales = transactions.filter(t => t.type === 'sales');
    const purchases = transactions.filter(t => t.type === 'purchase');

    const salesCGST = sales.reduce((sum, t) => sum + (t.cgst || 0), 0);
    const salesSGST = sales.reduce((sum, t) => sum + (t.sgst || 0), 0);
    const salesIGST = sales.reduce((sum, t) => sum + (t.igst || 0), 0);

    const purchaseCGST = purchases.reduce((sum, t) => sum + (t.cgst || 0), 0);
    const purchaseSGST = purchases.reduce((sum, t) => sum + (t.sgst || 0), 0);
    const purchaseIGST = purchases.reduce((sum, t) => sum + (t.igst || 0), 0);

    return {
      salesCGST,
      salesSGST,
      salesIGST,
      purchaseCGST,
      purchaseSGST,
      purchaseIGST,
      payableCGST: salesCGST - purchaseCGST,
      payableSGST: salesSGST - purchaseSGST,
      payableIGST: salesIGST - purchaseIGST,
      totalPayable: (salesCGST - purchaseCGST) + (salesSGST - purchaseSGST) + (salesIGST - purchaseIGST)
    };
  };

  const summary = calculateSummary();

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
          <h1 className="text-3xl font-bold">GST Management</h1>
          <p className="text-gray-500 mt-1">GST transactions, payments & returns filing</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">CGST Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.payableCGST)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">SGST Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.payableSGST)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">IGST Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.payableIGST)}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(summary.totalPayable)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">GST Transactions</TabsTrigger>
          <TabsTrigger value="payments">GST Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-5" />
                GST Transactions ({transactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No GST transactions found</p>
                  <p className="text-sm">Transactions are auto-created from invoices and purchases</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Taxable Amount</TableHead>
                      <TableHead>CGST</TableHead>
                      <TableHead>SGST</TableHead>
                      <TableHead>IGST</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.transaction_date).toLocaleDateString()}</TableCell>
                        <TableCell>{getTypeBadge(txn.type)}</TableCell>
                        <TableCell className="font-medium">{txn.reference_number}</TableCell>
                        <TableCell className="text-xs font-mono">{txn.party_gstin}</TableCell>
                        <TableCell>{formatCurrency(txn.taxable_amount)}</TableCell>
                        <TableCell>{formatCurrency(txn.cgst || 0)}</TableCell>
                        <TableCell>{formatCurrency(txn.sgst || 0)}</TableCell>
                        <TableCell>{formatCurrency(txn.igst || 0)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(txn.total_tax)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="size-5" />
                  GST Payments ({payments.length})
                </CardTitle>
                <Dialog open={createPaymentOpen} onOpenChange={setCreatePaymentOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Make Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Initiate GST Payment</DialogTitle>
                      <DialogDescription>
                        Pay GST liabilities through government portal integration
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertTriangle className="size-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Current GST Liability</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          Total Payable: {formatCurrency(summary.totalPayable)}
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label htmlFor="payment-period">Tax Period *</Label>
                        <Input
                          id="payment-period"
                          type="month"
                          value={paymentPeriod}
                          onChange={(e) => setPaymentPeriod(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="payment-cgst">CGST Amount (₹)</Label>
                          <Input
                            id="payment-cgst"
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentCGST}
                            onChange={(e) => setPaymentCGST(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="payment-sgst">SGST Amount (₹)</Label>
                          <Input
                            id="payment-sgst"
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentSGST}
                            onChange={(e) => setPaymentSGST(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="payment-igst">IGST Amount (₹)</Label>
                          <Input
                            id="payment-igst"
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentIGST}
                            onChange={(e) => setPaymentIGST(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="payment-interest">Interest (₹)</Label>
                          <Input
                            id="payment-interest"
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentInterest}
                            onChange={(e) => setPaymentInterest(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <Label htmlFor="payment-late-fee">Late Fee (₹)</Label>
                          <Input
                            id="payment-late-fee"
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentLateFee}
                            onChange={(e) => setPaymentLateFee(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="bg-gray-50 p-4 rounded mb-4">
                          <p className="text-sm text-gray-600 mb-2">Total Payment Amount:</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {formatCurrency(
                              parseFloat(paymentCGST || '0') +
                              parseFloat(paymentSGST || '0') +
                              parseFloat(paymentIGST || '0') +
                              parseFloat(paymentInterest || '0') +
                              parseFloat(paymentLateFee || '0')
                            )}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="payment-method">Payment Method *</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger id="payment-method">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="net_banking">Net Banking</SelectItem>
                                <SelectItem value="debit_card">Debit Card</SelectItem>
                                <SelectItem value="credit_card">Credit Card</SelectItem>
                                <SelectItem value="neft_rtgs">NEFT/RTGS</SelectItem>
                                <SelectItem value="over_the_counter">OTC</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="payment-reference">Payment Reference</Label>
                            <Input
                              id="payment-reference"
                              value={paymentReference}
                              onChange={(e) => setPaymentReference(e.target.value)}
                              placeholder="Transaction ID"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreatePaymentOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInitiatePayment}>
                        Initiate Payment
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No GST payments found</p>
                  <p className="text-sm">Initiate your first GST payment</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>CGST</TableHead>
                      <TableHead>SGST</TableHead>
                      <TableHead>IGST</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Late Fee</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{payment.period}</TableCell>
                        <TableCell>{formatCurrency(payment.cgst_amount)}</TableCell>
                        <TableCell>{formatCurrency(payment.sgst_amount)}</TableCell>
                        <TableCell>{formatCurrency(payment.igst_amount)}</TableCell>
                        <TableCell>{formatCurrency(payment.interest_amount || 0)}</TableCell>
                        <TableCell>{formatCurrency(payment.late_fee_amount || 0)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.total_amount)}</TableCell>
                        <TableCell className="text-sm">{payment.payment_method}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
