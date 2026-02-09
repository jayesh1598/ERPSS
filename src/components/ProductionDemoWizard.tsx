import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { 
  Rocket, 
  CheckCircle, 
  Circle, 
  Loader2,
  Package,
  ShoppingCart,
  Factory,
  ClipboardCheck,
  PackageCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  action?: () => Promise<void>;
}

export function ProductionDemoWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [demoData, setDemoData] = useState<any>({});

  const [steps, setSteps] = useState<DemoStep[]>([
    {
      id: 'items',
      title: 'Create Master Data Items',
      description: 'Steel Rod 12mm × 6m (FG), Steel Billet (RM), Alloy Mix (RM)',
      icon: Package,
      status: 'pending'
    },
    {
      id: 'inventory',
      title: 'Setup Initial Inventory',
      description: 'Steel Billet: 3000 kg, Alloy Mix: 100 kg',
      icon: PackageCheck,
      status: 'pending'
    },
    {
      id: 'bom',
      title: 'Create Bill of Materials',
      description: 'BOM for Steel Rod: 5 kg Steel Billet + 0.05 kg Alloy Mix per unit',
      icon: ClipboardCheck,
      status: 'pending'
    },
    {
      id: 'workorder',
      title: 'Create Work Order WO-2026-001',
      description: 'Product: Steel Rod 12mm × 6m, Quantity: 1000 units',
      icon: Factory,
      status: 'pending'
    },
    {
      id: 'ready',
      title: 'Demo Setup Complete!',
      description: 'Navigate to Production module to start the workflow',
      icon: Rocket,
      status: 'pending'
    }
  ]);

  const updateStepStatus = (index: number, status: DemoStep['status']) => {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, status } : step));
  };

  const setupDemo = async () => {
    setRunning(true);
    let stepIndex = 0;

    try {
      // Step 1: Create Items
      updateStepStatus(stepIndex, 'running');
      setCurrentStep(stepIndex);

      // Create Steel Rod (Finished Good)
      const steelRodItem = await api.createItem({
        code: 'FG-STEEL-ROD-12MM',
        name: 'Steel Rod 12mm × 6m',
        description: 'High quality steel rod for construction',
        type: 'FG',
        uom: 'PCS',
        category: 'Finished Products',
        standard_cost: 850,
        selling_price: 1200,
        min_stock_level: 100,
        reorder_level: 200,
        max_stock_level: 2000,
        hsn_code: '72142000',
        gst_rate: 18
      });

      // Create Steel Billet (Raw Material)
      const steelBilletItem = await api.createItem({
        code: 'RM-STEEL-BILLET',
        name: 'Steel Billet',
        description: 'Raw steel billet for rod manufacturing',
        type: 'RM',
        uom: 'KG',
        category: 'Raw Materials',
        standard_cost: 65,
        selling_price: 0,
        min_stock_level: 5000,
        reorder_level: 8000,
        max_stock_level: 20000,
        hsn_code: '72071100',
        gst_rate: 18
      });

      // Create Alloy Mix (Raw Material)
      const alloyMixItem = await api.createItem({
        code: 'RM-ALLOY-MIX',
        name: 'Alloy Mix',
        description: 'Special alloy mixture for steel strengthening',
        type: 'RM',
        uom: 'KG',
        category: 'Raw Materials',
        standard_cost: 450,
        selling_price: 0,
        min_stock_level: 200,
        reorder_level: 300,
        max_stock_level: 1000,
        hsn_code: '72024100',
        gst_rate: 18
      });

      setDemoData(prev => ({
        ...prev,
        steelRodItem: steelRodItem.item,
        steelBilletItem: steelBilletItem.item,
        alloyMixItem: alloyMixItem.item
      }));

      toast.success(' Created 3 items: Steel Rod, Steel Billet, Alloy Mix');
      updateStepStatus(stepIndex, 'completed');
      stepIndex++;

      // Step 2: Setup Inventory
      updateStepStatus(stepIndex, 'running');
      setCurrentStep(stepIndex);

      // Get default warehouse
      const warehousesResult = await api.getWarehouses();
      const mainWarehouse = warehousesResult.warehouses?.[0];

      if (!mainWarehouse) {
        throw new Error('No warehouse found. Please create a warehouse first.');
      }

      // Add Steel Billet inventory (3000 kg - insufficient for 1000 units)
      await api.updateStock({
        item_id: steelBilletItem.item.id,
        warehouse_id: mainWarehouse.id,
        quantity: 3000,
        transaction_type: 'in',
        reference_type: 'manual_adjustment',
        reference_id: 'DEMO-SETUP-001',
        remarks: 'Demo setup: Initial stock for Steel Billet'
      });

      // Add Alloy Mix inventory (100 kg - sufficient)
      await api.updateStock({
        item_id: alloyMixItem.item.id,
        warehouse_id: mainWarehouse.id,
        quantity: 100,
        transaction_type: 'in',
        reference_type: 'manual_adjustment',
        reference_id: 'DEMO-SETUP-002',
        remarks: 'Demo setup: Initial stock for Alloy Mix'
      });

      setDemoData(prev => ({
        ...prev,
        mainWarehouse
      }));

      toast.success('✅ Added inventory: Steel Billet (3000 kg), Alloy Mix (100 kg)');
      updateStepStatus(stepIndex, 'completed');
      stepIndex++;

      // Step 3: Create BOM
      updateStepStatus(stepIndex, 'running');
      setCurrentStep(stepIndex);

      const bomData = {
        finished_item_id: steelRodItem.item.id,
        version: '1.0',
        is_active: true,
        description: 'Bill of Materials for Steel Rod 12mm × 6m production',
        components: [
          {
            item_id: steelBilletItem.item.id,
            quantity: 5.0, // 5 kg per unit
            uom: 'KG',
            is_optional: false
          },
          {
            item_id: alloyMixItem.item.id,
            quantity: 0.05, // 0.05 kg (50g) per unit
            uom: 'KG',
            is_optional: false
          }
        ]
      };

      const bomResult = await api.createBOM(bomData);

      setDemoData(prev => ({
        ...prev,
        bom: bomResult.bom
      }));

      toast.success('✅ Created BOM: 5 kg Steel Billet + 0.05 kg Alloy Mix per unit');
      updateStepStatus(stepIndex, 'completed');
      stepIndex++;

      // Step 4: Create Work Order
      updateStepStatus(stepIndex, 'running');
      setCurrentStep(stepIndex);

      const workOrderData = {
        bom_id: bomResult.bom.id,
        quantity: 1000,
        warehouse_id: mainWarehouse.id,
        planned_start_date: new Date().toISOString().split('T')[0],
        planned_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'high',
        remarks: 'Demo Work Order: Steel Rod 12mm × 6m - 1000 units production'
      };

      const workOrderResult = await api.createWorkOrder(workOrderData);

      setDemoData(prev => ({
        ...prev,
        workOrder: workOrderResult.wo // Server returns 'wo', not 'workOrder'
      }));

      toast.success(`✅ Created Work Order: ${workOrderResult.wo.wo_number}`);
      updateStepStatus(stepIndex, 'completed');
      stepIndex++;

      // Step 5: Ready
      updateStepStatus(stepIndex, 'completed');
      setCurrentStep(stepIndex);

      toast.success('🎉 Demo setup complete! Ready to start production workflow', {
        duration: 5000
      });

    } catch (error: any) {
      console.error('Demo setup error:', error);
      toast.error(`Setup failed: ${error.message}`);
      updateStepStatus(stepIndex, 'error');
    } finally {
      setRunning(false);
    }
  };

  const getStepIcon = (step: DemoStep) => {
    if (step.status === 'completed') return CheckCircle;
    if (step.status === 'running') return Loader2;
    if (step.status === 'error') return AlertTriangle;
    return Circle;
  };

  const getStepColor = (step: DemoStep) => {
    if (step.status === 'completed') return 'text-green-600';
    if (step.status === 'running') return 'text-blue-600';
    if (step.status === 'error') return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
          <Rocket className="size-10 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold">Production Demo Wizard</h1>
        <p className="text-gray-600 text-lg">
          Automated setup for complete Steel Rod manufacturing workflow
        </p>
      </div>

      {/* Demo Scenario Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-900">Demo Scenario: Steel Rod Manufacturing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-lg mb-2">Work Order WO-2026-001</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Product:</span>
                <p className="font-semibold">Steel Rod 12mm × 6m</p>
              </div>
              <div>
                <span className="text-gray-600">Quantity:</span>
                <p className="font-semibold">1000 units</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Material Requirements:</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-xs text-gray-600">Steel Billet</p>
                <p className="font-semibold text-red-600">Required: 5000 kg</p>
                <p className="text-sm text-gray-700">Available: 3000 kg</p>
                <Badge variant="destructive" className="mt-1">Shortage: 2000 kg</Badge>
              </div>
              <div className="bg-white p-3 rounded border border-green-200">
                <p className="text-xs text-gray-600">Alloy Mix</p>
                <p className="font-semibold text-green-600">Required: 50 kg</p>
                <p className="text-sm text-gray-700">Available: 100 kg</p>
                <Badge className="bg-green-500 mt-1">Sufficient</Badge>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-300">
            <AlertTitle className="text-blue-900">Workflow Steps to Demonstrate:</AlertTitle>
            <AlertDescription className="text-blue-800 text-sm space-y-1 mt-2">
              <p>✅ Step 8: Material Issue (with shortage → Create PR)</p>
              <p>✅ Step 9: Production Entry (Day 1: 300, Day 2: 400, Day 3: 300)</p>
              <p>✅ Step 10: Production QC (980 pass, 20 reject)</p>
              <p>✅ Step 11: Finished Goods (980 units ready for sales)</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Setup Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Setup Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = getStepIcon(step);
              const color = getStepColor(step);

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    step.status === 'running'
                      ? 'bg-blue-50 border-blue-300'
                      : step.status === 'completed'
                      ? 'bg-green-50 border-green-300'
                      : step.status === 'error'
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Icon
                    className={`size-6 flex-shrink-0 mt-1 ${color} ${
                      step.status === 'running' ? 'animate-spin' : ''
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  {step.status === 'completed' && (
                    <Badge className="bg-green-500">Done</Badge>
                  )}
                  {step.status === 'running' && (
                    <Badge className="bg-blue-500">Running...</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {steps.every(s => s.status !== 'completed') && (
          <Button
            size="lg"
            onClick={setupDemo}
            disabled={running}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
          >
            {running ? (
              <>
                <Loader2 className="size-5 mr-2 animate-spin" />
                Setting Up Demo...
              </>
            ) : (
              <>
                <Rocket className="size-5 mr-2" />
                Start Demo Setup
              </>
            )}
          </Button>
        )}

        {steps.every(s => s.status === 'completed') && (
          <Button
            size="lg"
            onClick={() => navigate('/production')}
            className="bg-green-600 hover:bg-green-700 px-8 py-6 text-lg"
          >
            Go to Production Module
            <ArrowRight className="size-5 ml-2" />
          </Button>
        )}

        {steps.every(s => s.status === 'completed') && (
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/production-demo-playbook')}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
          >
            📘 Open Step-by-Step Playbook
          </Button>
        )}
      </div>

      {/* Next Steps Guide */}
      {steps.every(s => s.status === 'completed') && (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">✨ Setup Complete! Next Steps:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                  8
                </div>
                <div>
                  <p className="font-semibold">Material Issue</p>
                  <p className="text-gray-600">
                    1. Go to Production → Find WO-2026-001<br />
                    2. Click "Issue Materials"<br />
                    3. You'll see shortage alert for Steel Billet<br />
                    4. Click "Raise Purchase Requisition"<br />
                    5. (For demo: Add 2000 kg Steel Billet to inventory manually)<br />
                    6. Issue all materials
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                  9
                </div>
                <div>
                  <p className="font-semibold">Production Entry</p>
                  <p className="text-gray-600">
                    1. Record production: 300 units (Day 1)<br />
                    2. Record production: 400 units (Day 2)<br />
                    3. Record production: 300 units (Day 3)<br />
                    4. Total: 1000 units, Waste: 15 kg
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                  10
                </div>
                <div>
                  <p className="font-semibold">Production QC</p>
                  <p className="text-gray-600">
                    1. Click "QC Inspection"<br />
                    2. Select "Approve"<br />
                    3. Enter rejected quantity: 20<br />
                    4. Add QC remarks<br />
                    5. 980 units will be added to Finished Goods
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                  11
                </div>
                <div>
                  <p className="font-semibold">Finished Goods</p>
                  <p className="text-gray-600">
                    1. Navigate to Finished Goods page<br />
                    2. See 980 units of Steel Rod 12mm × 6m<br />
                    3. Ready for Sales Orders!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}