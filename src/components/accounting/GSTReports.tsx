import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';

interface Ledger {
  id: string;
  name: string;
  gstin?: string;
  enable_gst: boolean;
}

interface Voucher {
  id: string;
  voucher_type: string;
  voucher_number: string;
  date: string;
  entries: any[];
  total_amount: number;
  status: string;
}

interface GSTEntry {
  date: string;
  voucher_number: string;
  party_name: string;
  gstin: string;
  invoice_value: number;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_tax: number;
}

export function GSTReports() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vouchersData, ledgersData] = await Promise.all([
        api.getVouchers(),
        api.getAccountLedgers(),
      ]);
      setVouchers(vouchersData.filter((v: Voucher) => v.status === 'posted'));
      setLedgers(ledgersData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVouchers = (type: 'sales' | 'purchase') => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return vouchers.filter(v => {
      const voucherDate = new Date(v.date);
      return (
        v.voucher_type === type &&
        voucherDate >= startDate &&
        voucherDate <= endDate
      );
    });
  };

  // Calculate GST (simplified - assuming 18% GST split as 9% CGST + 9% SGST)
  const calculateGST = (amount: number, isInterState: boolean = false) => {
    const gstRate = 0.18;
    const taxableValue = amount / (1 + gstRate);
    const totalTax = amount - taxableValue;
    
    if (isInterState) {
      return {
        taxable_value: taxableValue,
        cgst: 0,
        sgst: 0,
        igst: totalTax,
        total_tax: totalTax,
      };
    } else {
      return {
        taxable_value: taxableValue,
        cgst: totalTax / 2,
        sgst: totalTax / 2,
        igst: 0,
        total_tax: totalTax,
      };
    }
  };

  // GSTR-1 - Outward Supplies (Sales)
  const getGSTR1Data = (): GSTEntry[] => {
    const salesVouchers = getFilteredVouchers('sales');
    const entries: GSTEntry[] = [];

    for (const voucher of salesVouchers) {
      // Find customer ledger (credit entry in sales)
      const customerEntry = voucher.entries.find((e: any) => e.type === 'credit');
      if (!customerEntry) continue;

      const customer = ledgers.find(l => l.id === customerEntry.ledger_id);
      if (!customer || !customer.enable_gst) continue;

      const gst = calculateGST(voucher.total_amount);

      entries.push({
        date: voucher.date,
        voucher_number: voucher.voucher_number,
        party_name: customer.name,
        gstin: customer.gstin || 'N/A',
        invoice_value: voucher.total_amount,
        ...gst,
      });
    }

    return entries;
  };

  // GSTR-2 - Inward Supplies (Purchases)
  const getGSTR2Data = (): GSTEntry[] => {
    const purchaseVouchers = getFilteredVouchers('purchase');
    const entries: GSTEntry[] = [];

    for (const voucher of purchaseVouchers) {
      // Find supplier ledger (debit entry in purchase)
      const supplierEntry = voucher.entries.find((e: any) => e.type === 'debit');
      if (!supplierEntry) continue;

      const supplier = ledgers.find(l => l.id === supplierEntry.ledger_id);
      if (!supplier || !supplier.enable_gst) continue;

      const gst = calculateGST(voucher.total_amount);

      entries.push({
        date: voucher.date,
        voucher_number: voucher.voucher_number,
        party_name: supplier.name,
        gstin: supplier.gstin || 'N/A',
        invoice_value: voucher.total_amount,
        ...gst,
      });
    }

    return entries;
  };

  // GSTR-3B - Monthly Return Summary
  const getGSTR3BData = () => {
    const gstr1 = getGSTR1Data();
    const gstr2 = getGSTR2Data();

    const outward = {
      taxable_value: gstr1.reduce((sum, e) => sum + e.taxable_value, 0),
      cgst: gstr1.reduce((sum, e) => sum + e.cgst, 0),
      sgst: gstr1.reduce((sum, e) => sum + e.sgst, 0),
      igst: gstr1.reduce((sum, e) => sum + e.igst, 0),
      total_tax: gstr1.reduce((sum, e) => sum + e.total_tax, 0),
    };

    const inward = {
      taxable_value: gstr2.reduce((sum, e) => sum + e.taxable_value, 0),
      cgst: gstr2.reduce((sum, e) => sum + e.cgst, 0),
      sgst: gstr2.reduce((sum, e) => sum + e.sgst, 0),
      igst: gstr2.reduce((sum, e) => sum + e.igst, 0),
      total_tax: gstr2.reduce((sum, e) => sum + e.total_tax, 0),
    };

    const netTax = {
      cgst: outward.cgst - inward.cgst,
      sgst: outward.sgst - inward.sgst,
      igst: outward.igst - inward.igst,
      total: outward.total_tax - inward.total_tax,
    };

    return { outward, inward, netTax };
  };

  const gstr1Data = getGSTR1Data();
  const gstr2Data = getGSTR2Data();
  const gstr3bData = getGSTR3BData();

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  // Export to Excel function
  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // GSTR-1 Sheet
      if (gstr1Data.length > 0) {
        const gstr1Export = gstr1Data.map(entry => ({
          Date: new Date(entry.date).toLocaleDateString(),
          'Invoice No': entry.voucher_number,
          'Customer Name': entry.party_name,
          GSTIN: entry.gstin,
          'Taxable Value': entry.taxable_value.toFixed(2),
          CGST: entry.cgst.toFixed(2),
          SGST: entry.sgst.toFixed(2),
          IGST: entry.igst.toFixed(2),
          'Total Tax': entry.total_tax.toFixed(2),
          'Invoice Value': entry.invoice_value.toFixed(2),
        }));
        const gstr1Sheet = XLSX.utils.json_to_sheet(gstr1Export);
        XLSX.utils.book_append_sheet(wb, gstr1Sheet, 'GSTR-1');
      }

      // GSTR-2 Sheet
      if (gstr2Data.length > 0) {
        const gstr2Export = gstr2Data.map(entry => ({
          Date: new Date(entry.date).toLocaleDateString(),
          'Invoice No': entry.voucher_number,
          'Supplier Name': entry.party_name,
          GSTIN: entry.gstin,
          'Taxable Value': entry.taxable_value.toFixed(2),
          CGST: entry.cgst.toFixed(2),
          SGST: entry.sgst.toFixed(2),
          IGST: entry.igst.toFixed(2),
          'Total Tax': entry.total_tax.toFixed(2),
          'Invoice Value': entry.invoice_value.toFixed(2),
        }));
        const gstr2Sheet = XLSX.utils.json_to_sheet(gstr2Export);
        XLSX.utils.book_append_sheet(wb, gstr2Sheet, 'GSTR-2');
      }

      // GSTR-3B Summary Sheet
      const gstr3bExport = [
        {
          'Particulars': 'Outward Supplies (Sales)',
          'Taxable Value': gstr3bData.outward.taxable_value.toFixed(2),
          'CGST': gstr3bData.outward.cgst.toFixed(2),
          'SGST': gstr3bData.outward.sgst.toFixed(2),
          'IGST': gstr3bData.outward.igst.toFixed(2),
          'Total Tax': gstr3bData.outward.total_tax.toFixed(2),
        },
        {
          'Particulars': 'Inward Supplies (Purchases)',
          'Taxable Value': gstr3bData.inward.taxable_value.toFixed(2),
          'CGST': gstr3bData.inward.cgst.toFixed(2),
          'SGST': gstr3bData.inward.sgst.toFixed(2),
          'IGST': gstr3bData.inward.igst.toFixed(2),
          'Total Tax': gstr3bData.inward.total_tax.toFixed(2),
        },
        {},
        {
          'Particulars': 'Net Tax Liability / Credit',
          'Taxable Value': '',
          'CGST': gstr3bData.netTax.cgst.toFixed(2),
          'SGST': gstr3bData.netTax.sgst.toFixed(2),
          'IGST': gstr3bData.netTax.igst.toFixed(2),
          'Total Tax': gstr3bData.netTax.total.toFixed(2),
        },
      ];
      const gstr3bSheet = XLSX.utils.json_to_sheet(gstr3bExport);
      XLSX.utils.book_append_sheet(wb, gstr3bSheet, 'GSTR-3B');

      // Download
      const filename = `GST_Returns_${monthName}_${year}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success('GST reports exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export GST reports');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading GST reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GST Reports</h2>
          <p className="text-gray-600">Generate GSTR-1, GSTR-2, and GSTR-3B returns</p>
        </div>
        <Button variant="outline" onClick={handleExportToExcel}>
          <Download className="size-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Period Selection */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <Label>Month</Label>
            <select
              className="w-full p-2 border rounded"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min={2020}
              max={2030}
            />
          </div>
          <div>
            <Button onClick={loadData} variant="outline" className="w-full">
              <Calendar className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Alert if no GST data */}
      {gstr1Data.length === 0 && gstr2Data.length === 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="size-5" />
            <div>
              <div className="font-semibold">No GST Transactions Found</div>
              <div className="text-sm">
                No sales or purchase vouchers with GST-enabled ledgers found for {monthName} {year}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* GST Reports Tabs */}
      <Tabs defaultValue="gstr1" className="space-y-4">
        <TabsList className="grid grid-cols-3 gap-4">
          <TabsTrigger value="gstr1">
            GSTR-1
            <Badge className="ml-2">{gstr1Data.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="gstr2">
            GSTR-2
            <Badge className="ml-2">{gstr2Data.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
        </TabsList>

        {/* GSTR-1 */}
        <TabsContent value="gstr1">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                GSTR-1: Outward Supplies - {monthName} {year}
              </h3>
              <p className="text-sm text-gray-600">Details of outward supplies of goods or services</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Invoice No.</th>
                    <th className="text-left p-2">Customer Name</th>
                    <th className="text-left p-2">GSTIN</th>
                    <th className="text-right p-2">Taxable Value</th>
                    <th className="text-right p-2">CGST</th>
                    <th className="text-right p-2">SGST</th>
                    <th className="text-right p-2">IGST</th>
                    <th className="text-right p-2">Total Tax</th>
                    <th className="text-right p-2">Invoice Value</th>
                  </tr>
                </thead>
                <tbody>
                  {gstr1Data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-gray-500">
                        No outward supplies for this period
                      </td>
                    </tr>
                  ) : (
                    gstr1Data.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">{entry.voucher_number}</td>
                        <td className="p-2">{entry.party_name}</td>
                        <td className="p-2 text-xs">{entry.gstin}</td>
                        <td className="p-2 text-right">₹{entry.taxable_value.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{entry.cgst.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{entry.sgst.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{entry.igst.toFixed(2)}</td>
                        <td className="p-2 text-right font-semibold">₹{entry.total_tax.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">₹{entry.invoice_value.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {gstr1Data.length > 0 && (
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td colSpan={4} className="p-2 text-right">
                        Total:
                      </td>
                      <td className="p-2 text-right">
                        ₹{gstr1Data.reduce((sum, e) => sum + e.taxable_value, 0).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">₹{gstr1Data.reduce((sum, e) => sum + e.cgst, 0).toFixed(2)}</td>
                      <td className="p-2 text-right">₹{gstr1Data.reduce((sum, e) => sum + e.sgst, 0).toFixed(2)}</td>
                      <td className="p-2 text-right">₹{gstr1Data.reduce((sum, e) => sum + e.igst, 0).toFixed(2)}</td>
                      <td className="p-2 text-right">
                        ₹{gstr1Data.reduce((sum, e) => sum + e.total_tax, 0).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        ₹{gstr1Data.reduce((sum, e) => sum + e.invoice_value, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* GSTR-2 */}
        <TabsContent value="gstr2">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                GSTR-2: Inward Supplies - {monthName} {year}
              </h3>
              <p className="text-sm text-gray-600">Details of inward supplies of goods or services</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Invoice No.</th>
                    <th className="text-left p-2">Supplier Name</th>
                    <th className="text-left p-2">GSTIN</th>
                    <th className="text-right p-2">Taxable Value</th>
                    <th className="text-right p-2">CGST</th>
                    <th className="text-right p-2">SGST</th>
                    <th className="text-right p-2">IGST</th>
                    <th className="text-right p-2">Total Tax</th>
                    <th className="text-right p-2">Invoice Value</th>
                  </tr>
                </thead>
                <tbody>
                  {gstr2Data.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-gray-500">
                        No inward supplies for this period
                      </td>
                    </tr>
                  ) : (
                    gstr2Data.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">{entry.voucher_number}</td>
                        <td className="p-2">{entry.party_name}</td>
                        <td className="p-2 text-xs">{entry.gstin}</td>
                        <td className="p-2 text-right">₹{entry.taxable_value.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{entry.cgst.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{entry.sgst.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{entry.igst.toFixed(2)}</td>
                        <td className="p-2 text-right font-semibold">₹{entry.total_tax.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">₹{entry.invoice_value.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {gstr2Data.length > 0 && (
                  <tfoot className="bg-blue-50 font-bold">
                    <tr>
                      <td colSpan={4} className="p-2 text-right">
                        Total:
                      </td>
                      <td className="p-2 text-right">
                        ₹{gstr2Data.reduce((sum, e) => sum + e.taxable_value, 0).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">₹{gstr2Data.reduce((sum, e) => sum + e.cgst, 0).toFixed(2)}</td>
                      <td className="p-2 text-right">₹{gstr2Data.reduce((sum, e) => sum + e.sgst, 0).toFixed(2)}</td>
                      <td className="p-2 text-right">₹{gstr2Data.reduce((sum, e) => sum + e.igst, 0).toFixed(2)}</td>
                      <td className="p-2 text-right">
                        ₹{gstr2Data.reduce((sum, e) => sum + e.total_tax, 0).toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        ₹{gstr2Data.reduce((sum, e) => sum + e.invoice_value, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* GSTR-3B */}
        <TabsContent value="gstr3b">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                GSTR-3B: Monthly Return - {monthName} {year}
              </h3>
              <p className="text-sm text-gray-600">Summary of outward and inward supplies</p>
            </div>

            <div className="space-y-6">
              {/* Outward Supplies */}
              <div>
                <h4 className="font-semibold mb-3 text-green-700">3.1 Outward Supplies (Sales)</h4>
                <table className="w-full text-sm border">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="text-left p-3 border">Particulars</th>
                      <th className="text-right p-3 border">Taxable Value</th>
                      <th className="text-right p-3 border">CGST</th>
                      <th className="text-right p-3 border">SGST</th>
                      <th className="text-right p-3 border">IGST</th>
                      <th className="text-right p-3 border">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border">Outward taxable supplies</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.taxable_value.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.cgst.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.sgst.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.igst.toFixed(2)}</td>
                      <td className="p-3 border text-right font-bold">₹{gstr3bData.outward.total_tax.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Inward Supplies */}
              <div>
                <h4 className="font-semibold mb-3 text-blue-700">4.1 Eligible ITC (Input Tax Credit)</h4>
                <table className="w-full text-sm border">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="text-left p-3 border">Particulars</th>
                      <th className="text-right p-3 border">Taxable Value</th>
                      <th className="text-right p-3 border">CGST</th>
                      <th className="text-right p-3 border">SGST</th>
                      <th className="text-right p-3 border">IGST</th>
                      <th className="text-right p-3 border">Total ITC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border">Inward taxable supplies</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.taxable_value.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.cgst.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.sgst.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.igst.toFixed(2)}</td>
                      <td className="p-3 border text-right font-bold">₹{gstr3bData.inward.total_tax.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Tax Liability */}
              <div>
                <h4 className="font-semibold mb-3 text-purple-700">5.1 Net Tax Liability / Credit</h4>
                <table className="w-full text-sm border">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="text-left p-3 border">Tax Type</th>
                      <th className="text-right p-3 border">Tax on Sales</th>
                      <th className="text-right p-3 border">Less: ITC</th>
                      <th className="text-right p-3 border">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border">CGST</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.cgst.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.cgst.toFixed(2)}</td>
                      <td className="p-3 border text-right font-semibold">₹{gstr3bData.netTax.cgst.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">SGST</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.sgst.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.sgst.toFixed(2)}</td>
                      <td className="p-3 border text-right font-semibold">₹{gstr3bData.netTax.sgst.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">IGST</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.igst.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.igst.toFixed(2)}</td>
                      <td className="p-3 border text-right font-semibold">₹{gstr3bData.netTax.igst.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-purple-100 font-bold">
                      <td className="p-3 border">Total</td>
                      <td className="p-3 border text-right">₹{gstr3bData.outward.total_tax.toFixed(2)}</td>
                      <td className="p-3 border text-right">₹{gstr3bData.inward.total_tax.toFixed(2)}</td>
                      <td className="p-3 border text-right text-lg">₹{gstr3bData.netTax.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Total GST Liability for {monthName} {year}</div>
                  <div className={`text-3xl font-bold ${gstr3bData.netTax.total >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {gstr3bData.netTax.total >= 0 ? '₹' : '(₹'}
                    {Math.abs(gstr3bData.netTax.total).toFixed(2)}
                    {gstr3bData.netTax.total < 0 && ')'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {gstr3bData.netTax.total >= 0 ? 'Payable to Government' : 'Refund Available'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}