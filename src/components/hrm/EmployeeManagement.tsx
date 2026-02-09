import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Download,
  Upload,
  X,
  Check,
  UserCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../../lib/api';
import * as XLSX from 'xlsx';

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  address: string;
  city: string;
  state: string;
  pincode: string;
  department: string;
  designation: string;
  date_of_joining: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern';
  status: 'active' | 'inactive' | 'resigned' | 'terminated';
  salary: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;
  aadhar_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: string;
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<Partial<Employee>>({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    address: '',
    city: '',
    state: '',
    pincode: '',
    department: '',
    designation: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    employment_type: 'full-time',
    status: 'active',
    salary: 0,
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    pan_number: '',
    aadhar_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await api.getEmployees();
      setEmployees(data || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, formData);
        toast.success('Employee updated successfully');
      } else {
        await api.createEmployee(formData);
        toast.success('Employee created successfully');
      }

      handleCancel();
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save employee');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData(employee);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      await api.deleteEmployee(id);
      toast.success('Employee deleted successfully');
      loadEmployees();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete employee');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEmployee(null);
    setFormData({
      employee_code: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      city: '',
      state: '',
      pincode: '',
      department: '',
      designation: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      employment_type: 'full-time',
      status: 'active',
      salary: 0,
    });
  };

  const handleExport = () => {
    try {
      const exportData = employees.map(emp => ({
        'Employee Code': emp.employee_code,
        'Name': `${emp.first_name} ${emp.last_name}`,
        'Email': emp.email,
        'Phone': emp.phone,
        'Department': emp.department,
        'Designation': emp.designation,
        'Date of Joining': new Date(emp.date_of_joining).toLocaleDateString(),
        'Employment Type': emp.employment_type,
        'Status': emp.status,
        'Salary': emp.salary,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');
      XLSX.writeFile(wb, `Employees_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Employee data exported successfully');
    } catch (error: any) {
      toast.error('Failed to export data');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'resigned': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading employees...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employee Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingEmployee ? 'Edit Employee' : 'New Employee'}
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <UserCircle className="size-5" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Employee Code *</Label>
                  <Input
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    placeholder="EMP001"
                    required
                  />
                </div>
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="size-5" />
                Employment Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Department *</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Production, Accounts, etc."
                    required
                  />
                </div>
                <div>
                  <Label>Designation *</Label>
                  <Input
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Manager, Engineer, etc."
                    required
                  />
                </div>
                <div>
                  <Label>Date of Joining *</Label>
                  <Input
                    type="date"
                    value={formData.date_of_joining}
                    onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })}
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="resigned">Resigned</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div>
                  <Label>Monthly Salary (₹)</Label>
                  <Input
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Bank & Documents */}
            <div>
              <h4 className="font-semibold mb-3">Bank & Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input
                    value={formData.bank_ifsc}
                    onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                  />
                </div>
                <div>
                  <Label>PAN Number</Label>
                  <Input
                    value={formData.pan_number}
                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <Label>Aadhar Number</Label>
                  <Input
                    value={formData.aadhar_number}
                    onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                    placeholder="1234 5678 9012"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="font-semibold mb-3">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">
                <Check className="size-4 mr-2" />
                {editingEmployee ? 'Update' : 'Create'} Employee
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="size-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Employee List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEmployees.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="size-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No employees found</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="size-4 mr-2" />
              Add First Employee
            </Button>
          </Card>
        ) : (
          filteredEmployees.map((employee) => (
            <Card key={employee.id} className="p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <UserCircle className="size-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-4" />
                        {employee.employee_code}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="size-4" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-4" />
                        {employee.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        Joined: {new Date(employee.date_of_joining).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="size-4" />
                        {employee.department}
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="size-4" />
                        {employee.designation}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{employee.employment_type}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(employee)}>
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(employee.id)}>
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
