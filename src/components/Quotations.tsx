import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  FileText, 
  CheckCircle, 
  Upload, 
  Eye, 
  Lock,
  XCircle,
  Award,
  Package
} from 'lucide-react';
import { Textarea } from './ui/textarea';

export function Quotations() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewDocument, setViewDocument] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    pr_id: '',
    supplier_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    quotation_type: '',
    quotation_number: '',
    total_amount: '',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quotationsResult, prsResult, suppliersResult, posResult] = await Promise.all([
        api.getQuotations(),
        api.getPRs(),
        api.getParties('supplier'),
        api.getPOs(),
      ]);
      setQuotations(quotationsResult.quotations || []);
      setPrs(prsResult.prs || []);
      setSuppliers(suppliersResult.parties || []);
      setPos(posResult.pos || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and image files are allowed');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadQuotation = async () => {
    try {
      if (!formData.pr_id || !formData.supplier_id || !formData.quotation_type || 
          !formData.quotation_number || !formData.total_amount || !selectedFile) {
        toast.error('Please fill all required fields and select a file');
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        const uploadData = {
          ...formData,
          total_amount: parseFloat(formData.total_amount),
          document: {
            name: selectedFile!.name,
            type: selectedFile!.type,
            data: base64String,
          },
        };

        await api.uploadQuotation(uploadData);
        toast.success('Quotation uploaded successfully and sent for admin approval');
        setShowUploadDialog(false);
        resetForm();
        loadData();
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast.error(`Failed to upload quotation: ${error.message}`);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveQuotation(id);
      toast.success('Quotation approved successfully');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to approve quotation: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectQuotation(id);
      toast.success('Quotation rejected');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to reject quotation: ${error.message}`);
    }
  };

  const handleMarkAsBest = async (id: string) => {
    try {
      const result = await api.markQuotationAsBest(id);
      
      // Check if PO was auto-created
      if (result.po) {
        toast.success(
          `✅ Quotation marked as best!\n🎯 Purchase Order ${result.po.po_number} auto-created!\n💰 Amount blocked for invoice matching`,
          { duration: 8000 }
        );
      } else {
        toast.success('Quotation marked as best and amount blocked for invoice matching');
      }
      
      loadData();
    } catch (error: any) {
      toast.error(`Failed to mark as best: ${error.message}`);
    }
  };

  const handleCreatePO = async (quotationId: string) => {
    try {
      const result = await api.createPOFromQuotation(quotationId);
      
      if (result.message) {
        toast.info(result.message);
      } else {
        toast.success(
          `✅ Purchase Order ${result.po.po_number} created successfully!`,
          { duration: 5000 }
        );
      }
      
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create PO: ${error.message}`);
    }
  };

  const hasPO = (quotationId: string) => {
    return pos.some(po => po.quotation_id === quotationId);
  };

  const resetForm = () => {
    setFormData({
      pr_id: '',
      supplier_id: '',
      quotation_date: new Date().toISOString().split('T')[0],
      valid_until: '',
      quotation_type: '',
      quotation_number: '',
      total_amount: '',
      remarks: '',
    });
    setSelectedFile(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'pending_approval': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'amount_blocked': 'bg-blue-100 text-blue-800',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'Unknown';
  };

  const getPRNumber = (prId: string) => {
    const pr = prs.find(p => p.id === prId);
    return pr?.pr_number || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading quotations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Quotations</h1>
          <p className="text-gray-500 mt-1">Upload, manage, and approve supplier quotations</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="size-4 mr-2" />
              Upload Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Supplier Quotation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pr_id">Purchase Requisition *</Label>
                  <Select
                    value={formData.pr_id}
                    onValueChange={(value) => setFormData({ ...formData, pr_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select PR" />
                    </SelectTrigger>
                    <SelectContent>
                      {prs.filter(pr => pr.status === 'approved' || pr.status === 'submitted').length === 0 ? (
                        <SelectItem value="no-prs" disabled>
                          No submitted/approved PRs available
                        </SelectItem>
                      ) : (
                        prs.filter(pr => pr.status === 'approved' || pr.status === 'submitted').map((pr) => (
                          <SelectItem key={pr.id} value={pr.id}>
                            {pr.pr_number} - {pr.pr_date} ({pr.status})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {prs.filter(pr => pr.status === 'approved' || pr.status === 'submitted').length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ No PRs available. PRs must be submitted or approved before uploading quotations.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="supplier_id">Supplier *</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quotation_number">Quotation Number *</Label>
                  <Input
                    id="quotation_number"
                    placeholder="QT-2024-001"
                    value={formData.quotation_number}
                    onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="quotation_type">Quotation Type *</Label>
                  <Select
                    value={formData.quotation_type}
                    onValueChange={(value) => setFormData({ ...formData, quotation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="physical">Physical Document</SelectItem>
                      <SelectItem value="portal">Supplier Portal</SelectItem>
                      <SelectItem value="fax">Fax</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="phone">Phone/Verbal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quotation_date">Quotation Date *</Label>
                  <Input
                    id="quotation_date"
                    type="date"
                    value={formData.quotation_date}
                    onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="valid_until">Valid Until *</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="total_amount">Total Amount (₹) *</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Additional notes or comments"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="file">Upload Quotation Document (PDF/Image) *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maximum file size: 5MB. Accepted formats: PDF, JPG, PNG
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUploadQuotation}>
                  Upload & Submit for Approval
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            All Quotations ({quotations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation No.</TableHead>
                  <TableHead>PR Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Best Quote</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((qt) => (
                  <TableRow key={qt.id}>
                    <TableCell className="font-medium">{qt.quotation_number}</TableCell>
                    <TableCell>{getPRNumber(qt.pr_id)}</TableCell>
                    <TableCell>{getSupplierName(qt.supplier_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {qt.quotation_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{qt.quotation_date}</TableCell>
                    <TableCell>{qt.valid_until}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{qt.total_amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(qt.status)}>
                        {qt.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {qt.is_best && (
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-amber-100 text-amber-800">
                            <Award className="size-3 mr-1" />
                            Best Quote
                          </Badge>
                          {qt.amount_blocked && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <Lock className="size-3 mr-1" />
                              Blocked
                            </Badge>
                          )}
                          {hasPO(qt.id) && (
                            <Badge className="bg-green-100 text-green-800">
                              <Package className="size-3 mr-1" />
                              PO Created
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {qt.document_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewDocument(qt.document_url)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        )}
                        
                        {qt.status === 'pending_approval' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(qt.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="size-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(qt.id)}
                            >
                              <XCircle className="size-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {qt.status === 'approved' && !qt.is_best && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsBest(qt.id)}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            <Award className="size-4 mr-1" />
                            Mark as Best
                          </Button>
                        )}

                        {qt.is_best && !hasPO(qt.id) && (
                          <Button
                            size="sm"
                            onClick={() => handleCreatePO(qt.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Package className="size-4 mr-1" />
                            Create PO
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {quotations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                      No quotations uploaded yet. Click "Upload Quotation" to add one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      {viewDocument && (
        <Dialog open={!!viewDocument} onOpenChange={() => setViewDocument(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>Quotation Document</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {viewDocument.startsWith('data:application/pdf') ? (
                <embed
                  src={viewDocument}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="min-h-[600px]"
                />
              ) : (
                <img src={viewDocument} alt="Quotation" className="w-full h-auto" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-3 text-lg">📋 Quotation to Purchase Order Workflow</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Standard Process:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Purchase Department uploads quotation documents</li>
                <li>Admin reviews and approves valid quotations</li>
                <li>Admin marks the best quotation (best price/terms)</li>
                <li><strong>✨ System auto-creates Purchase Order</strong></li>
                <li>Admin approves the auto-generated PO</li>
                <li>Supplier uploads invoice against PO</li>
                <li>4-way matching: Quotation → PO → Invoice → GRN</li>
              </ol>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <Package className="size-5" />
                For Existing Best Quotations:
              </h4>
              <p className="text-sm text-gray-700 mb-3">
                If you marked a quotation as "Best" before the auto-PO feature was added, you'll see a <strong className="text-blue-600">"Create PO"</strong> button.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-900">
                <p className="font-semibold mb-1">🎯 Action Required:</p>
                <p>Click <strong>"Create PO"</strong> button next to best quotations to generate their Purchase Orders.</p>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-800 text-xs">Best Quote</Badge>
                  = Selected as best offer
                </p>
                <p className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">PO Created</Badge>
                  = Purchase Order exists
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}