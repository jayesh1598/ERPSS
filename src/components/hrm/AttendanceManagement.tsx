import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Download,
  Users,
  TrendingUp,
  AlertCircle
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
  status: string;
}

interface Attendance {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'half-day' | 'leave';
  working_hours?: number;
  overtime_hours?: number;
  remarks?: string;
}

export function AttendanceManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBulkEntry, setShowBulkEntry] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, attendanceData] = await Promise.all([
        api.getEmployees(),
        api.getAttendance(selectedDate),
      ]);
      setEmployees(employeesData.filter((e: Employee) => e.status === 'active') || []);
      setAttendance(attendanceData || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (
    employeeId: string,
    status: 'present' | 'absent' | 'half-day' | 'leave',
    checkIn?: string,
    checkOut?: string
  ) => {
    try {
      const existingRecord = attendance.find(
        (a) => a.employee_id === employeeId && a.date === selectedDate
      );

      const attendanceData = {
        employee_id: employeeId,
        date: selectedDate,
        check_in_time: checkIn || '09:00',
        check_out_time: checkOut || '',
        status,
        working_hours: checkOut ? calculateWorkingHours(checkIn || '09:00', checkOut) : 0,
      };

      if (existingRecord) {
        await api.updateAttendance(existingRecord.id, attendanceData);
        toast.success('Attendance updated');
      } else {
        await api.createAttendance(attendanceData);
        toast.success('Attendance marked');
      }

      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark attendance');
    }
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string): number => {
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    const inMinutes = inHour * 60 + inMin;
    const outMinutes = outHour * 60 + outMin;
    
    return (outMinutes - inMinutes) / 60;
  };

  const markAllPresent = async () => {
    if (!confirm('Mark all active employees as present for this date?')) return;

    try {
      for (const employee of employees) {
        const existingRecord = attendance.find(
          (a) => a.employee_id === employee.id && a.date === selectedDate
        );

        if (!existingRecord) {
          await api.createAttendance({
            employee_id: employee.id,
            date: selectedDate,
            check_in_time: '09:00',
            check_out_time: '18:00',
            status: 'present',
            working_hours: 9,
          });
        }
      }
      toast.success('All employees marked present');
      loadData();
    } catch (error: any) {
      toast.error('Failed to mark attendance for all employees');
    }
  };

  const handleExport = () => {
    try {
      const exportData = attendance.map((att) => {
        const employee = employees.find((e) => e.id === att.employee_id);
        return {
          Date: new Date(att.date).toLocaleDateString(),
          'Employee Code': employee?.employee_code || 'N/A',
          'Employee Name': employee ? `${employee.first_name} ${employee.last_name}` : 'N/A',
          Department: employee?.department || 'N/A',
          'Check In': att.check_in_time,
          'Check Out': att.check_out_time || 'N/A',
          Status: att.status,
          'Working Hours': att.working_hours?.toFixed(2) || '0',
          'Overtime Hours': att.overtime_hours?.toFixed(2) || '0',
          Remarks: att.remarks || '',
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `Attendance_${selectedDate}.xlsx`);
      toast.success('Attendance exported successfully');
    } catch (error: any) {
      toast.error('Failed to export attendance');
    }
  };

  const getAttendanceForEmployee = (employeeId: string): Attendance | undefined => {
    return attendance.find((a) => a.employee_id === employeeId && a.date === selectedDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'half-day': return 'bg-yellow-100 text-yellow-800';
      case 'leave': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate stats
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const halfDayCount = attendance.filter((a) => a.status === 'half-day').length;
  const leaveCount = attendance.filter((a) => a.status === 'leave').length;
  const notMarkedCount = employees.length - attendance.length;

  if (loading) {
    return <div className="text-center py-8">Loading attendance...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Date Selection & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <Label>Attendance Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllPresent}>
            <CheckCircle className="size-4 mr-2" />
            Mark All Present
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="size-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold">{presentCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <XCircle className="size-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold">{absentCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="size-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Half Day</p>
              <p className="text-2xl font-bold">{halfDayCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="size-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">On Leave</p>
              <p className="text-2xl font-bold">{leaveCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Not Marked</p>
              <p className="text-2xl font-bold">{notMarkedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attendance List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="size-5" />
          Employee Attendance - {new Date(selectedDate).toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Employee</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-center">Check In</th>
                <th className="p-3 text-center">Check Out</th>
                <th className="p-3 text-center">Working Hours</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No active employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const empAttendance = getAttendanceForEmployee(employee.id);
                  return (
                    <tr key={employee.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{employee.first_name} {employee.last_name}</div>
                        <div className="text-xs text-gray-500">{employee.employee_code}</div>
                      </td>
                      <td className="p-3">{employee.department}</td>
                      <td className="p-3 text-center">
                        {empAttendance ? (
                          <Input
                            type="time"
                            value={empAttendance.check_in_time}
                            onChange={(e) =>
                              markAttendance(
                                employee.id,
                                empAttendance.status,
                                e.target.value,
                                empAttendance.check_out_time
                              )
                            }
                            className="w-32 mx-auto"
                          />
                        ) : (
                          <span className="text-gray-400">--:--</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {empAttendance ? (
                          <Input
                            type="time"
                            value={empAttendance.check_out_time || ''}
                            onChange={(e) =>
                              markAttendance(
                                employee.id,
                                empAttendance.status,
                                empAttendance.check_in_time,
                                e.target.value
                              )
                            }
                            className="w-32 mx-auto"
                          />
                        ) : (
                          <span className="text-gray-400">--:--</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {empAttendance?.working_hours?.toFixed(2) || '0.00'} hrs
                      </td>
                      <td className="p-3 text-center">
                        {empAttendance ? (
                          <Badge className={getStatusColor(empAttendance.status)}>
                            {empAttendance.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Marked</Badge>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAttendance(employee.id, 'present', '09:00', '18:00')}
                            className="text-green-600 hover:bg-green-50"
                          >
                            P
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAttendance(employee.id, 'absent')}
                            className="text-red-600 hover:bg-red-50"
                          >
                            A
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAttendance(employee.id, 'half-day', '09:00', '14:00')}
                            className="text-yellow-600 hover:bg-yellow-50"
                          >
                            H
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAttendance(employee.id, 'leave')}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            L
                          </Button>
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
