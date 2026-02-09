import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { DollarSign } from 'lucide-react';
import { getAccessToken } from '../lib/api'; // Import getAccessToken helper

interface PaymentRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
  orderId: string;
  partyId: string;
  partyName: string;
  orderTotal: number;
  amountPaid: number;
  type: 'sales' | 'purchase';
}

export function PaymentRecorder({
  isOpen,
  onClose,
  onPaymentRecorded,
  orderId,
  partyId,
  partyName,
  orderTotal,
  amountPaid,
  type,
}: PaymentRecorderProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const outstandingBalance = orderTotal - amountPaid;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setSubmitting(true);

      const paymentData = {
        order_id: orderId,
        party_id: partyId,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        remarks,
      };

      // Get the access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please log in again to continue');
      }

      const response = await fetch(
        `https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/${type === 'sales' ? 'sales-payments' : 'purchase-payments'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      toast.success(`Payment of ₹${parseFloat(amount).toLocaleString()} recorded successfully!`);
      
      // Reset form
      setAmount('');
      setPaymentMethod('');
      setReferenceNumber('');
      setRemarks('');
      
      onPaymentRecorded();
      onClose();
    } catch (error: any) {
      console.error('Payment recording error:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-green-600" />
            Record Payment - {type === 'sales' ? 'Customer' : 'Supplier'}
          </DialogTitle>
          <DialogDescription>
            Enter the payment details for {type === 'sales' ? 'customer' : 'supplier'} {partyName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Party Info */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-1">
            <p className="text-sm">
              <span className="text-gray-600">{type === 'sales' ? 'Customer' : 'Supplier'}:</span>{' '}
              <span className="font-semibold">{partyName}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Order Total:</span>{' '}
              <span className="font-semibold">₹{orderTotal.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Already Paid:</span>{' '}
              <span className="font-semibold text-green-600">₹{amountPaid.toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Outstanding:</span>{' '}
              <span className={`font-semibold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{outstandingBalance.toLocaleString()}
              </span>
            </p>
          </div>

          {/* Payment Amount */}
          <div>
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
            {parseFloat(amount) > outstandingBalance && outstandingBalance > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ This is more than the outstanding balance. It will be recorded as advance payment.
              </p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <Label htmlFor="payment-date">Payment Date *</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment-method">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Transaction ID, Cheque No, etc."
            />
          </div>

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional notes"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}