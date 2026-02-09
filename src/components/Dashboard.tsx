import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  AlertCircle,
  FileText,
  Receipt,
  DollarSign,
  Factory,
  ListChecks,
  PackageCheck,
} from 'lucide-react';
import { Button } from './ui/button';

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('📊 Dashboard: Loading stats...');
      const result = await api.getDashboardStats();
      console.log('📊 Dashboard: Stats loaded successfully:', result);
      setStats(result.stats);
    } catch (error: any) {
      console.error('❌ Dashboard: Load stats error:', error);
      console.error('❌ Dashboard: Error message:', error.message);
      console.error('❌ Dashboard: Error stack:', error.stack);
      
      // Check if it's an authentication error
      if (error.message?.includes('Invalid JWT') || error.message?.includes('logged out')) {
        console.log('❌ Dashboard: Authentication error detected, user will be redirected to login');
        // Don't show toast, user will be redirected automatically
      } else if (!error.message?.includes('Unauthorized')) {
        // Only show error if not an auth issue (user will be redirected to login)
        toast.error(`Failed to load dashboard: ${error.message}`);
      }
      
      // Set empty stats to prevent UI errors
      setStats({
        purchase_requisitions: { total: 0, pending: 0 },
        purchase_orders: { total: 0, pending_approval: 0 },
        invoices: { total: 0, on_hold: 0 },
        sales_orders: { total: 0, confirmed: 0 },
        work_orders: { total: 0, in_progress: 0 },
        stock_items: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Purchase Requisitions',
      value: stats?.purchase_requisitions?.total || 0,
      subValue: `${stats?.purchase_requisitions?.pending || 0} Pending`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Purchase Orders',
      value: stats?.purchase_orders?.total || 0,
      subValue: `${stats?.purchase_orders?.pending_approval || 0} Awaiting Approval`,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      title: 'Invoices',
      value: stats?.invoices?.total || 0,
      subValue: `${stats?.invoices?.on_hold || 0} On Hold`,
      icon: Receipt,
      color: 'bg-yellow-500',
    },
    {
      title: 'Sales Orders',
      value: stats?.sales_orders?.total || 0,
      subValue: `${stats?.sales_orders?.confirmed || 0} Confirmed`,
      icon: DollarSign,
      color: 'bg-purple-500',
    },
    {
      title: 'Work Orders',
      value: stats?.work_orders?.total || 0,
      subValue: `${stats?.work_orders?.in_progress || 0} In Progress`,
      icon: Factory,
      color: 'bg-orange-500',
    },
    {
      title: 'Stock Items',
      value: stats?.stock_items || 0,
      subValue: 'Total Items',
      icon: Package,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Enterprise Manufacturing ERP System Overview
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`${card.color} p-2 rounded-lg`}>
                <card.icon className="size-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
              <p className="text-sm text-gray-500 mt-1">{card.subValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production Metrics - New Section */}
      {stats?.bill_of_materials && stats?.production_orders && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Bill of Materials
              </CardTitle>
              <div className="bg-cyan-500 p-2 rounded-lg">
                <ListChecks className="size-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.bill_of_materials.total}</div>
              <p className="text-sm text-gray-500 mt-1">{stats.bill_of_materials.active} Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Production Orders
              </CardTitle>
              <div className="bg-pink-500 p-2 rounded-lg">
                <PackageCheck className="size-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.production_orders.total}</div>
              <p className="text-sm text-gray-500 mt-1">
                {stats.production_orders.in_progress} In Progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Production
              </CardTitle>
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Factory className="size-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.production_orders.today_units_produced}</div>
              <p className="text-sm text-gray-500 mt-1">Units Produced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Cost
              </CardTitle>
              <div className="bg-rose-500 p-2 rounded-lg">
                <DollarSign className="size-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{(stats.production_orders.today_production_cost || 0).toFixed(0)}
              </div>
              <p className="text-sm text-gray-500 mt-1">Production Cost</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <ShoppingCart className="size-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {stats?.purchase_requisitions?.pending || 0} Purchase Requisitions pending approval
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Requires immediate attention</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <Receipt className="size-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {stats?.invoices?.on_hold || 0} Invoices on hold
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Mismatch detected - needs review</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Factory className="size-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {stats?.work_orders?.in_progress || 0} Work Orders in production
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Active manufacturing processes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Connected Modules</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-50 rounded text-xs text-center">
                    Purchase Management ✓
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-center">
                    Inventory ✓
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-center">
                    Quality Control ✓
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-center">
                    Production ✓
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-center">
                    Sales & Dispatch ✓
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-xs text-center">
                    GST & Accounting ✓
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> All modules are live with database integration. 
                  E-Way Bill and GST Payment APIs require external credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Order Integration Guide */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <ShoppingCart className="size-6" />
            🎯 Sales Order Management - Fully Integrated Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Package className="size-5" />
                  How to Create Sales Order
                </h4>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Go to <strong>Sales Orders</strong> module</li>
                  <li>Click <strong>"Create Sales Order"</strong></li>
                  <li>Select customer and delivery date</li>
                  <li>Add products (e.g., 500 Cookers, 200 Tiffins, 300 Glasses)</li>
                  <li>System shows <strong>real-time stock availability</strong></li>
                  <li>Click <strong>"Create Order"</strong> - Done! ✅</li>
                </ol>
              </div>

              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Factory className="size-5" />
                  Automatic Integration Magic
                </h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <strong>Stock Check:</strong> System checks inventory for each item
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <strong>Auto-Production:</strong> If stock low, production orders auto-created
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <strong>Material Trigger:</strong> Purchase requisitions generated if needed
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <div>
                      <strong>QC Flow:</strong> Quality checks before shipment
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">🔗 Connected Modules (All Auto-Linked)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2 bg-blue-50 rounded text-center font-medium text-blue-900">
                  📦 Inventory
                </div>
                <div className="p-2 bg-purple-50 rounded text-center font-medium text-purple-900">
                  🏭 Production
                </div>
                <div className="p-2 bg-yellow-50 rounded text-center font-medium text-yellow-900">
                  🛒 Purchase
                </div>
                <div className="p-2 bg-green-50 rounded text-center font-medium text-green-900">
                  ✓ Quality Control
                </div>
                <div className="p-2 bg-teal-50 rounded text-center font-medium text-teal-900">
                  🚚 Delivery
                </div>
                <div className="p-2 bg-orange-50 rounded text-center font-medium text-orange-900">
                  🧾 Invoicing
                </div>
                <div className="p-2 bg-red-50 rounded text-center font-medium text-red-900">
                  💰 GST & Tax
                </div>
                <div className="p-2 bg-indigo-50 rounded text-center font-medium text-indigo-900">
                  📊 Accounting
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>💡 Example:</strong> When you create order for "500 Cookers" and only 100 in stock, 
                system automatically creates production order for 400 units, checks raw materials, 
                and triggers purchase if materials insufficient. Everything happens in one click!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}