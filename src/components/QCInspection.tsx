import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
import { getAccessToken } from '../lib/api'; // Import getAccessToken helper

interface QCInspectionProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: any;
  onInspected: () => void;
}

export function QCInspection({ isOpen, onClose, workOrder, onInspected }: QCInspectionProps) {
  const [approved, setApproved] = useState(true);
  const [rejectedQuantity, setRejectedQuantity] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [qcReference, setQcReference] = useState('');

  // Generate QC reference when dialog opens
  useEffect(() => {
    if (isOpen && workOrder) {
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setQcReference(`QC-${date}-${random}`);
      setApproved(true);
      setRejectedQuantity('0');
      setRemarks('');
    }
  }, [isOpen, workOrder]);

  const handleSubmit = async () => {
    const rejectedQty = parseFloat(rejectedQuantity || '0');
    
    if (rejectedQty < 0) {
      toast.error('Rejected quantity cannot be negative');
      return;
    }

    if (rejectedQty > workOrder.produced_quantity) {
      toast.error('Rejected quantity cannot exceed produced quantity');
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
        `https://dhahhnqdwsncjieqydjh.supabase.co/functions/v1/make-server-8eebe9eb/work-orders/${workOrder.id}/qc-approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            approved,
            rejected_quantity: rejectedQty,
            remarks,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process QC inspection');
      }

      const result = await response.json();

      if (approved) {
        const approvedQty = workOrder.produced_quantity - rejectedQty;
        toast.success(`✅ QC Approved! ${approvedQty} units added to inventory`);
      } else {
        toast.error('❌ QC Rejected - Work order needs rework');
      }
      
      onInspected();
      onClose();
    } catch (error: any) {
      console.error('QC inspection error:', error);
      toast.error(error.message || 'Failed to process QC inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const approvedQty = workOrder ? workOrder.produced_quantity - parseFloat(rejectedQuantity || '0') : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-purple-600" />
            Production QC - Finished Goods Inspection
          </DialogTitle>
          <DialogDescription>
            <strong>Step 10:</strong> Quality inspection for finished goods produced from this work order.
            <br />
            <span className="text-xs text-gray-500">(This is different from Incoming QC which checks raw materials)</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QC Type Badge */}
          <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-purple-600 font-semibold">QC TYPE</Label>
              <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                FINISHED GOODS (FG)
              </span>
            </div>
            <Label className="text-xs text-purple-600 font-semibold">QC Inspection Reference</Label>
            <p className="text-lg font-bold text-purple-900 mt-1">{qcReference}</p>
          </div>

          {/* Work Order Info */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
            <p>
              <span className="text-gray-600">WO Number:</span>{' '}
              <span className="font-semibold">{workOrder?.wo_number}</span>
            </p>
            <p>
              <span className="text-gray-600">Produced Quantity:</span>{' '}
              <span className="font-semibold">{workOrder?.produced_quantity}</span>
            </p>
            <p>
              <span className="text-gray-600">Order Quantity:</span>{' '}
              <span className="font-semibold">{workOrder?.quantity}</span>
            </p>
          </div>

          {/* QC Decision */}
          <div className="space-y-3">
            <Label>QC Decision *</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={approved ? 'default' : 'outline'}
                className={approved ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setApproved(true)}
              >
                <CheckCircle2 className="size-4 mr-2" />
                Approve
              </Button>
              <Button
                type="button"
                variant={!approved ? 'destructive' : 'outline'}
                onClick={() => setApproved(false)}
              >
                <XCircle className="size-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>

          {/* Rejected Quantity */}
          {approved && (
            <div>
              <Label htmlFor="rejected">Rejected Quantity (if any)</Label>
              <Input
                id="rejected"
                type="number"
                min="0"
                step="0.01"
                max={workOrder?.produced_quantity || 0}
                value={rejectedQuantity}
                onChange={(e) => setRejectedQuantity(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Defective units that won't be added to inventory
              </p>
            </div>
          )}

          {/* Approved Quantity Summary */}
          {approved && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="size-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>{approvedQty}</strong> units will be added to finished goods inventory
                {parseFloat(rejectedQuantity) > 0 && (
                  <span className="block text-sm mt-1">
                    ({rejectedQuantity} units rejected)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Rejection Warning */}
          {!approved && (
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertDescription>
                Rejecting this work order will require production rework. No items will be added to inventory.
              </AlertDescription>
            </Alert>
          )}

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">
              QC Remarks
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional inspection notes and quality observations"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className={approved ? 'bg-green-600 hover:bg-green-700' : ''}
            variant={approved ? 'default' : 'destructive'}
          >
            {submitting ? 'Processing...' : approved ? 'Approve & Complete' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}