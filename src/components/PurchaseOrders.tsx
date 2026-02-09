import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { FileText, CheckCircle, Eye, Award, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';

export function PurchaseOrders() {
  const [pos, setPos] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPODialog, setViewPODialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [poItems, setPOItems] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [posResult, suppliersResult] = await Promise.all([
        api.getPOs(),
        api.getParties('supplier')
      ]);
      
      console.log('📦 Purchase Orders:', posResult.pos);
      setPos(posResult.pos || []);
      setSuppliers(suppliersResult.parties || []);
      
      if (!posResult.pos || posResult.pos.length === 0) {
        console.log('⚠️ No POs found. Make sure to mark a quotation as "best" to auto-create a PO.');
      }
    } catch (error: any) {
      console.error('❌ Failed to load purchase orders:', error.message);
      toast.error(`Failed to load purchase orders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approvePO(id);
      toast.success('✅ Purchase Order approved successfully');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to approve PO: ${error.message}`);
    }
  };

  const handleViewPO = async (po: any) => {
    try {
      setSelectedPO(po);
      const result = await api.getPOItems(po.id);
      setPOItems(result.items || []);
      setViewPODialog(true);
    } catch (error: any) {
      toast.error(`Failed to load PO details: ${error.message}`);
    }
  };

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)?.name || 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'draft': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'received': 'bg-blue-100 text-blue-800',
      'closed': 'bg-gray-100 text-gray-800',
    };
    return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <p className="text-gray-500 mt-1">Manage purchase orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Purchase Orders ({pos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>PO Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium">{po.po_number}</TableCell>
                  <TableCell>{po.po_date}</TableCell>
                  <TableCell>{po.delivery_date}</TableCell>
                  <TableCell>₹{po.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>
                    {getStatusBadge(po.status)}
                  </TableCell>
                  <TableCell>
                    {po.status === 'draft' && (
                      <Button size="sm" onClick={() => handleApprove(po.id)}>
                        <CheckCircle className="size-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleViewPO(po)}>
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={viewPODialog} onOpenChange={setViewPODialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>
              View the details of the selected purchase order.
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">PO Number</Label>
                <p className="text-sm font-medium">{selectedPO.po_number}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">PO Date</Label>
                <p className="text-sm font-medium">{selectedPO.po_date}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Delivery Date</Label>
                <p className="text-sm font-medium">{selectedPO.delivery_date}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Total Amount</Label>
                <p className="text-sm font-medium">₹{selectedPO.total_amount?.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Status</Label>
                {getStatusBadge(selectedPO.status)}
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Supplier</Label>
                <p className="text-sm font-medium">{getSupplierName(selectedPO.supplier_id)}</p>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Items</Label>
                <p className="text-sm font-medium">{poItems.length} items</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Card - Automated Workflow */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Package className="size-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-3 text-lg">🎯 Automated Purchase Order Creation Workflow</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="bg-white/60 rounded p-3">
                  <p className="font-semibold mb-2">How POs are Auto-Created:</p>
                  <ol className="space-y-1 list-decimal list-inside pl-2">
                    <li>Purchase Requisition (PR) is created and approved</li>
                    <li>Suppliers submit quotations for the PR</li>
                    <li>Admin reviews and approves valid quotations</li>
                    <li><strong className="text-amber-700">Admin marks the best quotation</strong> (best price/terms)</li>
                    <li><strong className="text-green-700">✨ System AUTOMATICALLY creates PO</strong> from the best quotation</li>
                    <li>Admin reviews and approves the auto-generated PO</li>
                    <li>Supplier uploads invoice against the approved PO</li>
                    <li>System performs 4-way matching (Quotation → PO → Invoice → GRN)</li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded p-3">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="size-4 text-amber-600" />
                      Why Mark as "Best"?
                    </p>
                    <ul className="space-y-1 list-disc list-inside pl-2 text-xs">
                      <li>Automatically creates Purchase Order</li>
                      <li>Blocks quotation amount for matching</li>
                      <li>Prevents invoice fraud/mismatch</li>
                      <li>Ensures audit trail compliance</li>
                    </ul>
                  </div>

                  <div className="bg-white/60 rounded p-3">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="size-4 text-green-600" />
                      PO Status Flow:
                    </p>
                    <ul className="space-y-1 list-disc list-inside pl-2 text-xs">
                      <li><Badge className="bg-yellow-100 text-yellow-800 text-xs">Draft</Badge> - Auto-created, needs approval</li>
                      <li><Badge className="bg-green-100 text-green-800 text-xs">Approved</Badge> - Ready for supplier delivery</li>
                      <li><Badge className="bg-blue-100 text-blue-800 text-xs">Received</Badge> - Materials received (GRN done)</li>
                      <li><Badge className="bg-gray-100 text-gray-800 text-xs">Closed</Badge> - Invoice paid, complete</li>
                    </ul>
                  </div>
                </div>

                {pos.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="font-semibold text-amber-900 mb-1">⚠️ No Purchase Orders Yet?</p>
                    <p className="text-xs text-amber-800">
                      To create your first PO: Go to <strong>Purchase Quotations</strong> → Approve quotations → Click <strong>"Mark as Best"</strong> on the best quotation → PO will be auto-created!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}