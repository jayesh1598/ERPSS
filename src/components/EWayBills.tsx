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
import { FileCheck, Plus, Eye, AlertTriangle, CheckCircle, XCircle, Truck, MapPin } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function EWayBills() {
  const [ewayBills, setEwayBills] = useState<any[]>([]);
  const [challans, setChallans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [generateEWayOpen, setGenerateEWayOpen] = useState(false);
  const [viewEWayOpen, setViewEWayOpen] = useState(false);
  const [cancelEWayOpen, setCancelEWayOpen] = useState(false);

  const [selectedEWay, setSelectedEWay] = useState<any>(null);

  // E-Way Bill form state
  const [ewayChallanId, setEwayChallanId] = useState('');
  const [ewayInvoiceId, setEwayInvoiceId] = useState('');
  const [ewaySupplyType, setEwaySupplyType] = useState('outward');
  const [ewaySubType, setEwaySubType] = useState('supply');
  const [ewayDocType, setEwayDocType] = useState('invoice');
  const [ewayDocNumber, setEwayDocNumber] = useState('');
  const [ewayDocDate, setEwayDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [ewayFromGSTIN, setEwayFromGSTIN] = useState('');
  const [ewayFromPlace, setEwayFromPlace] = useState('');
  const [ewayFromPincode, setEwayFromPincode] = useState('');
  const [ewayFromState, setEwayFromState] = useState('');
  const [ewayToGSTIN, setEwayToGSTIN] = useState('');
  const [ewayToPlace, setEwayToPlace] = useState('');
  const [ewayToPincode, setEwayToPincode] = useState('');
  const [ewayToState, setEwayToState] = useState('');
  const [ewayTransportMode, setEwayTransportMode] = useState('road');
  const [ewayVehicleNumber, setEwayVehicleNumber] = useState('');
  const [ewayTransporterName, setEwayTransporterName] = useState('');
  const [ewayTransporterId, setEwayTransporterId] = useState('');
  const [ewayDistance, setEwayDistance] = useState('');
  const [ewayCancelReason, setEwayCancelReason] = useState('');
  const [ewayCancelRemarks, setEwayCancelRemarks] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ewayResult, challansResult, invoicesResult, customersResult] = await Promise.all([
        api.getEWayBills(),
        api.getDeliveryChallans(),
        api.getInvoices(),
        api.getParties('customer')
      ]);
      
      setEwayBills(ewayResult.ewayBills || []);
      setChallans(challansResult.challans?.filter((c: any) => c.status === 'approved') || []);
      setInvoices(invoicesResult.invoices || []);
      setCustomers(customersResult.parties || []);
    } catch (error: any) {
      toast.error(`Failed to load e-way bills: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateEWayBill = async () => {
    if (!ewayDocNumber || !ewayFromGSTIN || !ewayToGSTIN || !ewayVehicleNumber || !ewayDistance) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Calculate validity based on distance
      const distance = parseInt(ewayDistance);
      let validityDays = 1;
      if (distance <= 100) validityDays = 1;
      else if (distance <= 300) validityDays = 3;
      else if (distance <= 500) validityDays = 5;
      else validityDays = Math.ceil(distance / 200);

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      await api.generateEWayBill({
        challan_id: ewayChallanId && ewayChallanId !== 'none' ? ewayChallanId : null,
        invoice_id: ewayInvoiceId && ewayInvoiceId !== 'none' ? ewayInvoiceId : null,
        supply_type: ewaySupplyType,
        sub_type: ewaySubType,
        doc_type: ewayDocType,
        doc_number: ewayDocNumber,
        doc_date: ewayDocDate,
        from_gstin: ewayFromGSTIN,
        from_place: ewayFromPlace,
        from_pincode: ewayFromPincode,
        from_state: ewayFromState,
        to_gstin: ewayToGSTIN,
        to_place: ewayToPlace,
        to_pincode: ewayToPincode,
        to_state: ewayToState,
        transport_mode: ewayTransportMode,
        vehicle_number: ewayVehicleNumber,
        transporter_name: ewayTransporterName,
        transporter_id: ewayTransporterId,
        distance: parseInt(ewayDistance),
        valid_until: validUntil.toISOString().split('T')[0]
      });

      toast.success('E-Way Bill generated successfully!');
      setGenerateEWayOpen(false);
      resetEWayForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to generate E-Way Bill: ${error.message}`);
    }
  };

  const handleCancelEWayBill = async () => {
    if (!selectedEWay || !ewayCancelReason) {
      toast.error('Please select reason for cancellation');
      return;
    }

    try {
      await api.cancelEWayBill(selectedEWay.id);
      toast.success('E-Way Bill cancelled successfully');
      setCancelEWayOpen(false);
      setEwayCancelReason('');
      setEwayCancelRemarks('');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to cancel E-Way Bill: ${error.message}`);
    }
  };

  const resetEWayForm = () => {
    setEwayChallanId('');
    setEwayInvoiceId('');
    setEwaySupplyType('outward');
    setEwaySubType('supply');
    setEwayDocType('invoice');
    setEwayDocNumber('');
    setEwayDocDate(new Date().toISOString().split('T')[0]);
    setEwayFromGSTIN('');
    setEwayFromPlace('');
    setEwayFromPincode('');
    setEwayFromState('');
    setEwayToGSTIN('');
    setEwayToPlace('');
    setEwayToPincode('');
    setEwayToState('');
    setEwayTransportMode('road');
    setEwayVehicleNumber('');
    setEwayTransporterName('');
    setEwayTransporterId('');
    setEwayDistance('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Active</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled': return <Badge variant="outline">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

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
          <h1 className="text-3xl font-bold">E-Way Bills</h1>
          <p className="text-gray-500 mt-1">Government E-Way Bill management & tracking</p>
        </div>
        <Dialog open={generateEWayOpen} onOpenChange={setGenerateEWayOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Generate E-Way Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate E-Way Bill</DialogTitle>
              <DialogDescription>
                Create E-Way Bill for goods movement (Required for shipments {'>'} ₹50,000)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <FileCheck className="size-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Note</AlertTitle>
                <AlertDescription className="text-blue-700">
                  E-Way Bill is mandatory for inter-state movement of goods valued over ₹50,000
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eway-challan">From Delivery Challan</Label>
                  <Select value={ewayChallanId} onValueChange={setEwayChallanId}>
                    <SelectTrigger id="eway-challan">
                      <SelectValue placeholder="Select challan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {challans.map(challan => (
                        <SelectItem key={challan.id} value={challan.id}>
                          {challan.challan_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eway-invoice">From Invoice</Label>
                  <Select value={ewayInvoiceId} onValueChange={setEwayInvoiceId}>
                    <SelectTrigger id="eway-invoice">
                      <SelectValue placeholder="Select invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {invoices.map(invoice => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="eway-doc-type">Document Type *</Label>
                  <Select value={ewayDocType} onValueChange={setEwayDocType}>
                    <SelectTrigger id="eway-doc-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Tax Invoice</SelectItem>
                      <SelectItem value="bill_of_supply">Bill of Supply</SelectItem>
                      <SelectItem value="delivery_challan">Delivery Challan</SelectItem>
                      <SelectItem value="credit_note">Credit Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eway-doc-number">Document Number *</Label>
                  <Input
                    id="eway-doc-number"
                    value={ewayDocNumber}
                    onChange={(e) => setEwayDocNumber(e.target.value)}
                    placeholder="Enter document number"
                  />
                </div>

                <div>
                  <Label htmlFor="eway-doc-date">Document Date *</Label>
                  <Input
                    id="eway-doc-date"
                    type="date"
                    value={ewayDocDate}
                    onChange={(e) => setEwayDocDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <MapPin className="size-4" />
                  From Location (Supplier)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eway-from-gstin">GSTIN *</Label>
                    <Input
                      id="eway-from-gstin"
                      value={ewayFromGSTIN}
                      onChange={(e) => setEwayFromGSTIN(e.target.value)}
                      placeholder="29XXXXXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eway-from-place">Place *</Label>
                    <Input
                      id="eway-from-place"
                      value={ewayFromPlace}
                      onChange={(e) => setEwayFromPlace(e.target.value)}
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eway-from-pincode">Pincode *</Label>
                    <Input
                      id="eway-from-pincode"
                      value={ewayFromPincode}
                      onChange={(e) => setEwayFromPincode(e.target.value)}
                      placeholder="560001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eway-from-state">State Code *</Label>
                    <Input
                      id="eway-from-state"
                      value={ewayFromState}
                      onChange={(e) => setEwayFromState(e.target.value)}
                      placeholder="29 (Karnataka)"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <MapPin className="size-4" />
                  To Location (Recipient)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eway-to-gstin">GSTIN *</Label>
                    <Input
                      id="eway-to-gstin"
                      value={ewayToGSTIN}
                      onChange={(e) => setEwayToGSTIN(e.target.value)}
                      placeholder="29XXXXXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eway-to-place">Place *</Label>
                    <Input
                      id="eway-to-place"
                      value={ewayToPlace}
                      onChange={(e) => setEwayToPlace(e.target.value)}
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eway-to-pincode">Pincode *</Label>
                    <Input
                      id="eway-to-pincode"
                      value={ewayToPincode}
                      onChange={(e) => setEwayToPincode(e.target.value)}
                      placeholder="560001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eway-to-state">State Code *</Label>
                    <Input
                      id="eway-to-state"
                      value={ewayToState}
                      onChange={(e) => setEwayToState(e.target.value)}
                      placeholder="29 (Karnataka)"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <Truck className="size-4" />
                  Transport Details
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="eway-transport-mode">Mode *</Label>
                    <Select value={ewayTransportMode} onValueChange={setEwayTransportMode}>
                      <SelectTrigger id="eway-transport-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="road">Road</SelectItem>
                        <SelectItem value="rail">Rail</SelectItem>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="ship">Ship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="eway-vehicle">Vehicle Number *</Label>
                    <Input
                      id="eway-vehicle"
                      value={ewayVehicleNumber}
                      onChange={(e) => setEwayVehicleNumber(e.target.value)}
                      placeholder="KA01AB1234"
                    />
                  </div>

                  <div>
                    <Label htmlFor="eway-distance">Distance (KM) *</Label>
                    <Input
                      id="eway-distance"
                      type="number"
                      min="1"
                      value={ewayDistance}
                      onChange={(e) => setEwayDistance(e.target.value)}
                      placeholder="Enter distance"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="eway-transporter">Transporter Name</Label>
                    <Input
                      id="eway-transporter"
                      value={ewayTransporterName}
                      onChange={(e) => setEwayTransporterName(e.target.value)}
                      placeholder="Transporter name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="eway-transporter-id">Transporter ID/GSTIN</Label>
                    <Input
                      id="eway-transporter-id"
                      value={ewayTransporterId}
                      onChange={(e) => setEwayTransporterId(e.target.value)}
                      placeholder="Transporter GSTIN"
                    />
                  </div>
                </div>
              </div>

              {ewayDistance && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="size-4 text-green-600" />
                  <AlertTitle className="text-green-800">Validity Calculation</AlertTitle>
                  <AlertDescription className="text-green-700">
                    For {ewayDistance} km, E-Way Bill will be valid for{' '}
                    {parseInt(ewayDistance) <= 100 ? '1' : 
                     parseInt(ewayDistance) <= 300 ? '3' :
                     parseInt(ewayDistance) <= 500 ? '5' :
                     Math.ceil(parseInt(ewayDistance) / 200)} day(s)
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateEWayOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateEWayBill}>
                Generate E-Way Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="size-5" />
            E-Way Bills ({ewayBills.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ewayBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileCheck className="size-12 mx-auto mb-4 opacity-20" />
              <p>No E-Way Bills found</p>
              <p className="text-sm">Generate your first E-Way Bill</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-Way Bill Number</TableHead>
                  <TableHead>Document Number</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ewayBills.map((eway) => (
                  <TableRow key={eway.id}>
                    <TableCell className="font-medium">{eway.eway_bill_number || 'Pending'}</TableCell>
                    <TableCell>{eway.doc_number}</TableCell>
                    <TableCell className="text-sm">
                      {eway.from_place} → {eway.to_place}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{eway.vehicle_number}</TableCell>
                    <TableCell>{eway.distance} km</TableCell>
                    <TableCell className={isExpired(eway.valid_until) ? 'text-red-600 font-semibold' : ''}>
                      {new Date(eway.valid_until).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(eway.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="size-3 mr-1" />
                          View
                        </Button>
                        {eway.status === 'active' && (
                          <Dialog open={cancelEWayOpen} onOpenChange={(open) => {
                            setCancelEWayOpen(open);
                            if (open) setSelectedEWay(eway);
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <XCircle className="size-3 mr-1" />
                                Cancel
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Cancel E-Way Bill</DialogTitle>
                                <DialogDescription>
                                  Cancel E-Way Bill: {eway.eway_bill_number}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Alert variant="destructive">
                                  <AlertTriangle className="size-4" />
                                  <AlertTitle>Warning</AlertTitle>
                                  <AlertDescription>
                                    E-Way Bill can only be cancelled within 24 hours of generation
                                  </AlertDescription>
                                </Alert>

                                <div>
                                  <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
                                  <Select value={ewayCancelReason} onValueChange={setEwayCancelReason}>
                                    <SelectTrigger id="cancel-reason">
                                      <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="duplicate">Duplicate</SelectItem>
                                      <SelectItem value="data_entry_mistake">Data Entry Mistake</SelectItem>
                                      <SelectItem value="order_cancelled">Order Cancelled</SelectItem>
                                      <SelectItem value="others">Others</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label htmlFor="cancel-remarks">Remarks</Label>
                                  <Textarea
                                    id="cancel-remarks"
                                    value={ewayCancelRemarks}
                                    onChange={(e) => setEwayCancelRemarks(e.target.value)}
                                    placeholder="Enter cancellation remarks"
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setCancelEWayOpen(false)}>
                                  Close
                                </Button>
                                <Button variant="destructive" onClick={handleCancelEWayBill}>
                                  Cancel E-Way Bill
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}