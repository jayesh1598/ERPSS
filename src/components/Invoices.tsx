import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { Receipt, Upload, FileText, AlertTriangle, CheckCircle, XCircle, Eye, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pos, setPOs] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Upload form state
  const [selectedPO, setSelectedPO] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoiceDocument, setInvoiceDocument] = useState<File | null>(null); // Renamed from 'document'
  const [documentUrl, setDocumentUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [approveReason, setApproveReason] = useState('');
  
  // Item selection state for adding items
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemRate, setItemRate] = useState('');

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const result = await api.getCurrentUserDetails();
      setCurrentUser(result.user);
    } catch (error: any) {
      console.error('Failed to load user:', error.message);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesResult, posResult, itemsResult] = await Promise.all([
        api.getInvoices(),
        api.getPOs(),
        api.getItems()
      ]);
      setInvoices(invoicesResult.invoices || []);
      setPOs(posResult.pos?.filter((po: any) => po.status === 'approved') || []);
      setItems(itemsResult.items || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!invoiceDocument) return;

    try {
      // Upload via server (bypasses RLS policies)
      const result = await api.uploadInvoiceDocument(invoiceDocument);
      return result.url;
    } catch (error: any) {
      toast.error(`Document upload failed: ${error.message}`);
      return null;
    }
  };

  const handleUploadInvoice = async () => {
    try {
      if (!selectedPO || !invoiceNumber || !invoiceDate || invoiceItems.length === 0) {
        toast.error('Please fill all required fields and add at least one item');
        return;
      }

      // Upload document if provided
      let uploadedDocUrl = documentUrl;
      if (invoiceDocument) {
        uploadedDocUrl = await handleUploadDocument();
        if (!uploadedDocUrl) return; // Upload failed
      }

      const result = await api.uploadInvoice({
        po_id: selectedPO,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        items: invoiceItems,
        document_url: uploadedDocUrl,
        document_name: invoiceDocument?.name || '',
        remarks
      });

      toast.success(`Invoice uploaded successfully! Status: ${result.invoice.status}`);
      
      if (result.invoice.status === 'hold') {
        toast.warning(result.invoice.hold_reason);
      } else if (result.invoice.status === 'awaiting_grn') {
        toast.success('4-way matching passed! Awaiting GRN completion.');
      }

      setUploadDialogOpen(false);
      resetUploadForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to upload invoice: ${error.message}`);
    }
  };

  const handleAdminApprove = async () => {
    if (!selectedInvoice || !approveReason) {
      toast.error('Please provide a reason for approval');
      return;
    }

    try {
      await api.adminApproveInvoice(selectedInvoice.id, approveReason);
      toast.success('Invoice discrepancy approved successfully!');
      setApproveDialogOpen(false);
      setApproveReason('');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to approve invoice: ${error.message}`);
    }
  };

  const handleViewInvoice = async (invoice: any) => {
    try {
      const result = await api.getInvoice(invoice.id);
      setSelectedInvoice({ ...result.invoice, items: result.items });
      setViewDialogOpen(true);
    } catch (error: any) {
      toast.error(`Failed to load invoice details: ${error.message}`);
    }
  };

  const addInvoiceItem = () => {
    if (!selectedItemId) {
      toast.error('Please select an item');
      return;
    }

    const item = items.find(i => i.id === selectedItemId);
    if (!item) return;

    const quantity = parseFloat(itemQuantity || '0');
    const rate = parseFloat(itemRate || '0');

    if (quantity <= 0 || rate <= 0) {
      toast.error('Please enter valid quantity and rate');
      return;
    }

    setInvoiceItems([...invoiceItems, {
      item_id: item.id,
      item_code: item.code,
      item_name: item.name,
      quantity,
      rate,
      total_amount: quantity * rate
    }]);

    // Reset item selection
    setSelectedItemId('');
    setItemQuantity('');
    setItemRate('');
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const resetUploadForm = () => {
    setSelectedPO('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceItems([]);
    setInvoiceDocument(null);
    setDocumentUrl('');
    setRemarks('');
    setSelectedItemId('');
    setItemQuantity('');
    setItemRate('');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'hold': { variant: 'destructive', icon: AlertTriangle },
      'awaiting_grn': { variant: 'secondary', icon: Receipt },
      'approved': { variant: 'default', icon: CheckCircle },
      'pending_verification': { variant: 'secondary', icon: FileText }
    };
    const config = variants[status] || { variant: 'secondary', icon: FileText };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="size-3" />
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    );
  };

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.total_amount, 0);

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
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-gray-500 mt-1">4-way matching & approval workflows</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="size-4" />
              Upload Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Supplier Invoice</DialogTitle>
              <DialogDescription>
                Upload invoice with document attachment. System will perform automatic 4-way matching.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Order *</Label>
                  <Select value={selectedPO} onValueChange={setSelectedPO}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO" />
                    </SelectTrigger>
                    <SelectContent>
                      {pos.map(po => (
                        <SelectItem key={po.id} value={po.id}>
                          {po.po_number} - ₹{po.total_amount?.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number *</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Date *</Label>
                  <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <Input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setInvoiceDocument(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add Invoice Items</Label>
                <div className="grid grid-cols-12 gap-2">
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="col-span-5">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.code} - {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input 
                    type="number" 
                    placeholder="Qty" 
                    className="col-span-2" 
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                  />
                  <Input 
                    type="number" 
                    placeholder="Rate" 
                    className="col-span-3" 
                    step="0.01"
                    value={itemRate}
                    onChange={(e) => setItemRate(e.target.value)}
                  />
                  <Button type="button" onClick={addInvoiceItem} className="col-span-2">Add</Button>
                </div>
              </div>

              {invoiceItems.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.item_code} - {item.item_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.rate.toFixed(2)}</TableCell>
                          <TableCell>₹{item.total_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeInvoiceItem(index)}>
                              <XCircle className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                        <TableCell className="font-bold">₹{totalAmount.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUploadInvoice}>Upload Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-5" />
            All Invoices ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hold Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.invoice_date}</TableCell>
                  <TableCell>₹{inv.total_amount?.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(inv.status)}</TableCell>
                  <TableCell className="max-w-[200px] min-w-[150px]">
                    {inv.hold_reason && (
                      <div className="text-sm text-red-600 break-all whitespace-normal">
                        {inv.hold_reason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(inv)}>
                        <Eye className="size-4" />
                      </Button>
                      {inv.status === 'hold' && currentUser?.is_admin && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setApproveDialogOpen(true);
                          }}
                        >
                          <ShieldCheck className="size-4 mr-1" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No invoices found. Upload your first invoice to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details: {selectedInvoice?.invoice_number}</DialogTitle>
            <DialogDescription>
              View complete invoice information and matching results
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Invoice Date</Label>
                  <p className="font-medium">{selectedInvoice.invoice_date}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Total Amount</Label>
                  <p className="font-medium">₹{selectedInvoice.total_amount?.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                {selectedInvoice.document_url && (
                  <div>
                    <Label className="text-sm text-gray-500">Document</Label>
                    <a href={selectedInvoice.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                      <FileText className="size-4" />
                      View Document
                    </a>
                  </div>
                )}
              </div>

              {selectedInvoice.matching_results && (
                <Alert>
                  <AlertTitle>4-Way Matching Results</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1 mt-2">
                      <p>Quotation Match: <Badge variant={selectedInvoice.matching_results.quotation_match === 'matched' ? 'default' : 'destructive'}>{selectedInvoice.matching_results.quotation_match}</Badge></p>
                      <p>PO Match: <Badge variant={selectedInvoice.matching_results.po_match === 'matched' ? 'default' : 'destructive'}>{selectedInvoice.matching_results.po_match}</Badge></p>
                      <p>GRN Match: <Badge variant={selectedInvoice.matching_results.grn_match === 'matched' ? 'default' : 'destructive'}>{selectedInvoice.matching_results.grn_match}</Badge></p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500 mb-2">Invoice Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_code || item.item_id}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.rate?.toFixed(2)}</TableCell>
                          <TableCell>₹{item.total_amount?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Approval Required</DialogTitle>
            <DialogDescription>
              This invoice has a discrepancy. Please provide a reason for approving this variance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedInvoice?.hold_reason && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Discrepancy Details</AlertTitle>
                <AlertDescription>{selectedInvoice.hold_reason}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Approval Reason *</Label>
              <Textarea 
                value={approveReason} 
                onChange={(e) => setApproveReason(e.target.value)} 
                placeholder="Explain why this discrepancy is acceptable..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminApprove}>Approve Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}