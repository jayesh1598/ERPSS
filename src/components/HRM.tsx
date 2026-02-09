import { useState } from 'react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  Clock, 
  Calendar, 
  Wallet,
  Award,
  FileText,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { EmployeeManagement } from './hrm/EmployeeManagement';
import { AttendanceManagement } from './hrm/AttendanceManagement';
import { LeaveManagement } from './hrm/LeaveManagement';
import { PayrollManagement } from './hrm/PayrollManagement';

export function HRM() {
  const [activeTab, setActiveTab] = useState('employees');

  // Quick stats for HRM dashboard
  const stats = [
    { icon: Users, label: 'Total Employees', value: '0', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: UserPlus, label: 'Active Employees', value: '0', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Clock, label: 'Present Today', value: '0', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Calendar, label: 'On Leave', value: '0', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Human Resource Management</h1>
          <p className="text-gray-600">Manage employees, attendance, leaves, and payroll</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center gap-4">
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <Icon className={`size-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* HRM Modules */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
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
              Leave Management
            </TabsTrigger>
            <TabsTrigger value="payroll">
              <Wallet className="size-4 mr-2" />
              Payroll
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-6">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <AttendanceManagement />
          </TabsContent>

          <TabsContent value="leave" className="mt-6">
            <LeaveManagement />
          </TabsContent>

          <TabsContent value="payroll" className="mt-6">
            <PayrollManagement />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
