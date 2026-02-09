import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
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
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  Award,
  Briefcase,
  CalendarClock,
  BarChart3,
  CreditCard,
  Download,
  Upload,
  Search,
  Filter,
  UserCheck,
  UserX,
  AlertTriangle,
  Building2,
  BookOpen,
  Shield,
  FileCheck
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Checkbox } from './ui/checkbox';

export function HRMComprehensive() {
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(true);

  // Employees
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [createEmployeeOpen, setCreateEmployeeOpen] = useState(false);
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [viewEmployeeOpen, setViewEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Employee Form
  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empJoiningDate, setEmpJoiningDate] = useState('');
  const [empDOB, setEmpDOB] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empBasicSalary, setEmpBasicSalary] = useState('');
  const [empHRA, setEmpHRA] = useState('');
  const [empDA, setEmpDA] = useState('');
  const [empOtherAllowances, setEmpOtherAllowances] = useState('');
  const [empPAN, setEmpPAN] = useState('');
  const [empAadhar, setEmpAadhar] = useState('');
  const [empBankAccount, setEmpBankAccount] = useState('');
  const [empIFSC, setEmpIFSC] = useState('');
  const [empStatus, setEmpStatus] = useState('active');

  // Attendance
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [markAttendanceOpen, setMarkAttendanceOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceEmployee, setAttendanceEmployee] = useState('');
  const [attendanceCheckIn, setAttendanceCheckIn] = useState('');
  const [attendanceCheckOut, setAttendanceCheckOut] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('today');

  // Leave Management
  const [leaveApplications, setLeaveApplications] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false);
  const [leaveEmployee, setLeaveEmployee] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [leaveFromDate, setLeaveFromDate] = useState('');
  const [leaveToDate, setLeaveToDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFilter, setLeaveFilter] = useState('pending');

  // Payroll
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [processPayrollOpen, setProcessPayrollOpen] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('');
  const [payrollYear, setPayrollYear] = useState('');
  const [viewPayslipOpen, setViewPayslipOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  // Performance
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [createReviewOpen, setCreateReviewOpen] = useState(false);
  const [reviewEmployee, setReviewEmployee] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('');
  const [reviewRating, setReviewRating] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewGoals, setReviewGoals] = useState('');

  // Shifts
  const [shifts, setShifts] = useState<any[]>([]);
  const [createShiftOpen, setCreateShiftOpen] = useState(false);
  const [shiftName, setShiftName] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [shiftBreakDuration, setShiftBreakDuration] = useState('');

  // Holidays
  const [holidays, setHolidays] = useState<any[]>([]);
  const [createHolidayOpen, setCreateHolidayOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayType, setHolidayType] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEmployees(),
        loadDepartments(),
        loadDesignations(),
        loadAttendance(),
        loadLeaveApplications(),
        loadLeaveTypes(),
        loadPayroll(),
        loadPerformanceReviews(),
        loadShifts(),
        loadHolidays()
      ]);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const result = await api.getEmployees();
      setEmployees(result.employees || []);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const result = await api.getDepartments();
      setDepartments(result.departments || []);
    } catch (error: any) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadDesignations = async () => {
    try {
      const result = await api.getDesignations();
      setDesignations(result.designations || []);
    } catch (error: any) {
      console.error('Failed to load designations:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      const result = await api.getAttendance();
      setAttendanceRecords(result.attendance || []);
    } catch (error: any) {
      console.error('Failed to load attendance:', error);
    }
  };

  const loadLeaveApplications = async () => {
    try {
      const result = await api.getLeaveApplications();
      setLeaveApplications(result.applications || []);
    } catch (error: any) {
      console.error('Failed to load leave applications:', error);
    }
  };

  const loadLeaveTypes = async () => {
    try {
      const result = await api.getLeaveTypes();
      setLeaveTypes(result.leave_types || []);
    } catch (error: any) {
      console.error('Failed to load leave types:', error);
      // Set default leave types
      setLeaveTypes([
        { id: '1', name: 'Casual Leave', days_allowed: 12 },
        { id: '2', name: 'Sick Leave', days_allowed: 12 },
        { id: '3', name: 'Earned Leave', days_allowed: 15 },
        { id: '4', name: 'Maternity Leave', days_allowed: 180 },
        { id: '5', name: 'Paternity Leave', days_allowed: 15 }
      ]);
    }
  };

  const loadPayroll = async () => {
    try {
      const result = await api.getPayroll();
      setPayrollRecords(result.payroll || []);
    } catch (error: any) {
      console.error('Failed to load payroll:', error);
    }
  };

  const loadPerformanceReviews = async () => {
    try {
      const result = await api.getPerformanceReviews();
      setPerformanceReviews(result.reviews || []);
    } catch (error: any) {
      console.error('Failed to load performance reviews:', error);
    }
  };

  const loadShifts = async () => {
    try {
      const result = await api.getShifts();
      setShifts(result.shifts || []);
    } catch (error: any) {
      console.error('Failed to load shifts:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      const result = await api.getHolidays();
      setHolidays(result.holidays || []);
    } catch (error: any) {
      console.error('Failed to load holidays:', error);
    }
  };

  // Employee Management Functions
  const handleCreateEmployee = async () => {
    if (!empName || !empCode || !empDepartment || !empDesignation) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createEmployee({
        employee_code: empCode,
        name: empName,
        email: empEmail,
        phone: empPhone,
        department_id: empDepartment,
        designation_id: empDesignation,
        joining_date: empJoiningDate,
        date_of_birth: empDOB,
        address: empAddress,
        basic_salary: parseFloat(empBasicSalary) || 0,
        hra: parseFloat(empHRA) || 0,
        da: parseFloat(empDA) || 0,
        other_allowances: parseFloat(empOtherAllowances) || 0,
        pan_number: empPAN,
        aadhar_number: empAadhar,
        bank_account: empBankAccount,
        ifsc_code: empIFSC,
        status: empStatus
      });
      toast.success('Employee created successfully!');
      setCreateEmployeeOpen(false);
      resetEmployeeForm();
      loadEmployees();
    } catch (error: any) {
      toast.error(`Failed to create employee: ${error.message}`);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      await api.updateEmployee(selectedEmployee.id, {
        employee_code: empCode,
        name: empName,
        email: empEmail,
        phone: empPhone,
        department_id: empDepartment,
        designation_id: empDesignation,
        joining_date: empJoiningDate,
        date_of_birth: empDOB,
        address: empAddress,
        basic_salary: parseFloat(empBasicSalary) || 0,
        hra: parseFloat(empHRA) || 0,
        da: parseFloat(empDA) || 0,
        other_allowances: parseFloat(empOtherAllowances) || 0,
        pan_number: empPAN,
        aadhar_number: empAadhar,
        bank_account: empBankAccount,
        ifsc_code: empIFSC,
        status: empStatus
      });
      toast.success('Employee updated successfully!');
      setEditEmployeeOpen(false);
      setSelectedEmployee(null);
      resetEmployeeForm();
      loadEmployees();
    } catch (error: any) {
      toast.error(`Failed to update employee: ${error.message}`);
    }
  };

  const openEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setEmpName(employee.name);
    setEmpCode(employee.employee_code);
    setEmpEmail(employee.email || '');
    setEmpPhone(employee.phone || '');
    setEmpDepartment(employee.department_id || '');
    setEmpDesignation(employee.designation_id || '');
    setEmpJoiningDate(employee.joining_date || '');
    setEmpDOB(employee.date_of_birth || '');
    setEmpAddress(employee.address || '');
    setEmpBasicSalary(employee.basic_salary?.toString() || '');
    setEmpHRA(employee.hra?.toString() || '');
    setEmpDA(employee.da?.toString() || '');
    setEmpOtherAllowances(employee.other_allowances?.toString() || '');
    setEmpPAN(employee.pan_number || '');
    setEmpAadhar(employee.aadhar_number || '');
    setEmpBankAccount(employee.bank_account || '');
    setEmpIFSC(employee.ifsc_code || '');
    setEmpStatus(employee.status || 'active');
    setEditEmployeeOpen(true);
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete employee "${employeeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteEmployee(employeeId);
      toast.success('Employee deleted successfully!');
      loadEmployees();
    } catch (error: any) {
      toast.error(`Failed to delete employee: ${error.message}`);
    }
  };

  const resetEmployeeForm = () => {
    setEmpName('');
    setEmpCode('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpDepartment('');
    setEmpDesignation('');
    setEmpJoiningDate('');
    setEmpDOB('');
    setEmpAddress('');
    setEmpBasicSalary('');
    setEmpHRA('');
    setEmpDA('');
    setEmpOtherAllowances('');
    setEmpPAN('');
    setEmpAadhar('');
    setEmpBankAccount('');
    setEmpIFSC('');
    setEmpStatus('active');
  };

  // Attendance Functions
  const handleMarkAttendance = async () => {
    if (!attendanceEmployee || !attendanceDate) {
      toast.error('Please select employee and date');
      return;
    }

    try {
      await api.markAttendance({
        employee_id: attendanceEmployee,
        date: attendanceDate,
        check_in: attendanceCheckIn,
        check_out: attendanceCheckOut,
        status: attendanceStatus,
        notes: attendanceNotes
      });
      toast.success('Attendance marked successfully!');
      setMarkAttendanceOpen(false);
      resetAttendanceForm();
      loadAttendance();
    } catch (error: any) {
      toast.error(`Failed to mark attendance: ${error.message}`);
    }
  };

  const handleDeleteAttendance = async (attendanceId: string, date: string) => {
    if (!confirm(`Are you sure you want to delete attendance record for ${date}?`)) {
      return;
    }

    try {
      await api.deleteAttendance(attendanceId);
      toast.success('Attendance record deleted successfully!');
      loadAttendance();
    } catch (error: any) {
      toast.error(`Failed to delete attendance: ${error.message}`);
    }
  };

  const resetAttendanceForm = () => {
    setAttendanceEmployee('');
    setAttendanceCheckIn('');
    setAttendanceCheckOut('');
    setAttendanceStatus('present');
    setAttendanceNotes('');
  };

  // Leave Management Functions
  const handleApplyLeave = async () => {
    if (!leaveEmployee || !leaveType || !leaveFromDate || !leaveToDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.applyLeave({
        employee_id: leaveEmployee,
        leave_type_id: leaveType,
        from_date: leaveFromDate,
        to_date: leaveToDate,
        reason: leaveReason,
        status: 'pending'
      });
      toast.success('Leave application submitted successfully!');
      setApplyLeaveOpen(false);
      resetLeaveForm();
      loadLeaveApplications();
    } catch (error: any) {
      toast.error(`Failed to apply leave: ${error.message}`);
    }
  };

  const handleLeaveAction = async (leaveId: string, action: 'approve' | 'reject') => {
    try {
      await api.updateLeaveStatus(leaveId, action === 'approve' ? 'approved' : 'rejected');
      toast.success(`Leave ${action}d successfully!`);
      loadLeaveApplications();
    } catch (error: any) {
      toast.error(`Failed to ${action} leave: ${error.message}`);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to delete this leave application?')) {
      return;
    }

    try {
      await api.deleteLeaveApplication(leaveId);
      toast.success('Leave application deleted successfully!');
      loadLeaveApplications();
    } catch (error: any) {
      toast.error(`Failed to delete leave application: ${error.message}`);
    }
  };

  const resetLeaveForm = () => {
    setLeaveEmployee('');
    setLeaveType('');
    setLeaveFromDate('');
    setLeaveToDate('');
    setLeaveReason('');
  };

  // Payroll Functions
  const handleProcessPayroll = async () => {
    if (!payrollMonth || !payrollYear) {
      toast.error('Please select month and year');
      return;
    }

    try {
      await api.processPayroll({
        month: payrollMonth,
        year: payrollYear
      });
      toast.success('Payroll processed successfully!');
      setProcessPayrollOpen(false);
      loadPayroll();
    } catch (error: any) {
      toast.error(`Failed to process payroll: ${error.message}`);
    }
  };

  const handleViewPayslip = (payroll: any) => {
    setSelectedPayslip(payroll);
    setViewPayslipOpen(true);
  };

  // Performance Functions
  const handleCreateReview = async () => {
    if (!reviewEmployee || !reviewPeriod || !reviewRating) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createPerformanceReview({
        employee_id: reviewEmployee,
        review_period: reviewPeriod,
        rating: parseFloat(reviewRating),
        comments: reviewComments,
        goals: reviewGoals
      });
      toast.success('Performance review created successfully!');
      setCreateReviewOpen(false);
      resetReviewForm();
      loadPerformanceReviews();
    } catch (error: any) {
      toast.error(`Failed to create review: ${error.message}`);
    }
  };

  const resetReviewForm = () => {
    setReviewEmployee('');
    setReviewPeriod('');
    setReviewRating('');
    setReviewComments('');
    setReviewGoals('');
  };

  // Shift Functions
  const handleCreateShift = async () => {
    if (!shiftName || !shiftStartTime || !shiftEndTime) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createShift({
        name: shiftName,
        start_time: shiftStartTime,
        end_time: shiftEndTime,
        break_duration: parseInt(shiftBreakDuration) || 0
      });
      toast.success('Shift created successfully!');
      setCreateShiftOpen(false);
      resetShiftForm();
      loadShifts();
    } catch (error: any) {
      toast.error(`Failed to create shift: ${error.message}`);
    }
  };

  const handleDeleteShift = async (shiftId: string, shiftName: string) => {
    if (!confirm(`Are you sure you want to delete shift "${shiftName}"?`)) {
      return;
    }

    try {
      await api.deleteShift(shiftId);
      toast.success('Shift deleted successfully!');
      loadShifts();
    } catch (error: any) {
      toast.error(`Failed to delete shift: ${error.message}`);
    }
  };

  const resetShiftForm = () => {
    setShiftName('');
    setShiftStartTime('');
    setShiftEndTime('');
    setShiftBreakDuration('');
  };

  // Holiday Functions
  const handleCreateHoliday = async () => {
    if (!holidayName || !holidayDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.createHoliday({
        name: holidayName,
        date: holidayDate,
        type: holidayType || 'public'
      });
      toast.success('Holiday created successfully!');
      setCreateHolidayOpen(false);
      resetHolidayForm();
      loadHolidays();
    } catch (error: any) {
      toast.error(`Failed to create holiday: ${error.message}`);
    }
  };

  const handleDeleteHoliday = async (holidayId: string, holidayName: string) => {
    if (!confirm(`Are you sure you want to delete holiday "${holidayName}"?`)) {
      return;
    }

    try {
      await api.deleteHoliday(holidayId);
      toast.success('Holiday deleted successfully!');
      loadHolidays();
    } catch (error: any) {
      toast.error(`Failed to delete holiday: ${error.message}`);
    }
  };

  const resetHolidayForm = () => {
    setHolidayName('');
    setHolidayDate('');
    setHolidayType('');
  };

  const calculateTotalSalary = () => {
    const basic = parseFloat(empBasicSalary) || 0;
    const hra = parseFloat(empHRA) || 0;
    const da = parseFloat(empDA) || 0;
    const other = parseFloat(empOtherAllowances) || 0;
    return basic + hra + da + other;
  };

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.status === 'present').length;
    const absent = attendanceRecords.filter(a => a.status === 'absent').length;
    const halfDay = attendanceRecords.filter(a => a.status === 'half_day').length;
    return { total, present, absent, halfDay };
  };

  const getLeaveStats = () => {
    const total = leaveApplications.length;
    const pending = leaveApplications.filter(l => l.status === 'pending').length;
    const approved = leaveApplications.filter(l => l.status === 'approved').length;
    const rejected = leaveApplications.filter(l => l.status === 'rejected').length;
    return { total, pending, approved, rejected };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  const attendanceStats = getAttendanceStats();
  const leaveStats = getLeaveStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="size-8 text-blue-600" />
            Human Resource Management
          </h1>
          <p className="text-gray-500 mt-1">
            Complete employee lifecycle management system
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <Users className="size-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <UserCheck className="size-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Leaves</p>
                <p className="text-2xl font-bold text-yellow-600">{leaveStats.pending}</p>
              </div>
              <Calendar className="size-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Building2 className="size-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="employees">
            <Users className="size-4 mr-2" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Clock className="size-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave">
            <Calendar className="size-4 mr-2" />
            Leave
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <DollarSign className="size-4 mr-2" />
            Payroll
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="size-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="shifts">
            <CalendarClock className="size-4 mr-2" />
            Shifts
          </TabsTrigger>
          <TabsTrigger value="holidays">
            <Award className="size-4 mr-2" />
            Holidays
          </TabsTrigger>
        </TabsList>

        {/* EMPLOYEES TAB */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employee Directory</CardTitle>
                  <CardDescription>Manage employee records and information</CardDescription>
                </div>
                <Dialog open={createEmployeeOpen} onOpenChange={setCreateEmployeeOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="size-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>
                        Enter employee details to create a new record
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Basic Information */}
                      <div className="border-b pb-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="size-4" />
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="emp-code">Employee Code *</Label>
                            <Input
                              id="emp-code"
                              value={empCode}
                              onChange={(e) => setEmpCode(e.target.value)}
                              placeholder="EMP001"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-name">Full Name *</Label>
                            <Input
                              id="emp-name"
                              value={empName}
                              onChange={(e) => setEmpName(e.target.value)}
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-email">Email</Label>
                            <Input
                              id="emp-email"
                              type="email"
                              value={empEmail}
                              onChange={(e) => setEmpEmail(e.target.value)}
                              placeholder="john@company.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-phone">Phone</Label>
                            <Input
                              id="emp-phone"
                              value={empPhone}
                              onChange={(e) => setEmpPhone(e.target.value)}
                              placeholder="+91 1234567890"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-dob">Date of Birth</Label>
                            <Input
                              id="emp-dob"
                              type="date"
                              value={empDOB}
                              onChange={(e) => setEmpDOB(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-joining">Joining Date</Label>
                            <Input
                              id="emp-joining"
                              type="date"
                              value={empJoiningDate}
                              onChange={(e) => setEmpJoiningDate(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="emp-address">Address</Label>
                          <Textarea
                            id="emp-address"
                            value={empAddress}
                            onChange={(e) => setEmpAddress(e.target.value)}
                            placeholder="Complete address"
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Employment Details */}
                      <div className="border-b pb-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Briefcase className="size-4" />
                          Employment Details
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="emp-department">Department *</Label>
                            <Select value={empDepartment} onValueChange={setEmpDepartment}>
                              <SelectTrigger id="emp-department">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="emp-designation">Designation *</Label>
                            <Select value={empDesignation} onValueChange={setEmpDesignation}>
                              <SelectTrigger id="emp-designation">
                                <SelectValue placeholder="Select designation" />
                              </SelectTrigger>
                              <SelectContent>
                                {designations.map((desig) => (
                                  <SelectItem key={desig.id} value={desig.id}>
                                    {desig.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="emp-status">Status</Label>
                            <Select value={empStatus} onValueChange={setEmpStatus}>
                              <SelectTrigger id="emp-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="on_leave">On Leave</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Salary Details */}
                      <div className="border-b pb-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="size-4" />
                          Salary Structure
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="emp-basic">Basic Salary</Label>
                            <Input
                              id="emp-basic"
                              type="number"
                              value={empBasicSalary}
                              onChange={(e) => setEmpBasicSalary(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-hra">HRA</Label>
                            <Input
                              id="emp-hra"
                              type="number"
                              value={empHRA}
                              onChange={(e) => setEmpHRA(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-da">DA</Label>
                            <Input
                              id="emp-da"
                              type="number"
                              value={empDA}
                              onChange={(e) => setEmpDA(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-other">Other Allowances</Label>
                            <Input
                              id="emp-other"
                              type="number"
                              value={empOtherAllowances}
                              onChange={(e) => setEmpOtherAllowances(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-semibold text-blue-800">
                            Total Gross Salary: ₹{calculateTotalSalary().toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Statutory Details */}
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <FileCheck className="size-4" />
                          Statutory & Bank Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="emp-pan">PAN Number</Label>
                            <Input
                              id="emp-pan"
                              value={empPAN}
                              onChange={(e) => setEmpPAN(e.target.value)}
                              placeholder="ABCDE1234F"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-aadhar">Aadhar Number</Label>
                            <Input
                              id="emp-aadhar"
                              value={empAadhar}
                              onChange={(e) => setEmpAadhar(e.target.value)}
                              placeholder="1234 5678 9012"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-bank">Bank Account Number</Label>
                            <Input
                              id="emp-bank"
                              value={empBankAccount}
                              onChange={(e) => setEmpBankAccount(e.target.value)}
                              placeholder="123456789012"
                            />
                          </div>
                          <div>
                            <Label htmlFor="emp-ifsc">IFSC Code</Label>
                            <Input
                              id="emp-ifsc"
                              value={empIFSC}
                              onChange={(e) => setEmpIFSC(e.target.value)}
                              placeholder="SBIN0001234"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateEmployeeOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateEmployee}>
                        Create Employee
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No employees found</p>
                  <p className="text-sm">Add your first employee to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => {
                      const dept = departments.find(d => d.id === emp.department_id);
                      const desig = designations.find(d => d.id === emp.designation_id);
                      const grossSalary = (emp.basic_salary || 0) + (emp.hra || 0) + (emp.da || 0) + (emp.other_allowances || 0);
                      
                      return (
                        <TableRow key={emp.id}>
                          <TableCell className="font-medium">{emp.employee_code}</TableCell>
                          <TableCell>{emp.name}</TableCell>
                          <TableCell>{dept?.name || '-'}</TableCell>
                          <TableCell>{desig?.name || '-'}</TableCell>
                          <TableCell>{emp.phone || '-'}</TableCell>
                          <TableCell>₹{grossSalary.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                              {emp.status || 'active'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setViewEmployeeOpen(true);
                                }}
                              >
                                <Eye className="size-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditEmployee(emp)}
                              >
                                <Edit className="size-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Employee Dialog */}
          <Dialog open={editEmployeeOpen} onOpenChange={setEditEmployeeOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>
                  Update employee information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Same form fields as create */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-emp-code">Employee Code</Label>
                    <Input
                      id="edit-emp-code"
                      value={empCode}
                      onChange={(e) => setEmpCode(e.target.value)}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-emp-name">Full Name</Label>
                    <Input
                      id="edit-emp-name"
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-emp-email">Email</Label>
                    <Input
                      id="edit-emp-email"
                      type="email"
                      value={empEmail}
                      onChange={(e) => setEmpEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-emp-phone">Phone</Label>
                    <Input
                      id="edit-emp-phone"
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-emp-department">Department</Label>
                    <Select value={empDepartment} onValueChange={setEmpDepartment}>
                      <SelectTrigger id="edit-emp-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-emp-designation">Designation</Label>
                    <Select value={empDesignation} onValueChange={setEmpDesignation}>
                      <SelectTrigger id="edit-emp-designation">
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map((desig) => (
                          <SelectItem key={desig.id} value={desig.id}>
                            {desig.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-emp-basic">Basic Salary</Label>
                    <Input
                      id="edit-emp-basic"
                      type="number"
                      value={empBasicSalary}
                      onChange={(e) => setEmpBasicSalary(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-emp-status">Status</Label>
                    <Select value={empStatus} onValueChange={setEmpStatus}>
                      <SelectTrigger id="edit-emp-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditEmployeeOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateEmployee}>
                  Update Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Employee Dialog */}
          <Dialog open={viewEmployeeOpen} onOpenChange={setViewEmployeeOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Employee Details</DialogTitle>
                <DialogDescription>
                  View complete employee information and salary structure
                </DialogDescription>
              </DialogHeader>
              {selectedEmployee && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Employee Code</Label>
                      <p className="font-semibold">{selectedEmployee.employee_code}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Name</Label>
                      <p className="font-semibold">{selectedEmployee.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-semibold">{selectedEmployee.email || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="font-semibold">{selectedEmployee.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Department</Label>
                      <p className="font-semibold">
                        {departments.find(d => d.id === selectedEmployee.department_id)?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Designation</Label>
                      <p className="font-semibold">
                        {designations.find(d => d.id === selectedEmployee.designation_id)?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Joining Date</Label>
                      <p className="font-semibold">
                        {selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge variant={selectedEmployee.status === 'active' ? 'default' : 'secondary'}>
                        {selectedEmployee.status || 'active'}
                      </Badge>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <Label className="text-gray-500 mb-2 block">Salary Structure</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Basic Salary:</span>
                        <span className="font-semibold">₹{selectedEmployee.basic_salary?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>HRA:</span>
                        <span className="font-semibold">₹{selectedEmployee.hra?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>DA:</span>
                        <span className="font-semibold">₹{selectedEmployee.da?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Other Allowances:</span>
                        <span className="font-semibold">₹{selectedEmployee.other_allowances?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-semibold">Gross Salary:</span>
                        <span className="font-bold text-blue-800">
                          ₹{((selectedEmployee.basic_salary || 0) + (selectedEmployee.hra || 0) + (selectedEmployee.da || 0) + (selectedEmployee.other_allowances || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setViewEmployeeOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ATTENDANCE TAB */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Management</CardTitle>
                  <CardDescription>Track daily attendance and work hours</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Records</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={markAttendanceOpen} onOpenChange={setMarkAttendanceOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Clock className="size-4 mr-2" />
                        Mark Attendance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mark Attendance</DialogTitle>
                        <DialogDescription>
                          Record employee attendance for a specific date
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="attendance-employee">Employee *</Label>
                          <Select value={attendanceEmployee} onValueChange={setAttendanceEmployee}>
                            <SelectTrigger id="attendance-employee">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.employee_code} - {emp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="attendance-date">Date *</Label>
                          <Input
                            id="attendance-date"
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="attendance-checkin">Check In Time</Label>
                            <Input
                              id="attendance-checkin"
                              type="time"
                              value={attendanceCheckIn}
                              onChange={(e) => setAttendanceCheckIn(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="attendance-checkout">Check Out Time</Label>
                            <Input
                              id="attendance-checkout"
                              type="time"
                              value={attendanceCheckOut}
                              onChange={(e) => setAttendanceCheckOut(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="attendance-status">Status *</Label>
                          <Select value={attendanceStatus} onValueChange={setAttendanceStatus}>
                            <SelectTrigger id="attendance-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="half_day">Half Day</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                              <SelectItem value="on_leave">On Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="attendance-notes">Notes</Label>
                          <Textarea
                            id="attendance-notes"
                            value={attendanceNotes}
                            onChange={(e) => setAttendanceNotes(e.target.value)}
                            placeholder="Additional notes"
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setMarkAttendanceOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleMarkAttendance}>
                          Mark Attendance
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold">{attendanceStats.total}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Present</p>
                      <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Half Day</p>
                      <p className="text-2xl font-bold text-yellow-600">{attendanceStats.halfDay}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {attendanceRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No attendance records found</p>
                  <p className="text-sm">Mark attendance to track employee work hours</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => {
                      const emp = employees.find(e => e.id === record.employee_id);
                      const calculateHours = () => {
                        if (!record.check_in || !record.check_out) return '-';
                        const checkIn = new Date(`2000-01-01 ${record.check_in}`);
                        const checkOut = new Date(`2000-01-01 ${record.check_out}`);
                        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
                        return hours.toFixed(2) + ' hrs';
                      };

                      return (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{emp?.employee_code} - {emp?.name}</TableCell>
                          <TableCell>{record.check_in || '-'}</TableCell>
                          <TableCell>{record.check_out || '-'}</TableCell>
                          <TableCell>{calculateHours()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === 'present' ? 'default' :
                                record.status === 'absent' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {record.notes || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAttendance(record.id, new Date(record.date).toLocaleDateString())}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LEAVE TAB */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Leave Management</CardTitle>
                  <CardDescription>Manage employee leave applications</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={leaveFilter} onValueChange={setLeaveFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="all">All Applications</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={applyLeaveOpen} onOpenChange={setApplyLeaveOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Calendar className="size-4 mr-2" />
                        Apply Leave
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for Leave</DialogTitle>
                        <DialogDescription>
                          Submit a leave application for an employee
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="leave-employee">Employee *</Label>
                          <Select value={leaveEmployee} onValueChange={setLeaveEmployee}>
                            <SelectTrigger id="leave-employee">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.employee_code} - {emp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="leave-type">Leave Type *</Label>
                          <Select value={leaveType} onValueChange={setLeaveType}>
                            <SelectTrigger id="leave-type">
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent>
                              {leaveTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name} ({type.days_allowed} days allowed)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="leave-from">From Date *</Label>
                            <Input
                              id="leave-from"
                              type="date"
                              value={leaveFromDate}
                              onChange={(e) => setLeaveFromDate(e.target.value)}
                            />
                          </div>

                          <div>
                            <Label htmlFor="leave-to">To Date *</Label>
                            <Input
                              id="leave-to"
                              type="date"
                              value={leaveToDate}
                              onChange={(e) => setLeaveToDate(e.target.value)}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="leave-reason">Reason</Label>
                          <Textarea
                            id="leave-reason"
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            placeholder="Reason for leave"
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyLeaveOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleApplyLeave}>
                          Submit Application
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold">{leaveStats.total}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{leaveStats.pending}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Approved</p>
                      <p className="text-2xl font-bold text-green-600">{leaveStats.approved}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">{leaveStats.rejected}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {leaveApplications.filter(l => leaveFilter === 'all' || l.status === leaveFilter).length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No leave applications found</p>
                  <p className="text-sm">Submit leave applications for employees</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>From Date</TableHead>
                      <TableHead>To Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveApplications
                      .filter(l => leaveFilter === 'all' || l.status === leaveFilter)
                      .map((leave) => {
                        const emp = employees.find(e => e.id === leave.employee_id);
                        const type = leaveTypes.find(t => t.id === leave.leave_type_id);
                        const fromDate = new Date(leave.from_date);
                        const toDate = new Date(leave.to_date);
                        const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        return (
                          <TableRow key={leave.id}>
                            <TableCell>{emp?.employee_code} - {emp?.name}</TableCell>
                            <TableCell>{type?.name}</TableCell>
                            <TableCell>{fromDate.toLocaleDateString()}</TableCell>
                            <TableCell>{toDate.toLocaleDateString()}</TableCell>
                            <TableCell>{days} days</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {leave.reason || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  leave.status === 'approved' ? 'default' :
                                  leave.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {leave.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {leave.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleLeaveAction(leave.id, 'approve')}
                                    >
                                      <CheckCircle className="size-3 mr-1 text-green-600" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleLeaveAction(leave.id, 'reject')}
                                    >
                                      <XCircle className="size-3 mr-1 text-red-600" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteLeave(leave.id)}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYROLL TAB */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payroll Management</CardTitle>
                  <CardDescription>Process salaries and generate payslips</CardDescription>
                </div>
                <Dialog open={processPayrollOpen} onOpenChange={setProcessPayrollOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <DollarSign className="size-4 mr-2" />
                      Process Payroll
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Process Payroll</DialogTitle>
                      <DialogDescription>
                        Process monthly payroll for all employees
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="payroll-month">Month *</Label>
                          <Select value={payrollMonth} onValueChange={setPayrollMonth}>
                            <SelectTrigger id="payroll-month">
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="01">January</SelectItem>
                              <SelectItem value="02">February</SelectItem>
                              <SelectItem value="03">March</SelectItem>
                              <SelectItem value="04">April</SelectItem>
                              <SelectItem value="05">May</SelectItem>
                              <SelectItem value="06">June</SelectItem>
                              <SelectItem value="07">July</SelectItem>
                              <SelectItem value="08">August</SelectItem>
                              <SelectItem value="09">September</SelectItem>
                              <SelectItem value="10">October</SelectItem>
                              <SelectItem value="11">November</SelectItem>
                              <SelectItem value="12">December</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="payroll-year">Year *</Label>
                          <Select value={payrollYear} onValueChange={setPayrollYear}>
                            <SelectTrigger id="payroll-year">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertTriangle className="size-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Processing Information</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          This will process payroll for all active employees. Attendance and leave records will be considered for salary calculation.
                        </AlertDescription>
                      </Alert>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setProcessPayrollOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleProcessPayroll}>
                        Process Payroll
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {payrollRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No payroll records found</p>
                  <p className="text-sm">Process payroll to generate salary records</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords.map((payroll) => {
                      const emp = employees.find(e => e.id === payroll.employee_id);
                      
                      return (
                        <TableRow key={payroll.id}>
                          <TableCell>{emp?.employee_code} - {emp?.name}</TableCell>
                          <TableCell>{payroll.month}/{payroll.year}</TableCell>
                          <TableCell>₹{payroll.gross_salary?.toFixed(2)}</TableCell>
                          <TableCell>₹{payroll.deductions?.toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">
                            ₹{payroll.net_salary?.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
                              {payroll.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPayslip(payroll)}
                            >
                              <Eye className="size-3 mr-1" />
                              Payslip
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* View Payslip Dialog */}
          <Dialog open={viewPayslipOpen} onOpenChange={setViewPayslipOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Payslip</DialogTitle>
                <DialogDescription>
                  Detailed salary breakdown and payment information
                </DialogDescription>
              </DialogHeader>
              {selectedPayslip && (
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-500">Employee</Label>
                        <p className="font-semibold">
                          {employees.find(e => e.id === selectedPayslip.employee_id)?.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Month/Year</Label>
                        <p className="font-semibold">
                          {selectedPayslip.month}/{selectedPayslip.year}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Basic Salary:</span>
                      <span className="font-semibold">₹{selectedPayslip.basic_salary?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>HRA:</span>
                      <span className="font-semibold">₹{selectedPayslip.hra?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>DA:</span>
                      <span className="font-semibold">₹{selectedPayslip.da?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>Other Allowances:</span>
                      <span className="font-semibold">₹{selectedPayslip.other_allowances?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 rounded border-t-2 border-blue-300">
                      <span className="font-semibold">Gross Salary:</span>
                      <span className="font-bold">₹{selectedPayslip.gross_salary?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-red-50 rounded">
                      <span className="text-red-700">Deductions:</span>
                      <span className="font-semibold text-red-700">₹{selectedPayslip.deductions?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded border-2 border-green-300">
                      <span className="font-bold text-green-800">Net Salary:</span>
                      <span className="font-bold text-green-800 text-lg">₹{selectedPayslip.net_salary?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewPayslipOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="size-4 mr-2" />
                  Download PDF
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Management</CardTitle>
                  <CardDescription>Track employee performance and reviews</CardDescription>
                </div>
                <Dialog open={createReviewOpen} onOpenChange={setCreateReviewOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <TrendingUp className="size-4 mr-2" />
                      Create Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Performance Review</DialogTitle>
                      <DialogDescription>
                        Conduct performance review for an employee
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="review-employee">Employee *</Label>
                        <Select value={reviewEmployee} onValueChange={setReviewEmployee}>
                          <SelectTrigger id="review-employee">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.employee_code} - {emp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="review-period">Review Period *</Label>
                          <Input
                            id="review-period"
                            value={reviewPeriod}
                            onChange={(e) => setReviewPeriod(e.target.value)}
                            placeholder="Q1 2025"
                          />
                        </div>

                        <div>
                          <Label htmlFor="review-rating">Rating (1-5) *</Label>
                          <Select value={reviewRating} onValueChange={setReviewRating}>
                            <SelectTrigger id="review-rating">
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 - Outstanding</SelectItem>
                              <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                              <SelectItem value="3">3 - Meets Expectations</SelectItem>
                              <SelectItem value="2">2 - Needs Improvement</SelectItem>
                              <SelectItem value="1">1 - Unsatisfactory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="review-comments">Performance Comments</Label>
                        <Textarea
                          id="review-comments"
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Detailed performance feedback"
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="review-goals">Goals for Next Period</Label>
                        <Textarea
                          id="review-goals"
                          value={reviewGoals}
                          onChange={(e) => setReviewGoals(e.target.value)}
                          placeholder="Set goals for the upcoming period"
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateReviewOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateReview}>
                        Create Review
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {performanceReviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No performance reviews found</p>
                  <p className="text-sm">Create reviews to track employee performance</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceReviews.map((review) => {
                      const emp = employees.find(e => e.id === review.employee_id);
                      const getRatingColor = (rating: number) => {
                        if (rating >= 4.5) return 'text-green-600';
                        if (rating >= 3.5) return 'text-blue-600';
                        if (rating >= 2.5) return 'text-yellow-600';
                        return 'text-red-600';
                      };

                      return (
                        <TableRow key={review.id}>
                          <TableCell>{emp?.employee_code} - {emp?.name}</TableCell>
                          <TableCell>{review.review_period}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${getRatingColor(review.rating)}`}>
                              {review.rating}/5
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {review.comments || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(review.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="size-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIFTS TAB */}
        <TabsContent value="shifts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shift Management</CardTitle>
                  <CardDescription>Manage work shifts and schedules</CardDescription>
                </div>
                <Dialog open={createShiftOpen} onOpenChange={setCreateShiftOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Shift</DialogTitle>
                      <DialogDescription>
                        Define a new work shift
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="shift-name">Shift Name *</Label>
                        <Input
                          id="shift-name"
                          value={shiftName}
                          onChange={(e) => setShiftName(e.target.value)}
                          placeholder="Morning Shift"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shift-start">Start Time *</Label>
                          <Input
                            id="shift-start"
                            type="time"
                            value={shiftStartTime}
                            onChange={(e) => setShiftStartTime(e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="shift-end">End Time *</Label>
                          <Input
                            id="shift-end"
                            type="time"
                            value={shiftEndTime}
                            onChange={(e) => setShiftEndTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="shift-break">Break Duration (minutes)</Label>
                        <Input
                          id="shift-break"
                          type="number"
                          value={shiftBreakDuration}
                          onChange={(e) => setShiftBreakDuration(e.target.value)}
                          placeholder="60"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateShiftOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateShift}>
                        Create Shift
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {shifts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CalendarClock className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No shifts defined</p>
                  <p className="text-sm">Create work shifts to manage employee schedules</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map((shift) => (
                    <Card key={shift.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{shift.name}</CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteShift(shift.id, shift.name)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Start Time:</span>
                            <span className="font-semibold">{shift.start_time}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">End Time:</span>
                            <span className="font-semibold">{shift.end_time}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Break:</span>
                            <span className="font-semibold">{shift.break_duration || 0} mins</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HOLIDAYS TAB */}
        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Holiday Calendar</CardTitle>
                  <CardDescription>Manage company holidays and observances</CardDescription>
                </div>
                <Dialog open={createHolidayOpen} onOpenChange={setCreateHolidayOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Add Holiday
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Holiday</DialogTitle>
                      <DialogDescription>
                        Add a new holiday to the calendar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="holiday-name">Holiday Name *</Label>
                        <Input
                          id="holiday-name"
                          value={holidayName}
                          onChange={(e) => setHolidayName(e.target.value)}
                          placeholder="Diwali"
                        />
                      </div>

                      <div>
                        <Label htmlFor="holiday-date">Date *</Label>
                        <Input
                          id="holiday-date"
                          type="date"
                          value={holidayDate}
                          onChange={(e) => setHolidayDate(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="holiday-type">Type</Label>
                        <Select value={holidayType} onValueChange={setHolidayType}>
                          <SelectTrigger id="holiday-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public Holiday</SelectItem>
                            <SelectItem value="optional">Optional Holiday</SelectItem>
                            <SelectItem value="company">Company Holiday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateHolidayOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateHoliday}>
                        Add Holiday
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Award className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No holidays added</p>
                  <p className="text-sm">Add holidays to the company calendar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {holidays.map((holiday) => (
                    <Card key={holiday.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{holiday.name}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(holiday.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {holiday.type || 'public'}
                              </Badge>
                            </div>
                            <Award className="size-5 text-yellow-500" />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                          >
                            <Trash2 className="size-3 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
