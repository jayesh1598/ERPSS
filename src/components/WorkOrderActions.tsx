import { useState } from 'react';
import { Button } from './ui/button';
import { PlayCircle, Package, ClipboardList, ClipboardCheck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../lib/api';

interface WorkOrderActionsProps {
  workOrder: any;
  bom: any;
  items: any[];
  stock: any[];
  onUpdate: () => void;
  onOpenMaterialIssue: () => void;
  onOpenProductionEntry: () => void;
  onOpenQCInspection: () => void;
}

export function WorkOrderActions({
  workOrder,
  bom,
  items,
  stock,
  onUpdate,
  onOpenMaterialIssue,
  onOpenProductionEntry,
  onOpenQCInspection,
}: WorkOrderActionsProps) {
  const [starting, setStarting] = useState(false);
  const [submittingQC, setSubmittingQC] = useState(false);

  const handleStart = async () => {
    try {
      setStarting(true);
      await api.startWorkOrder(workOrder.id);
      toast.success('🚀 Work Order started! Production is now in progress.');
      onUpdate();
    } catch (error: any) {
      console.error('Start work order error:', error);
      toast.error(error.message || 'Failed to start work order');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitForQC = async () => {
    try {
      setSubmittingQC(true);
      await api.submitForQC(workOrder.id);
      toast.success('✅ Work Order submitted for Quality Control inspection');
      onUpdate();
    } catch (error: any) {
      console.error('Submit QC error:', error);
      toast.error(error.message || 'Failed to submit for QC');
    } finally {
      setSubmittingQC(false);
    }
  };

  // Planned status - can start
  if (workOrder.status === 'planned') {
    return (
      <Button size="sm" onClick={handleStart} disabled={starting} className="bg-green-600 hover:bg-green-700">
        <PlayCircle className="size-3 mr-1" />
        {starting ? 'Starting...' : 'Start Production'}
      </Button>
    );
  }

  // In Progress - can issue materials, record production
  if (workOrder.status === 'in_progress') {
    const isFullyProduced = workOrder.produced_quantity >= workOrder.quantity;
    
    return (
      <div className="flex gap-2 flex-wrap">
        {!workOrder.materials_issued && (
          <Button size="sm" variant="outline" onClick={onOpenMaterialIssue}>
            <Package className="size-3 mr-1" />
            Issue Materials
          </Button>
        )}
        
        {!isFullyProduced && (
          <Button size="sm" variant="default" onClick={onOpenProductionEntry}>
            <ClipboardList className="size-3 mr-1" />
            Record Production
          </Button>
        )}
        
        {isFullyProduced && (
          <Button 
            size="sm" 
            onClick={handleSubmitForQC} 
            disabled={submittingQC}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircle className="size-3 mr-1" />
            {submittingQC ? 'Submitting...' : 'Submit for QC'}
          </Button>
        )}
      </div>
    );
  }

  // QC Pending - can inspect
  if (workOrder.status === 'qc_pending') {
    return (
      <Button size="sm" onClick={onOpenQCInspection} className="bg-purple-600 hover:bg-purple-700">
        <ClipboardCheck className="size-3 mr-1" />
        QC Inspection
      </Button>
    );
  }

  // QC Rejected - can restart or scrap
  if (workOrder.status === 'qc_rejected') {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => toast.info('Rework functionality coming soon')}>
          Rework
        </Button>
      </div>
    );
  }

  // Completed
  if (workOrder.status === 'completed') {
    return (
      <span className="text-sm text-green-600 font-semibold">
        ✓ Complete
      </span>
    );
  }

  return null;
}
