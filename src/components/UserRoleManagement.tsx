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
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle,
  Lock,
  UserPlus,
  Settings,
  Key,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Checkbox } from './ui/checkbox';

// Available permissions in the system
const SYSTEM_PERMISSIONS = [
  // Master Data
  { id: 'master_data_view', name: 'View Master Data', module: 'Master Data' },
  { id: 'master_data_create', name: 'Create Master Data', module: 'Master Data' },
  { id: 'master_data_edit', name: 'Edit Master Data', module: 'Master Data' },
  { id: 'master_data_delete', name: 'Delete Master Data', module: 'Master Data' },
  
  // Purchase
  { id: 'purchase_req_view', name: 'View Purchase Requisitions', module: 'Purchase' },
  { id: 'purchase_req_create', name: 'Create Purchase Requisitions', module: 'Purchase' },
  { id: 'purchase_req_approve', name: 'Approve Purchase Requisitions', module: 'Purchase' },
  { id: 'purchase_req_reject', name: 'Reject Purchase Requisitions', module: 'Purchase' },
  { id: 'quotation_view', name: 'View Quotations', module: 'Purchase' },
  { id: 'quotation_upload', name: 'Upload Quotations', module: 'Purchase' },
  { id: 'quotation_approve', name: 'Approve Quotations', module: 'Purchase' },
  { id: 'po_view', name: 'View Purchase Orders', module: 'Purchase' },
  { id: 'po_create', name: 'Create Purchase Orders', module: 'Purchase' },
  { id: 'po_approve', name: 'Approve Purchase Orders', module: 'Purchase' },
  
  // Inventory
  { id: 'inventory_view', name: 'View Inventory', module: 'Inventory' },
  { id: 'inventory_adjust', name: 'Adjust Inventory', module: 'Inventory' },
  { id: 'inventory_transfer', name: 'Transfer Inventory', module: 'Inventory' },
  { id: 'grn_create', name: 'Create GRN', module: 'Inventory' },
  { id: 'grn_approve', name: 'Approve GRN', module: 'Inventory' },
  
  // Invoice
  { id: 'invoice_view', name: 'View Invoices', module: 'Invoice' },
  { id: 'invoice_create', name: 'Create Invoices', module: 'Invoice' },
  { id: 'invoice_approve', name: 'Approve Invoices', module: 'Invoice' },
  { id: 'invoice_admin_override', name: 'Admin Override Invoices', module: 'Invoice' },
  
  // Quality Control
  { id: 'qc_view', name: 'View QC Inspections', module: 'Quality Control' },
  { id: 'qc_create', name: 'Create QC Inspections', module: 'Quality Control' },
  { id: 'qc_complete', name: 'Complete QC Inspections', module: 'Quality Control' },
  { id: 'qc_admin_override', name: 'Admin Override QC', module: 'Quality Control' },
  { id: 'qc_template_manage', name: 'Manage QC Templates', module: 'Quality Control' },
  
  // Production
  { id: 'bom_view', name: 'View BOM', module: 'Production' },
  { id: 'bom_create', name: 'Create BOM', module: 'Production' },
  { id: 'work_order_view', name: 'View Work Orders', module: 'Production' },
  { id: 'work_order_create', name: 'Create Work Orders', module: 'Production' },
  { id: 'work_order_execute', name: 'Execute Work Orders', module: 'Production' },
  
  // Sales
  { id: 'sales_view', name: 'View Sales', module: 'Sales' },
  { id: 'sales_quotation_create', name: 'Create Sales Quotations', module: 'Sales' },
  { id: 'sales_order_create', name: 'Create Sales Orders', module: 'Sales' },
  { id: 'sales_order_confirm', name: 'Confirm Sales Orders', module: 'Sales' },
  
  // Delivery & E-Way
  { id: 'delivery_challan_view', name: 'View Delivery Challans', module: 'Delivery' },
  { id: 'delivery_challan_create', name: 'Create Delivery Challans', module: 'Delivery' },
  { id: 'delivery_challan_approve', name: 'Approve Delivery Challans', module: 'Delivery' },
  { id: 'eway_bill_view', name: 'View E-Way Bills', module: 'E-Way Bills' },
  { id: 'eway_bill_generate', name: 'Generate E-Way Bills', module: 'E-Way Bills' },
  { id: 'eway_bill_cancel', name: 'Cancel E-Way Bills', module: 'E-Way Bills' },
  
  // GST
  { id: 'gst_view', name: 'View GST Transactions', module: 'GST' },
  { id: 'gst_payment', name: 'Initiate GST Payments', module: 'GST' },
  
  // HRM
  { id: 'hrm_view', name: 'View HRM', module: 'HRM' },
  { id: 'hrm_employee_manage', name: 'Manage Employees', module: 'HRM' },
  { id: 'hrm_attendance_manage', name: 'Manage Attendance', module: 'HRM' },
  { id: 'hrm_leave_approve', name: 'Approve Leave Applications', module: 'HRM' },
  
  // Audit & Reports
  { id: 'audit_logs_view', name: 'View Audit Logs', module: 'Audit' },
  { id: 'reports_view', name: 'View Reports', module: 'Reports' },
  { id: 'reports_export', name: 'Export Reports', module: 'Reports' },
  
  // System Administration
  { id: 'user_management', name: 'Manage Users', module: 'Administration' },
  { id: 'role_management', name: 'Manage Roles', module: 'Administration' },
  { id: 'system_settings', name: 'System Settings', module: 'Administration' },
];

export function UserRoleManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // User form state
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmployeeCode, setUserEmployeeCode] = useState('');

  // User role assignment state
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignWarehouseId, setAssignWarehouseId] = useState('');
  const [assignDepartmentId, setAssignDepartmentId] = useState('');

  // Role form state
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // View role permissions state
  const [viewRolePermissionsOpen, setViewRolePermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResult, rolesResult, warehousesResult, departmentsResult] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getWarehouses(),
        api.getDepartments()
      ]);

      setUsers(usersResult.users || []);
      setRoles(rolesResult.roles || []);
      setWarehouses(warehousesResult.warehouses || []);
      setDepartments(departmentsResult.departments || []);
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!userEmail || !userName || !userPassword) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await api.signup(userEmail, userPassword, userName, userPhone, userEmployeeCode);
      toast.success('User created successfully!');
      setCreateUserOpen(false);
      resetUserForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create user: ${error.message}`);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !assignRoleId) {
      toast.error('Please select a role');
      return;
    }

    try {
      await api.assignRole(
        selectedUser.id,
        assignRoleId,
        assignWarehouseId || undefined,
        assignDepartmentId || undefined
      );
      toast.success('Role assigned successfully!');
      setAssignRoleOpen(false);
      resetRoleAssignmentForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to assign role: ${error.message}`);
    }
  };

  const handleCreateRole = async () => {
    if (!roleName || selectedPermissions.length === 0) {
      toast.error('Please provide role name and select at least one permission');
      return;
    }

    try {
      const permissions = selectedPermissions.map(permId => {
        const perm = SYSTEM_PERMISSIONS.find(p => p.id === permId);
        return {
          permission_id: permId,
          permission_name: perm?.name || permId,
          module: perm?.module || 'System'
        };
      });

      await api.createRole(roleName, roleDescription, permissions);
      toast.success('Role created successfully!');
      setCreateRoleOpen(false);
      resetRoleForm();
      loadData();
    } catch (error: any) {
      toast.error(`Failed to create role: ${error.message}`);
    }
  };

  const handleViewRolePermissions = async (role: any) => {
    setSelectedRole(role);
    setViewRolePermissionsOpen(true);
    
    try {
      const result = await api.getRolePermissions(role.id);
      setRolePermissions(result.permissions || []);
    } catch (error: any) {
      toast.error(`Failed to load role permissions: ${error.message}`);
      setRolePermissions([]);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const selectAllPermissionsInModule = (module: string) => {
    const modulePerms = SYSTEM_PERMISSIONS.filter(p => p.module === module).map(p => p.id);
    const allSelected = modulePerms.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Deselect all in module
      setSelectedPermissions(prev => prev.filter(id => !modulePerms.includes(id)));
    } else {
      // Select all in module
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        modulePerms.forEach(id => {
          if (!newPerms.includes(id)) {
            newPerms.push(id);
          }
        });
        return newPerms;
      });
    }
  };

  const resetUserForm = () => {
    setUserEmail('');
    setUserName('');
    setUserPassword('');
    setUserPhone('');
    setUserEmployeeCode('');
  };

  const resetRoleForm = () => {
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
  };

  const resetRoleAssignmentForm = () => {
    setSelectedUser(null);
    setAssignRoleId('');
    setAssignWarehouseId('');
    setAssignDepartmentId('');
  };

  // Group permissions by module
  const permissionsByModule = SYSTEM_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, typeof SYSTEM_PERMISSIONS>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="size-8 text-blue-600" />
            User & Role Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage users, roles, and permissions with granular access control
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">
            <Users className="size-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="size-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Key className="size-4 mr-2" />
            Permissions Matrix
          </TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Users</CardTitle>
                  <CardDescription>Create and manage user accounts</CardDescription>
                </div>
                <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="size-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account in the system
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="user-name">Full Name *</Label>
                        <Input
                          id="user-name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>

                      <div>
                        <Label htmlFor="user-email">Email *</Label>
                        <Input
                          id="user-email"
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="john.doe@company.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="user-password">Password *</Label>
                        <Input
                          id="user-password"
                          type="password"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="Secure password"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="user-phone">Phone Number</Label>
                          <Input
                            id="user-phone"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            placeholder="+91 1234567890"
                          />
                        </div>

                        <div>
                          <Label htmlFor="user-employee-code">Employee Code</Label>
                          <Input
                            id="user-employee-code"
                            value={userEmployeeCode}
                            onChange={(e) => setUserEmployeeCode(e.target.value)}
                            placeholder="EMP001"
                          />
                        </div>
                      </div>

                      <Alert className="bg-blue-50 border-blue-200">
                        <Lock className="size-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Next Step</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          After creating the user, assign roles to grant permissions
                        </AlertDescription>
                      </Alert>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateUserOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser}>
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No users found</p>
                  <p className="text-sm">Create your first user account</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Employee Code</TableHead>
                      <TableHead>Assigned Roles</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{user.employee_code || '-'}</TableCell>
                        <TableCell>
                          {user.role_assignments && user.role_assignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.role_assignments.map((assignment: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {assignment.role_name}
                                  {assignment.warehouse_id && ' (W)'}
                                  {assignment.department_id && ' (D)'}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No roles assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setAssignRoleOpen(true);
                              }}
                            >
                              <Shield className="size-3 mr-1" />
                              {user.role_assignments && user.role_assignments.length > 0 ? 'Change Role' : 'Assign Role'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Assign Role Dialog */}
          <Dialog open={assignRoleOpen} onOpenChange={setAssignRoleOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedUser?.role_assignments && selectedUser.role_assignments.length > 0 
                    ? `Change Roles for User: ${selectedUser?.name}` 
                    : `Assign Role to User: ${selectedUser?.name}`}
                </DialogTitle>
                <DialogDescription>
                  {selectedUser?.role_assignments && selectedUser.role_assignments.length > 0
                    ? 'Current roles are shown below. Add a new role or remove existing ones.'
                    : 'Select a role and optionally assign warehouse and department restrictions'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Current Roles Section */}
                {selectedUser?.role_assignments && selectedUser.role_assignments.length > 0 && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="text-base font-semibold mb-3 block">Current Assigned Roles</Label>
                    <div className="space-y-2">
                      {selectedUser.role_assignments.map((assignment: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded border">
                          <div>
                            <p className="font-medium">{assignment.role_name}</p>
                            <div className="flex gap-2 mt-1 text-xs text-gray-500">
                              {assignment.warehouse_id && <Badge variant="outline" className="text-xs">Warehouse Restricted</Badge>}
                              {assignment.department_id && <Badge variant="outline" className="text-xs">Department Restricted</Badge>}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              try {
                                // Remove role assignment - we'll need a delete endpoint
                                toast.info('Role removal feature coming soon');
                              } catch (error: any) {
                                toast.error(`Failed to remove role: ${error.message}`);
                              }
                            }}
                          >
                            <Trash2 className="size-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Role Section */}
                <div className="border rounded-lg p-4">
                  <Label className="text-base font-semibold mb-3 block">
                    {selectedUser?.role_assignments && selectedUser.role_assignments.length > 0 
                      ? 'Add Another Role' 
                      : 'Assign New Role'}
                  </Label>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="assign-role">Role *</Label>
                      <Select
                        id="assign-role"
                        value={assignRoleId}
                        onValueChange={(value) => setAssignRoleId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assign-warehouse">Warehouse (Optional)</Label>
                      <Select
                        id="assign-warehouse"
                        value={assignWarehouseId}
                        onValueChange={(value) => setAssignWarehouseId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All warehouses" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assign-department">Department (Optional)</Label>
                      <Select
                        id="assign-department"
                        value={assignDepartmentId}
                        onValueChange={(value) => setAssignDepartmentId(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All departments" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignRoleOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignRole}>
                  Assign Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>Define roles with custom permission sets</CardDescription>
                </div>
                <Dialog open={createRoleOpen} onOpenChange={setCreateRoleOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="size-4 mr-2" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>
                        Define a role and select permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="role-name">Role Name *</Label>
                          <Input
                            id="role-name"
                            value={roleName}
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="e.g., Warehouse Manager"
                          />
                        </div>

                        <div>
                          <Label htmlFor="role-description">Description</Label>
                          <Input
                            id="role-description"
                            value={roleDescription}
                            onChange={(e) => setRoleDescription(e.target.value)}
                            placeholder="Brief description of the role"
                          />
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-base font-semibold">
                            Permissions ({selectedPermissions.length} selected)
                          </Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPermissions(SYSTEM_PERMISSIONS.map(p => p.id))}
                          >
                            Select All
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {Object.entries(permissionsByModule).map(([module, perms]) => {
                            const allSelected = perms.every(p => selectedPermissions.includes(p.id));
                            const someSelected = perms.some(p => selectedPermissions.includes(p.id));
                            
                            return (
                              <div key={module} className="border rounded p-3 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={allSelected}
                                      onCheckedChange={() => selectAllPermissionsInModule(module)}
                                    />
                                    <Label className="font-semibold text-sm cursor-pointer">
                                      {module} ({perms.filter(p => selectedPermissions.includes(p.id)).length}/{perms.length})
                                    </Label>
                                  </div>
                                  {someSelected && !allSelected && (
                                    <Badge variant="outline" className="text-xs">Partial</Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 ml-6">
                                  {perms.map((perm) => (
                                    <div key={perm.id} className="flex items-center gap-2">
                                      <Checkbox
                                        id={perm.id}
                                        checked={selectedPermissions.includes(perm.id)}
                                        onCheckedChange={() => togglePermission(perm.id)}
                                      />
                                      <Label
                                        htmlFor={perm.id}
                                        className="text-sm cursor-pointer"
                                      >
                                        {perm.name}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateRoleOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRole}>
                        Create Role
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="size-12 mx-auto mb-4 opacity-20" />
                  <p>No roles found</p>
                  <p className="text-sm">Create your first role with custom permissions</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {role.permissions?.length || 0} permissions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(role.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewRolePermissions(role)}
                            >
                              <Eye className="size-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* View Role Permissions Dialog */}
          <Dialog open={viewRolePermissionsOpen} onOpenChange={setViewRolePermissionsOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Role Permissions: {selectedRole?.name}</DialogTitle>
                <DialogDescription>
                  {selectedRole?.description || 'View all permissions assigned to this role'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {rolePermissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Key className="size-12 mx-auto mb-4 opacity-20" />
                    <p>No permissions assigned to this role</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(
                      rolePermissions.reduce((acc, perm) => {
                        const module = perm.module || 'Other';
                        if (!acc[module]) acc[module] = [];
                        acc[module].push(perm);
                        return acc;
                      }, {} as Record<string, any[]>)
                    ).map(([module, perms]) => (
                      <div key={module} className="border rounded p-3 bg-gray-50">
                        <Label className="font-semibold text-sm mb-2 block">
                          {module} ({perms.length})
                        </Label>
                        <div className="grid grid-cols-2 gap-2 ml-4">
                          {perms.map((perm) => (
                            <div key={perm.permission_id} className="flex items-center gap-2">
                              <CheckCircle className="size-4 text-green-600" />
                              <span className="text-sm">{perm.permission_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setViewRolePermissionsOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* PERMISSIONS MATRIX TAB */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Matrix</CardTitle>
              <CardDescription>
                View all available permissions organized by module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="size-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{module}</h3>
                      <Badge variant="outline">{perms.length} permissions</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-start gap-2 p-2 bg-gray-50 rounded border"
                        >
                          <Key className="size-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{perm.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{perm.id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Alert className="mt-6 bg-blue-50 border-blue-200">
                <Key className="size-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Permission System</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Total of {SYSTEM_PERMISSIONS.length} permissions across {Object.keys(permissionsByModule).length} modules.
                  Permissions can be combined into roles and assigned to users with warehouse/department restrictions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}