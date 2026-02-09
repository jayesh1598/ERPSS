import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Link, useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Factory, 
  Package, 
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  ShoppingCart,
  Truck,
  FileText,
  Workflow,
  Rocket,
  PlayCircle,
} from 'lucide-react';

export function SteelDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>({
    production: {},
    inventory: {},
    sales: {},
    quality: {},
    finance: {},
  });

  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [
        productionOrdersResult,
        workOrdersResult,
        bomsResult,
        inventoryResult,
        salesOrdersResult,
        salesQuotationsResult,
        qcBatchesResult,
        itemsResult,
        partiesResult,
      ] = await Promise.all([
        api.getProductionOrders().catch(() => ({ orders: [] })),
        api.getWorkOrders().catch(() => ({ workOrders: [] })),
        api.getBOMs().catch(() => ({ boms: [] })),
        api.getInventory().catch(() => ({ inventory: [] })),
        api.getSalesOrders().catch(() => ({ orders: [] })),
        api.getSalesQuotations().catch(() => ({ quotations: [] })),
        api.getQCBatches().catch(() => ({ batches: [] })),
        api.getItems().catch(() => ({ items: [] })),
        api.getParties('customer').catch(() => ({ parties: [] })),
      ]);

      // Calculate Production Management KPIs (BOM & Work Orders)
      const workOrders = workOrdersResult.workOrders || [];
      const boms = bomsResult.boms || [];
      const activeWorkOrders = workOrders.filter((wo: any) => wo.status === 'in_progress' || wo.status === 'planned').length;
      const completedWorkOrders = workOrders.filter((wo: any) => wo.status === 'completed').length;
      const totalBOMs = boms.length;
      const activeBOMs = boms.filter((bom: any) => bom.is_active).length;
      
      // Calculate total material cost from BOMs
      const totalMaterialCost = boms.reduce((sum: number, bom: any) => {
        const bomCost = (bom.components || []).reduce((compSum: number, comp: any) => {
          const item = itemsResult.items?.find((i: any) => i.id === comp.item_id);
          return compSum + ((item?.standard_cost || 0) * (comp.quantity || 0));
        }, 0);
        return sum + bomCost;
      }, 0);

      // Calculate Inventory KPIs
      const inventory = inventoryResult.inventory || [];
      const items = itemsResult.items || [];
      const lowStockItems = inventory.filter((inv: any) => {
        const item = items.find((i: any) => i.id === inv.item_id);
        return item && inv.quantity < (item.min_stock_level || 0);
      }).length;
      const totalInventoryValue = inventory.reduce((sum: number, inv: any) => {
        const item = items.find((i: any) => i.id === inv.item_id);
        return sum + (inv.quantity * (item?.standard_cost || 0));
      }, 0);

      // Calculate Sales KPIs
      const salesOrders = salesOrdersResult.orders || [];
      const salesQuotations = salesQuotationsResult.quotations || [];
      const pendingOrders = salesOrders.filter((o: any) => o.status === 'pending' || o.status === 'confirmed').length;
      const completedOrders = salesOrders.filter((o: any) => o.status === 'completed').length;
      const totalRevenue = salesOrders
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, o: any) => sum + o.total_amount, 0);
      const pendingQuotations = salesQuotations.filter((q: any) => q.status === 'draft' || q.status === 'pending_approval').length;

      // Calculate Quality KPIs
      const qcBatches = qcBatchesResult.batches || [];
      const totalQC = qcBatches.length;
      const passedQC = qcBatches.filter((b: any) => b.result === 'pass').length;
      const failedQC = qcBatches.filter((b: any) => b.result === 'fail').length;
      const qualityRate = totalQC > 0 ? (passedQC / totalQC * 100).toFixed(1) : '0';

      // Calculate Finance KPIs
      const customers = partiesResult.parties || [];
      const totalCustomers = customers.length;
      const avgOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders) : 0;

      setKpis({
        production: {
          total: totalBOMs,
          active: activeBOMs,
          completed: completedWorkOrders,
          rate: (completedWorkOrders / (activeWorkOrders + completedWorkOrders) * 100).toFixed(1) || '0',
          materialCost: totalMaterialCost,
        },
        inventory: {
          totalValue: totalInventoryValue,
          lowStockItems,
          totalItems: items.length,
          finishedGoods: items.filter((i: any) => i.type === 'FG').length,
        },
        sales: {
          pendingOrders,
          completedOrders,
          totalRevenue,
          pendingQuotations,
          customers: totalCustomers,
          avgOrderValue,
        },
        quality: {
          total: totalQC,
          passed: passedQC,
          failed: failedQC,
          rate: qualityRate,
        },
      });
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '₹0.00';
    }
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return num.toLocaleString('en-IN');
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Steel Manufacturing Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time insights for steel production and operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500 text-white">
            <Zap className="size-3 mr-1" />
            Live Data
          </Badge>
          <Link to="/process-flow">
            <Button className="gap-2">
              <Workflow className="size-4" />
              View Process Flow
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Benefits Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">🏭 ERP for Steel Industry - Key Benefits</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Target className="size-4" />
              Zero-Waste Manufacturing
            </p>
            <p className="text-xs text-blue-100 mt-1">Intelligent workflows & minimal inefficiencies</p>
          </div>
          <div>
            <p className="font-semibold flex items-center gap-2">
              <Zap className="size-4" />
              Accelerated Production
            </p>
            <p className="text-xs text-blue-100 mt-1">Faster processes, no bottlenecks</p>
          </div>
          <div>
            <p className="font-semibold flex items-center gap-2">
              <CheckCircle className="size-4" />
              Full Compliance
            </p>
            <p className="text-xs text-blue-100 mt-1">Meet all regulatory standards</p>
          </div>
          <div>
            <p className="font-semibold flex items-center gap-2">
              <TrendingUp className="size-4" />
              Financial Growth
            </p>
            <p className="text-xs text-blue-100 mt-1">Higher revenues & profit margins</p>
          </div>
        </div>
      </div>

      {/* Demo Wizard Promotion Banner */}
      <Alert className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300">
        <Rocket className="size-5 text-orange-600" />
        <AlertTitle className="text-orange-900 font-bold text-lg flex items-center gap-2">
          🎯 Try the Complete Production Demo!
        </AlertTitle>
        <AlertDescription className="text-orange-800">
          <p className="mb-3">
            Experience the full Steel Rod manufacturing workflow from Work Order → Material Issue → Production → QC → Finished Goods.
            Our automated demo wizard sets up everything for you!
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/production-demo-wizard')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <PlayCircle className="size-4 mr-2" />
              Launch Production Demo Wizard
            </Button>
            <Button
              onClick={() => navigate('/production-demo-playbook')}
              variant="outline"
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              📘 View Step-by-Step Playbook
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Production KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Rate</CardTitle>
            <Factory className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{kpis.production.rate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.production.completed} of {kpis.production.total} orders completed
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="size-3 mr-1" />
                {kpis.production.inProgress} In Progress
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Pass Rate</CardTitle>
            <CheckCircle className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{kpis.quality.rate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.quality.passed} passed, {kpis.quality.failed} failed
            </p>
            <div className="mt-2 flex items-center gap-2">
              {parseFloat(kpis.quality.rate) >= 95 ? (
                <Badge className="bg-green-500 text-xs">Excellent</Badge>
              ) : parseFloat(kpis.quality.rate) >= 85 ? (
                <Badge className="bg-yellow-500 text-xs">Good</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Needs Improvement</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(kpis.inventory.totalValue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.inventory.totalItems} items tracked
            </p>
            <div className="mt-2">
              {kpis.inventory.lowStockItems > 0 ? (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="size-3 mr-1" />
                  {kpis.inventory.lowStockItems} Low Stock
                </Badge>
              ) : (
                <Badge className="bg-green-500 text-xs">
                  <CheckCircle className="size-3 mr-1" />
                  All Stock OK
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="size-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.sales.totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From {kpis.sales.completedOrders} completed orders
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Avg: {formatCurrency(kpis.sales.avgOrderValue)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-5" />
              Sales Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Quotations</span>
                <Badge className="bg-yellow-500">{kpis.sales.pendingQuotations}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Orders</span>
                <Badge className="bg-orange-500">{kpis.sales.pendingOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed Orders</span>
                <Badge className="bg-green-500">{kpis.sales.completedOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Customers</span>
                <Badge variant="outline">{kpis.sales.customers}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="size-5" />
              Production Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total BOMs</span>
                <span className="text-2xl font-bold">{kpis.production.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active BOMs</span>
                <Badge className="bg-blue-500">{kpis.production.active}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Work Orders Completed</span>
                <Badge className="bg-green-500">{kpis.production.completed}</Badge>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Material Cost (BOMs)</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(kpis.production.materialCost)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Inventory Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Items</span>
                <span className="text-2xl font-bold">{kpis.inventory.totalItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Finished Goods</span>
                <Badge className="bg-blue-500">{kpis.inventory.finishedGoods}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low Stock Alerts</span>
                {kpis.inventory.lowStockItems > 0 ? (
                  <Badge variant="destructive">{kpis.inventory.lowStockItems}</Badge>
                ) : (
                  <Badge className="bg-green-500">0</Badge>
                )}
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Total Value</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(kpis.inventory.totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Zap className="size-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Accelerated Production</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{kpis.production.rate}%</p>
              <p className="text-xs text-blue-700 mt-1">Faster processes, no bottlenecks</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="size-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-semibold text-green-900">Quality Assurance</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{kpis.quality.rate}%</p>
              <p className="text-xs text-green-700 mt-1">Monitor quality indicators</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Package className="size-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-semibold text-purple-900">Resilient Supply Chain</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {kpis.inventory.lowStockItems === 0 ? '100%' : ((kpis.inventory.totalItems - kpis.inventory.lowStockItems) / kpis.inventory.totalItems * 100).toFixed(0) + '%'}
              </p>
              <p className="text-xs text-purple-700 mt-1">Optimized inventory flows</p>
            </div>

            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <TrendingUp className="size-8 mx-auto mb-2 text-amber-600" />
              <p className="text-sm font-semibold text-amber-900">Financial Growth</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(kpis.sales.totalRevenue)}</p>
              <p className="text-xs text-amber-700 mt-1">Higher revenues & margins</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/sales" className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <FileText className="size-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">New Quotation</span>
            </a>
            <a href="/production-orders" className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <Factory className="size-5 text-green-600" />
              <span className="text-sm font-semibold text-green-900">Production Order</span>
            </a>
            <a href="/quality-control" className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <CheckCircle className="size-5 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">QC Inspection</span>
            </a>
            <a href="/inventory" className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <Package className="size-5 text-orange-600" />
              <span className="text-sm font-semibold text-orange-900">Stock Check</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}