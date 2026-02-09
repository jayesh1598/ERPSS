import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ShoppingCart, 
  FileText, 
  Package, 
  ClipboardCheck, 
  Factory, 
  PackageCheck,
  DollarSign,
  Truck,
  Receipt,
  FileCheck,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Link } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  bgColor: string;
  category: 'procurement' | 'production' | 'sales';
  actions: string[];
}

export function ProcessFlowGuide() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const processSteps: ProcessStep[] = [
    // PROCUREMENT CYCLE
    {
      id: 'pr',
      title: '1. Purchase Requisition',
      description: 'Create internal request for materials needed for production',
      icon: ShoppingCart,
      path: '/purchase-requisitions',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      category: 'procurement',
      actions: ['Create PR', 'Get Approval', 'Send for Quotation']
    },
    {
      id: 'rfq',
      title: '2. Request for Quotation',
      description: 'Send RFQ to vendors and collect quotations',
      icon: FileText,
      path: '/quotations',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      category: 'procurement',
      actions: ['Create RFQ', 'Receive Quotes', 'Compare Vendors']
    },
    {
      id: 'po',
      title: '3. Purchase Order',
      description: 'Issue PO to selected vendor after quotation approval',
      icon: FileCheck,
      path: '/purchase-orders',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      category: 'procurement',
      actions: ['Create PO', 'Get Approval', 'Send to Vendor']
    },
    {
      id: 'grn',
      title: '4. Goods Receipt (GRN)',
      description: 'Receive materials from vendor and create GRN',
      icon: Package,
      path: '/invoices',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      category: 'procurement',
      actions: ['Record Receipt', 'Verify Quantity', 'Send to QC']
    },
    {
      id: 'qc-incoming',
      title: '5. Incoming QC Inspection',
      description: 'Inspect received materials for quality compliance',
      icon: ClipboardCheck,
      path: '/quality-control',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      category: 'procurement',
      actions: ['Create Inspection', 'Test Parameters', 'Approve/Reject']
    },
    {
      id: 'inventory',
      title: '6. Store in Inventory',
      description: 'Move approved materials to warehouse inventory',
      icon: Package,
      path: '/inventory',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      category: 'procurement',
      actions: ['Update Stock', 'Assign Location', 'Track Batches']
    },

    // PRODUCTION CYCLE
    {
      id: 'work-order',
      title: '7. Create Work Order',
      description: 'Plan production based on sales orders or forecasts',
      icon: Factory,
      path: '/production',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      category: 'production',
      actions: ['Create WO', 'Assign Resources', 'Schedule Production']
    },
    {
      id: 'material-issue',
      title: '8. Issue Materials',
      description: 'Issue raw materials from inventory to production floor',
      icon: PackageCheck,
      path: '/production',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      category: 'production',
      actions: ['Scan Materials', 'Validate Stock', 'Issue to Floor']
    },
    {
      id: 'production',
      title: '9. Production Entry',
      description: 'Record production output and track progress',
      icon: Factory,
      path: '/production',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      category: 'production',
      actions: ['Record Output', 'Update Status', 'Track Wastage']
    },
    {
      id: 'qc-production',
      title: '10. Production QC',
      description: 'Inspect finished goods before moving to inventory',
      icon: ClipboardCheck,
      path: '/production',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      category: 'production',
      actions: ['Inspect Output', 'Test Quality', 'Approve for Stock']
    },
    {
      id: 'finished-goods',
      title: '11. Finished Goods Stock',
      description: 'Move approved finished goods to inventory',
      icon: Package,
      path: '/finished-goods',
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      category: 'production',
      actions: ['Update Inventory', 'Track FG Stock', 'Ready to Ship']
    },

    // SALES & DISPATCH CYCLE
    {
      id: 'sales-order',
      title: '12. Sales Order',
      description: 'Receive and process customer orders',
      icon: DollarSign,
      path: '/sales-orders',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      category: 'sales',
      actions: ['Create SO', 'Check Stock', 'Get Approval']
    },
    {
      id: 'delivery',
      title: '13. Delivery Challan',
      description: 'Create delivery challan and dispatch goods',
      icon: Truck,
      path: '/delivery-challan',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      category: 'sales',
      actions: ['Generate DC', 'Pack Goods', 'Dispatch']
    },
    {
      id: 'eway',
      title: '14. E-Way Bill',
      description: 'Generate e-way bill for goods transportation',
      icon: FileCheck,
      path: '/eway-bills',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      category: 'sales',
      actions: ['Generate E-Way Bill', 'Submit to Portal', 'Track Transit']
    },
    {
      id: 'sales-invoice',
      title: '15. Sales Invoice',
      description: 'Generate invoice and collect payment',
      icon: Receipt,
      path: '/sales-invoices',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      category: 'sales',
      actions: ['Create Invoice', 'Apply GST', 'Track Payment']
    }
  ];

  const filteredSteps = selectedCategory === 'all' 
    ? processSteps 
    : processSteps.filter(s => s.category === selectedCategory);

  const categoryConfig = {
    procurement: { label: 'Procurement Cycle', color: 'text-blue-600', count: processSteps.filter(s => s.category === 'procurement').length },
    production: { label: 'Production Cycle', color: 'text-orange-600', count: processSteps.filter(s => s.category === 'production').length },
    sales: { label: 'Sales & Dispatch', color: 'text-green-600', count: processSteps.filter(s => s.category === 'sales').length }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Factory className="size-8" />
              Manufacturing Process Flow Guide
            </h1>
            <p className="mt-2 text-blue-100">
              Complete end-to-end supply chain workflow for steel & metallurgy manufacturing
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {processSteps.length} Steps
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="size-4 text-blue-600" />
        <AlertTitle className="text-blue-900">How to Use This System</AlertTitle>
        <AlertDescription className="text-blue-800">
          Follow the sequential process flow from procurement through production to sales. Each step must be completed before moving to the next to maintain data integrity and compliance.
        </AlertDescription>
      </Alert>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
        >
          All Steps ({processSteps.length})
        </Button>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(key)}
            className={selectedCategory === key ? '' : 'hover:border-gray-400'}
          >
            {config.label} ({config.count})
          </Button>
        ))}
      </div>

      {/* Process Flow Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSteps.map((step, index) => {
          const Icon = step.icon;
          const isLastInCategory = 
            index === filteredSteps.length - 1 || 
            filteredSteps[index + 1]?.category !== step.category;
          
          return (
            <div key={step.id} className="relative">
              <Card className="h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-300">
                <CardHeader className={`${step.bgColor} border-b`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${step.bgColor} p-3 rounded-lg border-2 ${step.color.replace('text-', 'border-')}`}>
                        <Icon className={`size-6 ${step.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{step.title}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {categoryConfig[step.category].label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                  
                  {/* Actions Checklist */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Key Actions:</p>
                    {step.actions.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <CheckCircle className="size-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{action}</span>
                      </div>
                    ))}
                  </div>

                  {/* Navigate Button */}
                  <Link to={step.path}>
                    <Button className="w-full" variant="outline" size="sm">
                      Go to Module
                      <ArrowRight className="size-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Arrow to next step */}
              {!isLastInCategory && selectedCategory === 'all' && (
                <div className="hidden lg:block absolute -right-2 top-1/2 transform -translate-y-1/2 translate-x-full z-10">
                  <ArrowRight className="size-6 text-gray-400" />
                </div>
              )}

              {/* Category Divider */}
              {isLastInCategory && index !== filteredSteps.length - 1 && selectedCategory === 'all' && (
                <div className="col-span-full my-4 border-t-4 border-dashed border-gray-300 relative">
                  <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-1 text-sm font-semibold text-gray-500 border border-gray-300 rounded-full">
                    Next Cycle
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="size-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900">
          <p>✓ Always create Purchase Requisitions before Purchase Orders</p>
          <p>✓ Perform QC inspection immediately after GRN to avoid production delays</p>
          <p>✓ Issue materials to work orders only when production is ready to start</p>
          <p>✓ Complete production QC before moving finished goods to inventory</p>
          <p>✓ Generate E-Way Bill before dispatching goods to customers</p>
          <p>✓ Maintain proper approval workflows at each critical step</p>
        </CardContent>
      </Card>
    </div>
  );
}