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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { ClipboardCheck, Plus, Eye, CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function QualityControl() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [grns, setGRNs] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Dialog states
  const [createInspectionOpen, setCreateInspectionOpen] = useState(false);
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [adminOverrideOpen, setAdminOverrideOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);

  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateSteps, setTemplateSteps] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Form states
  const [inspTemplateId, setInspTemplateId] = useState('');
  const [inspReferenceType, setInspReferenceType] = useState('grn');
  const [inspReferenceId, setInspReferenceId] = useState('');
  const [inspItemId, setInspItemId] = useState('');
  const [inspBatchNumber, setInspBatchNumber] = useState('');
  const [inspQuantity, setInspQuantity] = useState('');
  const [inspRemarks, setInspRemarks] = useState('');
  const [inspStatus, setInspStatus] = useState('passed');

  const [overrideStatus, setOverrideStatus] = useState('passed');
  const [overrideReason, setOverrideReason] = useState('');

  // Template form
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateType, setTemplateType] = useState('incoming');
  const [templateStepsData, setTemplateStepsData] = useState<any[]>([]);

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
      const [inspectionsResult, templatesResult, grnsResult, itemsResult] = await Promise.all([
        api.getQCInspections(),
        api.getQCTemplates(),
        api.getGRNs(),
        api.getItems()
      ]);
      
      setInspections(inspectionsResult.inspections || []);
      setTemplates(templatesResult.templates || []);
      setGRNs(grnsResult.grns?.filter((g: any) => g.status === 'pending_qc') || []);
      setItems(itemsResult.items || []);
    } catch (error: any) {
      toast.error(`Failed to load QC data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInspection = async () => {
    if (!inspTemplateId || !inspItemId || !inspQuantity) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createQCInspection({
        template_id: inspTemplateId,
        reference_type: inspReferenceType || null,
        reference_id: inspReferenceId || null,
        item_id: inspItemId,
        batch_number: inspBatchNumber || null,
        quantity: parseFloat(inspQuantity)
      });

      toast.success('QC Inspection created successfully!');
      setCreateInspectionOpen(false);
      resetInspectionForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create inspection: ${error.message}`);
    }
  };

  const handleLoadInspection = async (inspection: any) => {
    try {
      const [stepsResult, resultsResult] = await Promise.all([
        api.getQCTemplateSteps(inspection.template_id),
        api.getQCInspectionResults(inspection.id)
      ]);

      setSelectedInspection(inspection);
      setTemplateSteps(stepsResult.steps || []);
      
      // Initialize test results from steps
      if (resultsResult.results && resultsResult.results.length > 0) {
        setTestResults(resultsResult.results);
      } else {
        setTestResults(
          stepsResult.steps.map((step: any) => ({
            step_id: step.id,
            parameter: step.parameter,
            expected_value: step.expected_value,
            actual_value: '',
            result: 'pending'
          }))
        );
      }

      setInspectDialogOpen(true);
    } catch (error: any) {
      toast.error(`Failed to load inspection: ${error.message}`);
    }
  };

  const handleCompleteInspection = async () => {
    // Validate all tests have results
    const allTested = testResults.every(r => r.actual_value && r.result);
    if (!allTested) {
      toast.error('Please complete all test parameters');
      return;
    }

    // Determine overall status
    const hasFailed = testResults.some(r => r.result === 'fail');
    const finalStatus = hasFailed ? 'failed' : inspStatus;

    try {
      await api.completeQCInspection(
        selectedInspection.id,
        testResults,
        finalStatus,
        inspRemarks
      );

      toast.success(`QC Inspection ${finalStatus}!`);
      setInspectDialogOpen(false);
      setInspRemarks('');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to complete inspection: ${error.message}`);
    }
  };

  const handleAdminOverride = async () => {
    if (!overrideReason) {
      toast.error('Please provide a reason for override');
      return;
    }

    try {
      await api.adminOverrideQC(selectedInspection.id, overrideStatus, overrideReason);
      toast.success('QC decision overridden by Admin!');
      setAdminOverrideOpen(false);
      setOverrideReason('');
      loadData();
    } catch (error: any) {
      toast.error(`Failed to override QC: ${error.message}`);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateType || templateStepsData.length === 0) {
      toast.error('Please provide template name, type, and at least one step');
      return;
    }

    try {
      await api.createQCTemplate({
        name: templateName,
        description: templateDescription,
        qc_type: templateType,
        steps: templateStepsData
      });

      toast.success('QC Template created successfully!');
      setCreateTemplateOpen(false);
      resetTemplateForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create template: ${error.message}`);
    }
  };

  const addTemplateStep = () => {
    const parameter = (document.getElementById('step-parameter') as HTMLInputElement)?.value;
    const expectedValue = (document.getElementById('step-expected') as HTMLInputElement)?.value;
    const tolerance = (document.getElementById('step-tolerance') as HTMLInputElement)?.value;

    if (!parameter || !expectedValue) {
      toast.error('Please enter parameter and expected value');
      return;
    }

    setTemplateStepsData([
      ...templateStepsData,
      { parameter, expected_value: expectedValue, tolerance: tolerance || null }
    ]);

    // Clear inputs
    (document.getElementById('step-parameter') as HTMLInputElement).value = '';
    (document.getElementById('step-expected') as HTMLInputElement).value = '';
    (document.getElementById('step-tolerance') as HTMLInputElement).value = '';
  };

  const updateTestResult = (index: number, field: string, value: any) => {
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    setTestResults(updated);
  };

  const resetInspectionForm = () => {
    setInspTemplateId('');
    setInspReferenceId('');
    setInspItemId('');
    setInspBatchNumber('');
    setInspQuantity('');
  };

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateType('incoming');
    setTemplateStepsData([]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'pending': { variant: 'secondary', icon: ClipboardCheck, label: 'Pending' },
      'in_progress': { variant: 'secondary', icon: ClipboardCheck, label: 'In Progress' },
      'passed': { variant: 'default', icon: CheckCircle, label: 'Passed' },
      'failed': { variant: 'destructive', icon: XCircle, label: 'Failed' },
      'rejected': { variant: 'destructive', icon: XCircle, label: 'Rejected' }
    };
    const config = variants[status] || variants['pending'];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="size-3" />
        {config.label}
      </Badge>
    );
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.code} - ${item.name}` : itemId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  const pendingInspections = inspections.filter(i => i.status === 'pending' || i.status === 'in_progress');
  const completedInspections = inspections.filter(i => i.status === 'passed' || i.status === 'failed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quality Control</h1>
          <p className="text-gray-500 mt-1">Configurable inspection workflows with multi-level approvals</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="size-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create QC Template</DialogTitle>
                <DialogDescription>Define inspection parameters and acceptance criteria</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Incoming Material Inspection" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Template description..." rows={2} />
                </div>

                <div className="space-y-2">
                  <Label>QC Type *</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">Incoming Material</SelectItem>
                      <SelectItem value="in_process">In-Process</SelectItem>
                      <SelectItem value="final">Final Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Add Test Parameters</Label>
                  <div className="grid grid-cols-12 gap-2">
                    <Input id="step-parameter" placeholder="Parameter" className="col-span-5" />
                    <Input id="step-expected" placeholder="Expected Value" className="col-span-4" />
                    <Input id="step-tolerance" placeholder="Tolerance" className="col-span-2" />
                    <Button type="button" onClick={addTemplateStep} className="col-span-1">+</Button>
                  </div>
                </div>

                {templateStepsData.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Test Parameters ({templateStepsData.length})</h4>
                    {templateStepsData.map((step, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span>{step.parameter}: {step.expected_value} {step.tolerance && `±${step.tolerance}`}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTemplateStepsData(templateStepsData.filter((_, i) => i !== idx))}
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTemplateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTemplate}>Create Template</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createInspectionOpen} onOpenChange={setCreateInspectionOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                New Inspection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create QC Inspection</DialogTitle>
                <DialogDescription>Initiate quality inspection for incoming/production items</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>QC Template *</Label>
                  <Select value={inspTemplateId} onValueChange={setInspTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(tmpl => (
                        <SelectItem key={tmpl.id} value={tmpl.id}>
                          {tmpl.name} ({tmpl.qc_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Reference Type</Label>
                    <Select value={inspReferenceType} onValueChange={setInspReferenceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grn">GRN</SelectItem>
                        <SelectItem value="work_order">Work Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reference</Label>
                    <Select value={inspReferenceId} onValueChange={setInspReferenceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {inspReferenceType === 'grn' && grns.map(grn => (
                          <SelectItem key={grn.id} value={grn.id}>{grn.grn_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Item *</Label>
                  <Select value={inspItemId} onValueChange={setInspItemId}>
                    <SelectTrigger>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input type="number" value={inspQuantity} onChange={(e) => setInspQuantity(e.target.value)} placeholder="0" min="0" step="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input value={inspBatchNumber} onChange={(e) => setInspBatchNumber(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateInspectionOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateInspection}>Create Inspection</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {pendingInspections.length > 0 && (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Pending Inspections</AlertTitle>
          <AlertDescription>
            {pendingInspections.length} inspection(s) require QC testing.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingInspections.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedInspections.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="size-5" />
                Pending Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inspection #</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInspections.map((insp) => (
                    <TableRow key={insp.id}>
                      <TableCell className="font-medium">{insp.inspection_number}</TableCell>
                      <TableCell>{getItemName(insp.item_id)}</TableCell>
                      <TableCell>{insp.quantity}</TableCell>
                      <TableCell>{insp.reference_type}</TableCell>
                      <TableCell>{getStatusBadge(insp.status)}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleLoadInspection(insp)}>
                          <ClipboardCheck className="size-4 mr-1" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingInspections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500">
                        No pending inspections.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inspection #</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Inspected At</TableHead>
                    <TableHead>Admin Override</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedInspections.map((insp) => (
                    <TableRow key={insp.id}>
                      <TableCell className="font-medium">{insp.inspection_number}</TableCell>
                      <TableCell>{getItemName(insp.item_id)}</TableCell>
                      <TableCell>{insp.quantity}</TableCell>
                      <TableCell>{getStatusBadge(insp.status)}</TableCell>
                      <TableCell>{insp.inspected_at ? new Date(insp.inspected_at).toLocaleString() : '-'}</TableCell>
                      <TableCell>{insp.admin_override ? <Badge variant="secondary">Yes</Badge> : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleLoadInspection(insp)}>
                            <Eye className="size-4" />
                          </Button>
                          {insp.status === 'failed' && currentUser?.is_admin && !insp.admin_override && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInspection(insp);
                                setAdminOverrideOpen(true);
                              }}
                            >
                              <ShieldCheck className="size-4 mr-1" />
                              Override
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {completedInspections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        No completed inspections.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>QC Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>QC Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((tmpl) => (
                    <TableRow key={tmpl.id}>
                      <TableCell className="font-medium">{tmpl.name}</TableCell>
                      <TableCell><Badge>{tmpl.qc_type}</Badge></TableCell>
                      <TableCell>{tmpl.description || '-'}</TableCell>
                      <TableCell>{tmpl.is_active ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  {templates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        No templates found. Create your first template to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Inspection Dialog */}
      <Dialog open={inspectDialogOpen} onOpenChange={setInspectDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>QC Inspection: {selectedInspection?.inspection_number}</DialogTitle>
            <DialogDescription>
              Complete quality tests for {selectedInspection && getItemName(selectedInspection.item_id)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {testResults.map((test, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{test.parameter}</h4>
                  <Badge variant="secondary">Expected: {test.expected_value}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Actual Value</Label>
                    <Input
                      value={test.actual_value}
                      onChange={(e) => updateTestResult(index, 'actual_value', e.target.value)}
                      placeholder="Enter measured value"
                      disabled={selectedInspection?.status !== 'pending' && selectedInspection?.status !== 'in_progress'}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Result</Label>
                    <Select
                      value={test.result}
                      onValueChange={(value) => updateTestResult(index, 'result', value)}
                      disabled={selectedInspection?.status !== 'pending' && selectedInspection?.status !== 'in_progress'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}

            {(selectedInspection?.status === 'pending' || selectedInspection?.status === 'in_progress') && (
              <>
                <div className="space-y-2">
                  <Label>Overall Status</Label>
                  <Select value={inspStatus} onValueChange={setInspStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea value={inspRemarks} onChange={(e) => setInspRemarks(e.target.value)} placeholder="Optional inspection remarks..." rows={3} />
                </div>
              </>
            )}

            {selectedInspection?.admin_override && (
              <Alert>
                <ShieldCheck className="size-4" />
                <AlertTitle>Admin Override Applied</AlertTitle>
                <AlertDescription>
                  Reason: {selectedInspection.admin_override_reason}
                </AlertDescription>
              </Alert>
            )}
          </div>
          {(selectedInspection?.status === 'pending' || selectedInspection?.status === 'in_progress') && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setInspectDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCompleteInspection}>Complete Inspection</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Override Dialog */}
      <Dialog open={adminOverrideOpen} onOpenChange={setAdminOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Override - QC Decision</DialogTitle>
            <DialogDescription>
              Override the QC failure decision. Requires justification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Override Status *</Label>
              <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Pass (Accept Material)</SelectItem>
                  <SelectItem value="failed">Fail (Reject Material)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Override Reason *</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this override is necessary..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminOverrideOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminOverride}>Apply Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}