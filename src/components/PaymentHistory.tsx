import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Receipt } from 'lucide-react';
import { getAccessToken } from '../lib/api'; // Import getAccessToken helper

interface PaymentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  type: 'sales' | 'purchase';
  orderTotal: number;
}

export function PaymentHistory({ isOpen, onClose, orderId, type, orderTotal }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen, orderId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Get the access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please log in again to continue');
      }

      const response = await fetch(
        `https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/${type === 'sales' ? 'sales-orders' : 'purchase-orders'}/${orderId}/payments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch payments');
      
      const data = await response.json();
      setPayments(data.payments || []);
      setTotalPaid(data.total_paid || 0);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
      card: 'Card',
      upi: 'UPI',
      other: 'Other',
    };
    return labels[method] || method;
  };

  const outstanding = orderTotal - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-5 text-blue-600" />
            Payment History
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Order Total</p>
            <p className="text-xl font-bold">₹{orderTotal.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className={`text-xl font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{outstanding.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="size-12 mx-auto mb-4 opacity-20" />
            <p>No payments recorded yet</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ₹{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.reference_number || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {payment.remarks || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}