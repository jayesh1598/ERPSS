import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { ClipboardCheck } from 'lucide-react';
import { getAccessToken } from '../lib/api'; // Import getAccessToken helper

interface ProductionEntryProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  onRecorded: () => void;
}

export function ProductionEntry({ isOpen, onClose, workOrder, onRecorded }: ProductionEntryProps) {
  const [quantity, setQuantity] = useState('');
  const [wasteQuantity, setWasteQuantity] = useState('0');
  const [batchNumber, setBatchNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Please enter a valid production quantity');
      return;
    }

    const totalProduced = (workOrder.produced_quantity || 0) + parseFloat(quantity);
    if (totalProduced > workOrder.quantity) {
      toast.error(`Total produced quantity (${totalProduced}) cannot exceed order quantity (${workOrder.quantity})`);
      return;
    }

    try {
      setSubmitting(true);

      // Get the access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please log in again to continue');
      }

      const response = await fetch(
        `https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/work-orders/${workOrder.id}/record-production`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            quantity: parseFloat(quantity),
            waste_quantity: parseFloat(wasteQuantity),
            batch_number: batchNumber,
            remarks,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record production');
      }

      toast.success(`Production entry recorded: ${quantity} units`);
      
      // Reset form
      setQuantity('');
      setWasteQuantity('0');
      setBatchNumber('');
      setRemarks('');
      
      onRecorded();
      onClose();
    } catch (error: any) {
      console.error('Production entry error:', error);
      toast.error(error.message || 'Failed to record production');
    } finally {
      setSubmitting(false);
    }
  };

  const remainingQty = workOrder ? workOrder.quantity - (workOrder.produced_quantity || 0) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-green-600" />
            Record Production Entry
          </DialogTitle>
          <DialogDescription>
            <strong>Step 9:</strong> Record actual production output as products are manufactured
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Work Order Info */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">WO Number</p>
                <p className="font-bold text-lg">{workOrder?.wo_number}</p>
              </div>
              <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                PRODUCTION
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-green-300">
              <div>
                <p className="text-xs text-gray-600">Order Quantity</p>
                <p className="font-semibold text-lg">{workOrder?.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Already Produced</p>
                <p className="font-semibold text-lg text-green-600">{workOrder?.produced_quantity || 0}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-green-300">
              <p className="text-xs text-gray-600">Remaining to Produce</p>
              <p className="font-bold text-2xl text-blue-600">{remainingQty}</p>
            </div>
            {/* Progress Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Production Progress</span>
                <span>{((workOrder?.produced_quantity || 0) / workOrder?.quantity * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((workOrder?.produced_quantity || 0) / workOrder?.quantity * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Production Quantity */}
          <div>
            <Label htmlFor="quantity">Production Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter produced quantity"
            />
            {parseFloat(quantity || '0') > remainingQty && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Quantity exceeds remaining order quantity
              </p>
            )}
          </div>

          {/* Waste Quantity */}
          <div>
            <Label htmlFor="waste">Waste/Scrap Quantity</Label>
            <Input
              id="waste"
              type="number"
              min="0"
              step="0.01"
              value={wasteQuantity}
              onChange={(e) => setWasteQuantity(e.target.value)}
              placeholder="Optional"
            />
            <p className="text-xs text-gray-500 mt-1">
              Record any waste or scrap material during production
            </p>
          </div>

          {/* Batch Number */}
          <div>
            <Label htmlFor="batch">Batch Number</Label>
            <Input
              id="batch"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder="e.g., BATCH-2026-001"
            />
          </div>

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Additional notes about this production entry"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Recording...' : 'Record Production'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}