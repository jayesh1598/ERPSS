import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import {
  FileText,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAccessToken } from '../lib/api'; // ADDED: Import getAccessToken helper
import {
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

interface ProductionCostReport {
  product_name: string;
  total_quantity: number;
  total_material_cost: number;
  total_waste_cost: number;
  total_cost: number;
  average_cost_per_unit: number;
  waste_percentage: number;
}

interface MaterialUsageReport {
  material_name: string;
  total_planned: number;
  total_actual: number;
  total_waste: number;
  unit: string;
  total_cost: number;
  waste_cost: number;
  efficiency_percentage: number;
}

interface WasteAnalysisReport {
  product_name: string;
  material_name: string;
  waste_quantity: number;
  waste_cost: number;
  waste_percentage: number;
  order_count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Reports() {
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('all');
  
  const [productionCostReport, setProductionCostReport] = useState<ProductionCostReport[]>([]);
  const [materialUsageReport, setMaterialUsageReport] = useState<MaterialUsageReport[]>([]);
  const [wasteAnalysisReport, setWasteAnalysisReport] = useState<WasteAnalysisReport[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchProducts = async () => {
    try {
      const accessToken = await getAccessToken(); // ADDED: Use getAccessToken helper
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/products`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  const generateReports = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select date range');
      return;
    }

    setLoading(true);
    try {
      const accessToken = await getAccessToken(); // ADDED: Use getAccessToken helper
      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to: dateTo,
        product_id: selectedProduct,
      });

      // Fetch Production Cost Report
      const costResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/reports/production-cost?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!costResponse.ok) throw new Error('Failed to fetch production cost report');
      const costData = await costResponse.json();
      setProductionCostReport(costData);

      // Fetch Material Usage Report
      const usageResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/reports/material-usage?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!usageResponse.ok) throw new Error('Failed to fetch material usage report');
      const usageData = await usageResponse.json();
      setMaterialUsageReport(usageData);

      // Fetch Waste Analysis Report
      const wasteResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/reports/waste-analysis?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!wasteResponse.ok) throw new Error('Failed to fetch waste analysis report');
      const wasteData = await wasteResponse.json();
      setWasteAnalysisReport(wasteData);

      toast.success('Reports generated successfully');
    } catch (error: any) {
      console.error('Error generating reports:', error);
      toast.error('Failed to generate reports: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  // Calculate summary metrics
  const totalProductionCost = productionCostReport.reduce(
    (sum, item) => sum + item.total_cost,
    0
  );
  const totalWasteCost = productionCostReport.reduce(
    (sum, item) => sum + item.total_waste_cost,
    0
  );
  const totalUnitsProduced = productionCostReport.reduce(
    (sum, item) => sum + item.total_quantity,
    0
  );
  const averageWastePercentage =
    productionCostReport.length > 0
      ? productionCostReport.reduce((sum, item) => sum + item.waste_percentage, 0) /
        productionCostReport.length
      : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Production Reports</h1>
          <p className="text-gray-600 mt-1">
            Material consumption, cost analysis, and waste tracking
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={generateReports} disabled={loading} className="w-full">
                {loading ? 'Generating...' : 'Generate Reports'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {productionCostReport.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Production Cost</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{totalProductionCost.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Waste Cost</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₹{totalWasteCost.toFixed(2)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Units Produced</p>
                  <p className="text-2xl font-bold">{totalUnitsProduced}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Waste %</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {averageWastePercentage.toFixed(2)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tabs */}
      <Tabs defaultValue="production-cost" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="production-cost">Production Cost Analysis</TabsTrigger>
          <TabsTrigger value="material-usage">Material Usage</TabsTrigger>
          <TabsTrigger value="waste-analysis">Waste Analysis</TabsTrigger>
        </TabsList>

        {/* Production Cost Report */}
        <TabsContent value="production-cost">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Production Cost by Product</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(productionCostReport, 'production_cost_report')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {productionCostReport.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No data available. Generate report to view.</p>
                </div>
              ) : (
                <>
                  {/* Chart */}
                  <div className="mb-6" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productionCostReport}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="product_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_material_cost" fill="#3b82f6" name="Material Cost" />
                        <Bar dataKey="total_waste_cost" fill="#ef4444" name="Waste Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty Produced</TableHead>
                        <TableHead className="text-right">Material Cost</TableHead>
                        <TableHead className="text-right">Waste Cost</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Cost/Unit</TableHead>
                        <TableHead className="text-right">Waste %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionCostReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-right">{item.total_quantity}</TableCell>
                          <TableCell className="text-right">
                            ₹{item.total_material_cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ₹{item.total_waste_cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{item.total_cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{item.average_cost_per_unit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={item.waste_percentage > 10 ? 'destructive' : 'secondary'}
                            >
                              {item.waste_percentage.toFixed(2)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Material Usage Report */}
        <TabsContent value="material-usage">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Material Consumption & Efficiency</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(materialUsageReport, 'material_usage_report')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {materialUsageReport.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No data available. Generate report to view.</p>
                </div>
              ) : (
                <>
                  {/* Chart */}
                  <div className="mb-6" style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={materialUsageReport}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="material_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total_actual" fill="#10b981" name="Actual Used" />
                        <Bar dataKey="total_waste" fill="#ef4444" name="Waste" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Planned</TableHead>
                        <TableHead className="text-right">Actual Used</TableHead>
                        <TableHead className="text-right">Waste</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Waste Cost</TableHead>
                        <TableHead className="text-right">Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialUsageReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.material_name}</TableCell>
                          <TableCell className="text-right">{item.total_planned}</TableCell>
                          <TableCell className="text-right">{item.total_actual}</TableCell>
                          <TableCell className="text-right text-red-600">
                            {item.total_waste}
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">
                            ₹{item.total_cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ₹{item.waste_cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                item.efficiency_percentage >= 90 ? 'default' : 'destructive'
                              }
                            >
                              {item.efficiency_percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Waste Analysis Report */}
        <TabsContent value="waste-analysis">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Waste & Scrap Analysis</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(wasteAnalysisReport, 'waste_analysis_report')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {wasteAnalysisReport.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No data available. Generate report to view.</p>
                </div>
              ) : (
                <>
                  {/* Pie Chart */}
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div style={{ height: '300px' }}>
                      <h3 className="text-sm font-semibold mb-2 text-center">
                        Waste Cost by Product
                      </h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={wasteAnalysisReport}
                            dataKey="waste_cost"
                            nameKey="product_name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {wasteAnalysisReport.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ height: '300px' }}>
                      <h3 className="text-sm font-semibold mb-2 text-center">
                        Waste Percentage by Product
                      </h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={wasteAnalysisReport}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="product_name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="waste_percentage" fill="#f59e0b" name="Waste %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Waste Qty</TableHead>
                        <TableHead className="text-right">Waste Cost</TableHead>
                        <TableHead className="text-right">Waste %</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wasteAnalysisReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.material_name}</TableCell>
                          <TableCell className="text-right">{item.waste_quantity}</TableCell>
                          <TableCell className="text-right text-red-600">
                            ₹{item.waste_cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={item.waste_percentage > 10 ? 'destructive' : 'secondary'}
                            >
                              {item.waste_percentage.toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{item.order_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}