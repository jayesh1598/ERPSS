import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Package,
  Factory,
  ClipboardCheck,
  PackageCheck,
  PlayCircle,
  ShoppingCart,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router';

interface Step {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: any;
  color: string;
  instructions: string[];
  path?: string;
  completed: boolean;
}

export function ProductionDemoPlaybook() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'material-issue',
      number: 8,
      title: 'Material Issue',
      description: 'Issue raw materials and handle shortage with Purchase Requisition',
      icon: Package,
      color: 'red',
      instructions: [
        'Go to Production → Find your Work Order (WO-XXXX)',
        'Click "Issue Materials" button',
        'You\'ll see shortage alert for Steel Billet (Need: 5000 kg, Have: 3000 kg)',
        'Click "Raise Purchase Requisition to Purchase Department"',
        'Fill in the reason and create PR',
        'For demo: Go to Inventory → Stock Adjustment → Add 2000 kg Steel Billet',
        'Return to Production → Click "Issue Materials & Start Production"',
        'Materials deducted from inventory, WO status → "In Progress"'
      ],
      path: '/production',
      completed: false
    },
    {
      id: 'production-entry',
      number: 9,
      title: 'Production Entry',
      description: 'Record production output across multiple days',
      icon: Factory,
      color: 'green',
      instructions: [
        'Find your Work Order (status: "In Progress")',
        'Click "Record Production" button',
        'Day 1: Enter Quantity: 300, Click "Record Production" → Progress: 30%',
        'Day 2: Enter Quantity: 400, Click "Record Production" → Progress: 70%',
        'Day 3: Enter Quantity: 300, Waste: 15 kg, Click "Record Production" → Progress: 100%',
        'Total produced: 1000 units, Waste: 15 kg',
        'WO status automatically changes to "QC Pending"'
      ],
      path: '/production',
      completed: false
    },
    {
      id: 'production-qc',
      number: 10,
      title: 'Production QC',
      description: 'Inspect finished goods and approve with partial rejection',
      icon: ClipboardCheck,
      color: 'purple',
      instructions: [
        'Find your Work Order (status: "QC Pending")',
        'Click "QC Inspection" button',
        'Select Decision: "Approve"',
        'Enter Rejected Quantity: 20 units',
        'Add QC Remarks: "Minor surface defects on 20 units"',
        'Click "Approve & Complete QC"',
        'Result: 980 units approved → Added to Finished Goods Inventory',
        '20 units rejected → Marked as defective',
        'WO status → "Completed"'
      ],
      path: '/production',
      completed: false
    },
    {
      id: 'finished-goods',
      number: 11,
      title: 'Finished Goods',
      description: 'View completed inventory ready for sales',
      icon: PackageCheck,
      color: 'blue',
      instructions: [
        'Navigate to "Finished Goods" page',
        'Search for "Steel Rod 12mm × 6m"',
        'You\'ll see 980 units available in stock',
        'View details: Item code, quantity, value, warehouse location',
        'These units are now ready for Sales Orders!',
        'Create a Sales Order to fulfill customer demands'
      ],
      path: '/finished-goods',
      completed: false
    }
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [expandedStep, setExpandedStep] = useState<string>('material-issue');

  const markStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    
    // Move to next step
    const currentIndex = steps.findIndex(s => s.id === stepId);
    if (currentIndex < steps.length - 1) {
      setCurrentStepIndex(currentIndex + 1);
      setExpandedStep(steps[currentIndex + 1].id);
    }
  };

  const getStepIcon = (step: Step) => {
    return step.completed ? CheckCircle2 : Circle;
  };

  const getStepBorderColor = (step: Step) => {
    if (step.completed) return 'border-green-300 bg-green-50';
    if (expandedStep === step.id) return `border-${step.color}-300 bg-${step.color}-50`;
    return 'border-gray-200 bg-white';
  };

  const getStepIconColor = (step: Step) => {
    if (step.completed) return 'text-green-600';
    return `text-${step.color}-600`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <PlayCircle className="size-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold">Production Demo Playbook</h1>
        <p className="text-gray-600 text-lg">
          Step-by-step guide through the complete Steel Rod manufacturing workflow
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="text-blue-900">Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Completed Steps</p>
              <p className="text-3xl font-bold text-blue-900">
                {steps.filter(s => s.completed).length} / {steps.length}
              </p>
            </div>
            <div className="flex gap-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : expandedStep === step.id
                      ? `bg-${step.color}-500 text-white`
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.number}
                </div>
              ))}
            </div>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Alert className="bg-yellow-50 border-yellow-300">
        <AlertTriangle className="size-5 text-yellow-600" />
        <AlertTitle className="text-yellow-900">Before You Begin</AlertTitle>
        <AlertDescription className="text-yellow-800">
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Make sure you've completed the Demo Setup Wizard first</li>
            <li>You should have a Work Order (WO-XXXX) already created</li>
            <li>Initial inventory: Steel Billet (3000 kg), Alloy Mix (100 kg)</li>
            <li>Follow each step in sequence for the best experience</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = getStepIcon(step);
          const StepIcon = step.icon;
          const isExpanded = expandedStep === step.id;

          return (
            <Card
              key={step.id}
              className={`border-2 transition-all ${getStepBorderColor(step)}`}
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => setExpandedStep(isExpanded ? '' : step.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Step Number Circle */}
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                      step.completed
                        ? 'bg-green-500 text-white'
                        : `bg-${step.color}-500 text-white`
                    }`}
                  >
                    {step.number}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StepIcon className={`size-6 ${getStepIconColor(step)}`} />
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      {step.completed && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="size-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {!step.completed && isExpanded && (
                        <Badge className={`bg-${step.color}-500`}>
                          Current Step
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600">{step.description}</p>
                  </div>

                  {/* Status Icon */}
                  <Icon
                    className={`size-8 flex-shrink-0 ${
                      step.completed ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="border-t pt-4 space-y-4">
                    {/* Instructions */}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                        <Info className="size-4" />
                        Detailed Instructions:
                      </h4>
                      <ol className="space-y-3">
                        {step.instructions.map((instruction, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-sm text-gray-700 pt-0.5">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      {step.path && (
                        <Button
                          onClick={() => navigate(step.path!)}
                          className={`bg-${step.color}-600 hover:bg-${step.color}-700`}
                        >
                          Go to {step.title}
                          <ArrowRight className="size-4 ml-2" />
                        </Button>
                      )}
                      
                      {!step.completed && (
                        <Button
                          variant="outline"
                          onClick={() => markStepComplete(step.id)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle2 className="size-4 mr-2" />
                          Mark as Complete
                        </Button>
                      )}
                    </div>

                    {/* Tips */}
                    {step.id === 'material-issue' && (
                      <Alert className="bg-blue-50 border-blue-300 mt-4">
                        <Info className="size-4 text-blue-600" />
                        <AlertTitle className="text-blue-900">💡 Pro Tip</AlertTitle>
                        <AlertDescription className="text-blue-800 text-sm">
                          The shortage detection is automatic! When you try to issue materials,
                          the system will calculate required quantities based on the BOM and compare
                          with available stock. The "Raise Purchase Requisition" button appears only
                          when there's a shortage.
                        </AlertDescription>
                      </Alert>
                    )}

                    {step.id === 'production-entry' && (
                      <Alert className="bg-green-50 border-green-300 mt-4">
                        <Info className="size-4 text-green-600" />
                        <AlertTitle className="text-green-900">💡 Pro Tip</AlertTitle>
                        <AlertDescription className="text-green-800 text-sm">
                          You can record production in batches! The progress bar updates in real-time
                          as you add entries. Total produced quantity is cumulative across all entries.
                          When produced quantity reaches target, the WO automatically moves to "QC Pending".
                        </AlertDescription>
                      </Alert>
                    )}

                    {step.id === 'production-qc' && (
                      <Alert className="bg-purple-50 border-purple-300 mt-4">
                        <Info className="size-4 text-purple-600" />
                        <AlertTitle className="text-purple-900">💡 Pro Tip</AlertTitle>
                        <AlertDescription className="text-purple-800 text-sm">
                          Production QC is for finished goods AFTER manufacturing. This is different
                          from Incoming QC (Step 5) which checks raw materials from suppliers.
                          Partial rejection is supported - enter the number of defective units.
                        </AlertDescription>
                      </Alert>
                    )}

                    {step.id === 'finished-goods' && (
                      <Alert className="bg-blue-50 border-blue-300 mt-4">
                        <Info className="size-4 text-blue-600" />
                        <AlertTitle className="text-blue-900">💡 Pro Tip</AlertTitle>
                        <AlertDescription className="text-blue-800 text-sm">
                          Finished goods are automatically added to inventory after QC approval.
                          They're tracked separately from raw materials and can be used to fulfill
                          Sales Orders. You can see the complete production history and traceability!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Completion Message */}
      {steps.every(s => s.completed) && (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300">
          <CardHeader>
            <CardTitle className="text-green-900 text-2xl flex items-center gap-3">
              <CheckCircle2 className="size-8 text-green-600" />
              🎉 Congratulations! All Steps Completed!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                You've successfully completed the entire Steel Rod manufacturing workflow:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="size-4" />
                  Issued materials with shortage handling
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="size-4" />
                  Recorded batch production across multiple days
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="size-4" />
                  Performed QC inspection with partial rejection
                </li>
                <li className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="size-4" />
                  Reviewed finished goods ready for sales
                </li>
              </ul>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => navigate('/finished-goods')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  View Finished Goods Inventory
                </Button>
                <Button
                  onClick={() => navigate('/sales')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Sales Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next: Sales Flow */}
      {steps.every(s => s.completed) && (
        <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300">
          <ShoppingCart className="size-5 text-purple-600" />
          <AlertTitle className="text-purple-900">What's Next? Sales Flow!</AlertTitle>
          <AlertDescription className="text-purple-800">
            <p className="mb-2">
              Now that you have finished goods, you can complete the supply chain by creating
              Sales Orders to fulfill customer demands:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create Sales Quotation for customers</li>
              <li>Convert approved quotations to Sales Orders</li>
              <li>Generate Delivery Challan for shipment</li>
              <li>Create E-Way Bill for transportation</li>
              <li>Generate Sales Invoice with GST</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
