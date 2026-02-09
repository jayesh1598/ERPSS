import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock,
  AlertCircle,
  Download,
  FileText
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
}

interface Leave {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: 'casual' | 'sick' | 'earned' | 'maternity' | 'paternity' | 'unpaid';
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  applied_date: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
}

interface LeaveBalance {
  employee_id: string;
  casual_leave: number;
  sick_leave: number;
  earned_leave: number;
  total_leave_taken: number;
}

export function LeaveManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'casual' as Leave['leave_type'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, leavesData, user] = await Promise.all([
        api.getEmployees(),
        api.getLeaves(),
        api.getCurrentUser(),
      ]);
      setEmployees(employeesData.filter((e: Employee) => e.status === 'active') || []);
      setLeaves(leavesData || []);
      setCurrentUser(user);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.employee_id || !formData.reason) {
        toast.error('Please fill in all required fields');
        return;
      }

      const days = calculateDays(formData.start_date, formData.end_date);

      const leaveData = {
        ...formData,
        days,
        status: 'pending' as const,
        applied_date: new Date().toISOString().split('T')[0],
      };

      await api.createLeave(leaveData);
      toast.success('Leave application submitted successfully');
      
      setShowForm(false);
      setFormData({
        employee_id: '',
        leave_type: 'casual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit leave application');
    }
  };

  const handleApprove = async (leaveId: string) => {
    try {
      await api.updateLeave(leaveId, {
        status: 'approved',
        approved_by: currentUser?.email || 'Admin',
        approved_date: new Date().toISOString().split('T')[0],
      });
      toast.success('Leave approved successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (leaveId: string, reason: string) => {
    try {
      await api.updateLeave(leaveId, {
        status: 'rejected',
        approved_by: currentUser?.email || 'Admin',
        approved_date: new Date().toISOString().split('T')[0],
        rejection_reason: reason || 'Not specified',
      });
      toast.success('Leave rejected');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject leave');
    }
  };

  const handleExport = () => {
    try {
      const exportData = leaves.map((leave) => {
        const employee = employees.find((e) => e.id === leave.employee_id);
        return {
          'Employee Code': employee?.employee_code || 'N/A',
          'Employee Name': employee ? `${employee.first_name} ${employee.last_name}` : 'N/A',
          Department: employee?.department || 'N/A',
          'Leave Type': leave.leave_type,
          'Start Date': new Date(leave.start_date).toLocaleDateString(),
          'End Date': new Date(leave.end_date).toLocaleDateString(),
          Days: leave.days,
          Reason: leave.reason,
          Status: leave.status,
          'Applied Date': new Date(leave.applied_date).toLocaleDateString(),
          'Approved By': leave.approved_by || 'N/A',
          'Approved Date': leave.approved_date ? new Date(leave.approved_date).toLocaleDateString() : 'N/A',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leaves');
      XLSX.writeFile(wb, `Leave_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Leave records exported successfully');
    } catch (error: any) {
      toast.error('Failed to export leave records');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'earned': return 'bg-green-100 text-green-800';
      case 'maternity': return 'bg-pink-100 text-pink-800';
      case 'paternity': return 'bg-purple-100 text-purple-800';
      case 'unpaid': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const pendingLeaves = leaves.filter((l) => l.status === 'pending').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'approved').length;
  const rejectedLeaves = leaves.filter((l) => l.status === 'rejected').length;

  if (loading) {
    return <div className="text-center py-8">Loading leave management...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Leave Applications</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-2" />
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="size-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold">{pendingLeaves}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Check className="size-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold">{approvedLeaves}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <X className="size-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold">{rejectedLeaves}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leave Application Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">New Leave Application</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Employee *</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} - {emp.employee_code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Leave Type *</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value as any })}
                  required
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  min={formData.start_date}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Number of Days</Label>
                <div className="p-2 bg-white border rounded font-semibold">
                  {calculateDays(formData.start_date, formData.end_date)} day(s)
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Reason *</Label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter reason for leave..."
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <Check className="size-4 mr-2" />
                Submit Application
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                <X className="size-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Leave List */}
      <Card className="p-6">
        <div className="space-y-4">
          {leaves.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="size-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No leave applications found</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="size-4 mr-2" />
                Apply for Leave
              </Button>
            </div>
          ) : (
            leaves.map((leave) => {
              const employee = employees.find((e) => e.id === leave.employee_id);
              return (
                <Card key={leave.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee'}
                        </h4>
                        <Badge className={getLeaveTypeColor(leave.leave_type)}>
                          {leave.leave_type}
                        </Badge>
                        <Badge className={getStatusColor(leave.status)}>
                          {leave.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">Employee Code:</span> {employee?.employee_code || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Department:</span> {employee?.department || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Days:</span> {leave.days}
                        </div>
                      </div>

                      <div className="text-sm mb-2">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </div>

                      <div className="text-xs text-gray-500">
                        Applied on: {new Date(leave.applied_date).toLocaleDateString()}
                        {leave.approved_date && ` • ${leave.status === 'approved' ? 'Approved' : 'Rejected'} on ${new Date(leave.approved_date).toLocaleDateString()} by ${leave.approved_by}`}
                      </div>

                      {leave.rejection_reason && (
                        <div className="mt-2 text-sm text-red-600">
                          <AlertCircle className="size-4 inline mr-1" />
                          Rejection Reason: {leave.rejection_reason}
                        </div>
                      )}
                    </div>

                    {leave.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(leave.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="size-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Enter rejection reason:');
                            if (reason !== null) {
                              handleReject(leave.id, reason);
                            }
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X className="size-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
