import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Wallet, 
  Plus, 
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Send,
  Eye
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  designation: string;
  salary: number;
  status: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;
}

interface Payroll {
  id: string;
  employee_id: string;
  month: string;
  year: number;
  basic_salary: number;
  hra: number;
  medical_allowance: number;
  special_allowance: number;
  bonus: number;
  overtime_pay: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  professional_tax: number;
  tds: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
  payment_date?: string;
  payment_mode?: string;
  remarks?: string;
  created_at?: string;
}

export function PayrollManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPayslip, setShowPayslip] = useState<Payroll | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, payrollsData] = await Promise.all([
        api.getEmployees(),
        api.getPayrolls(selectedMonth, selectedYear),
      ]);
      setEmployees(employeesData.filter((e: Employee) => e.status === 'active') || []);
      setPayrolls(payrollsData || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSalaryComponents = (basicSalary: number) => {
    const hra = basicSalary * 0.4; // 40% HRA
    const medical_allowance = 1250;
    const special_allowance = basicSalary * 0.2; // 20%
    const gross_salary = basicSalary + hra + medical_allowance + special_allowance;
    
    const pf_deduction = basicSalary * 0.12; // 12% PF
    const esi_deduction = gross_salary < 21000 ? gross_salary * 0.0075 : 0; // 0.75% if < 21k
    const professional_tax = 200;
    const tds = gross_salary > 50000 ? gross_salary * 0.1 : 0; // 10% TDS if > 50k
    
    const total_deductions = pf_deduction + esi_deduction + professional_tax + tds;
    const net_salary = gross_salary - total_deductions;

    return {
      basic_salary: basicSalary,
      hra,
      medical_allowance,
      special_allowance,
      bonus: 0,
      overtime_pay: 0,
      gross_salary,
      pf_deduction,
      esi_deduction,
      professional_tax,
      tds,
      other_deductions: 0,
      total_deductions,
      net_salary,
    };
  };

  const generatePayroll = async () => {
    if (!confirm(`Generate payroll for all employees for ${getMonthName(selectedMonth)} ${selectedYear}?`)) return;

    try {
      let generated = 0;
      for (const employee of employees) {
        // Check if payroll already exists
        const exists = payrolls.find(
          (p) => p.employee_id === employee.id && p.month === selectedMonth.toString() && p.year === selectedYear
        );

        if (!exists) {
          const salaryComponents = calculateSalaryComponents(employee.salary);
          
          await api.createPayroll({
            employee_id: employee.id,
            month: selectedMonth.toString(),
            year: selectedYear,
            ...salaryComponents,
            status: 'draft',
          });
          generated++;
        }
      }

      toast.success(`Generated payroll for ${generated} employee(s)`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate payroll');
    }
  };

  const processPayroll = async (payrollId: string) => {
    try {
      await api.updatePayroll(payrollId, {
        status: 'processed',
      });
      toast.success('Payroll processed successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payroll');
    }
  };

  const markAsPaid = async (payrollId: string) => {
    try {
      await api.updatePayroll(payrollId, {
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'Bank Transfer',
      });
      toast.success('Marked as paid');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as paid');
    }
  };

  const downloadPayslipPDF = (payroll: Payroll) => {
    try {
      const employee = employees.find((e) => e.id === payroll.employee_id);
      if (!employee) {
        toast.error('Employee not found');
        return;
      }

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('PAYSLIP', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`For the month of ${getMonthName(parseInt(payroll.month))} ${payroll.year}`, 105, 28, { align: 'center' });
      
      // Employee Details
      doc.setFontSize(12);
      doc.text('Employee Details', 14, 40);
      
      autoTable(doc, {
        startY: 45,
        head: [],
        body: [
          ['Employee Code', employee.employee_code],
          ['Name', `${employee.first_name} ${employee.last_name}`],
          ['Department', employee.department],
          ['Designation', employee.designation],
          ['Bank Account', employee.bank_account_number || 'N/A'],
          ['PAN Number', employee.pan_number || 'N/A'],
        ],
        theme: 'plain',
        styles: { fontSize: 10 },
      });

      // Earnings
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Earnings', 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Component', 'Amount (₹)']],
        body: [
          ['Basic Salary', payroll.basic_salary.toFixed(2)],
          ['HRA', payroll.hra.toFixed(2)],
          ['Medical Allowance', payroll.medical_allowance.toFixed(2)],
          ['Special Allowance', payroll.special_allowance.toFixed(2)],
          ['Bonus', payroll.bonus.toFixed(2)],
          ['Overtime Pay', payroll.overtime_pay.toFixed(2)],
          ['Gross Salary', payroll.gross_salary.toFixed(2)],
        ],
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [34, 197, 94] },
      });

      // Deductions
      finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Deductions', 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Component', 'Amount (₹)']],
        body: [
          ['PF Deduction', payroll.pf_deduction.toFixed(2)],
          ['ESI Deduction', payroll.esi_deduction.toFixed(2)],
          ['Professional Tax', payroll.professional_tax.toFixed(2)],
          ['TDS', payroll.tds.toFixed(2)],
          ['Other Deductions', payroll.other_deductions.toFixed(2)],
          ['Total Deductions', payroll.total_deductions.toFixed(2)],
        ],
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [239, 68, 68] },
      });

      // Net Salary
      finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(`Net Salary: ₹${payroll.net_salary.toFixed(2)}`, 14, finalY);

      // Footer
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text('This is a system-generated payslip and does not require a signature.', 105, 280, { align: 'center' });

      doc.save(`Payslip_${employee.employee_code}_${getMonthName(parseInt(payroll.month))}_${payroll.year}.pdf`);
      toast.success('Payslip downloaded successfully');
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      toast.error(error.message || 'Failed to generate payslip');
    }
  };

  const handleExportPayroll = () => {
    try {
      const exportData = payrolls.map((payroll) => {
        const employee = employees.find((e) => e.id === payroll.employee_id);
        return {
          'Employee Code': employee?.employee_code || 'N/A',
          'Employee Name': employee ? `${employee.first_name} ${employee.last_name}` : 'N/A',
          Department: employee?.department || 'N/A',
          Designation: employee?.designation || 'N/A',
          'Basic Salary': payroll.basic_salary,
          HRA: payroll.hra,
          'Medical Allowance': payroll.medical_allowance,
          'Special Allowance': payroll.special_allowance,
          Bonus: payroll.bonus,
          'Overtime Pay': payroll.overtime_pay,
          'Gross Salary': payroll.gross_salary,
          'PF Deduction': payroll.pf_deduction,
          'ESI Deduction': payroll.esi_deduction,
          'Professional Tax': payroll.professional_tax,
          TDS: payroll.tds,
          'Other Deductions': payroll.other_deductions,
          'Total Deductions': payroll.total_deductions,
          'Net Salary': payroll.net_salary,
          Status: payroll.status,
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
      XLSX.writeFile(wb, `Payroll_${getMonthName(selectedMonth)}_${selectedYear}.xlsx`);
      toast.success('Payroll exported successfully');
    } catch (error: any) {
      toast.error('Failed to export payroll');
    }
  };

  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const totalGrossSalary = payrolls.reduce((sum, p) => sum + p.gross_salary, 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + p.total_deductions, 0);
  const totalNetSalary = payrolls.reduce((sum, p) => sum + p.net_salary, 0);
  const paidCount = payrolls.filter((p) => p.status === 'paid').length;

  if (loading) {
    return <div className="text-center py-8">Loading payroll...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Month/Year Selection & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <Label>Month</Label>
            <select
              className="p-2 border rounded"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-32"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPayroll}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
          <Button onClick={generatePayroll}>
            <Plus className="size-4 mr-2" />
            Generate Payroll
          </Button>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="size-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Gross Salary</p>
              <p className="text-xl font-bold">₹{totalGrossSalary.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Total Deductions</p>
              <p className="text-xl font-bold">₹{totalDeductions.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Wallet className="size-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Net Payable</p>
              <p className="text-xl font-bold">₹{totalNetSalary.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="size-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-xl font-bold">{paidCount}/{payrolls.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payroll List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Wallet className="size-5" />
          Payroll for {getMonthName(selectedMonth)} {selectedYear}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-right">Basic Salary</th>
                <th className="p-3 text-right">Gross Salary</th>
                <th className="p-3 text-right">Deductions</th>
                <th className="p-3 text-right">Net Salary</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No payroll records found. Click "Generate Payroll" to create records.
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => {
                  const employee = employees.find((e) => e.id === payroll.employee_id);
                  return (
                    <tr key={payroll.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{employee?.employee_code} • {employee?.designation}</div>
                      </td>
                      <td className="p-3 text-right">₹{payroll.basic_salary.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-semibold">₹{payroll.gross_salary.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-red-600">₹{payroll.total_deductions.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-bold text-green-600">₹{payroll.net_salary.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(payroll.status)}>
                          {payroll.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPayslipPDF(payroll)}
                            title="Download Payslip"
                          >
                            <Download className="size-4" />
                          </Button>
                          {payroll.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => processPayroll(payroll.id)}
                              title="Process Payroll"
                            >
                              <Send className="size-4" />
                            </Button>
                          )}
                          {payroll.status === 'processed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsPaid(payroll.id)}
                              className="text-green-600"
                              title="Mark as Paid"
                            >
                              <Wallet className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
