import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router';
import { getCurrentUser } from '../lib/api';
import {
  Building2,
  LayoutDashboard,
  Database,
  ShoppingCart,
  FileText,
  Package,
  ClipboardCheck,
  Factory,
  DollarSign,
  Truck,
  FileCheck,
  Receipt,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  WifiOff,
  ListChecks,
  PackageCheck,
  BarChart3,
  Bell,
  Settings,
  Workflow,
  ChevronDown,
  ChevronRight,
  Home,
  Route,
  Rocket,
  PlayCircle,
  Calculator,
} from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/api';
import { toast } from 'sonner@2.0.3';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

export function Root() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'procurement', 'production', 'sales']));

  useEffect(() => {
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event, 'User:', session?.user?.email);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
        console.log('❌ User signed out or session invalid, redirecting to login');
        setUser(null);
        navigate('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('✅ User signed in:', session.user.email);
          setUser(session.user);
        }
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          console.log('✅ User updated:', session.user.email);
          setUser(session.user);
        }
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkUser = async () => {
    try {
      console.log('🔍 Checking current user session...');
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.log('❌ No user found, redirecting to login');
        navigate('/login');
      } else {
        console.log('✅ User authenticated:', currentUser.email);
        setUser(currentUser);
      }
    } catch (error) {
      console.error('❌ Error checking user:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const menuSections = [
    {
      title: '🏠 Dashboard & Overview',
      items: [
        { icon: Home, label: 'Steel Industry Dashboard', path: '/' },
        { icon: Route, label: 'Process Flow Guide', path: '/process-flow' },
        { icon: Rocket, label: '🎯 Production Demo Wizard', path: '/production-demo-wizard', badge: 'NEW' },
        { icon: PlayCircle, label: '📘 Production Demo Playbook', path: '/production-demo-playbook', badge: 'NEW' },
      ],
      defaultOpen: true,
    },
    {
      title: '📦 Procurement Cycle',
      items: [
        { icon: ShoppingCart, label: '1. Purchase Requisitions', path: '/purchase-requisitions' },
        { icon: FileText, label: '2. Quotations (RFQ)', path: '/quotations' },
        { icon: FileCheck, label: '3. Purchase Orders', path: '/purchase-orders' },
        { icon: Receipt, label: '4. GRN & Invoices', path: '/invoices' },
        { icon: ClipboardCheck, label: '5. Incoming QC', path: '/quality-control' },
        { icon: Package, label: '6. Inventory Storage', path: '/inventory' },
      ],
      defaultOpen: true,
    },
    {
      title: '⚙️ Production Cycle',
      items: [
        { icon: Factory, label: '7. Work Orders', path: '/production' },
        { icon: PackageCheck, label: '8. Material Issue', path: '/production' },
        { icon: Factory, label: '9. Production Entry', path: '/production' },
        { icon: ClipboardCheck, label: '10. Production QC', path: '/production' },
        { icon: Package, label: '11. Finished Goods', path: '/finished-goods' },
      ],
      defaultOpen: true,
    },
    {
      title: '💰 Sales & Dispatch',
      items: [
        { icon: DollarSign, label: '12. Sales Orders', path: '/sales-orders' },
        { icon: Truck, label: '13. Delivery Challan', path: '/delivery-challan' },
        { icon: FileCheck, label: '14. E-Way Bills', path: '/eway-bills' },
        { icon: Receipt, label: '15. Sales Invoices', path: '/sales-invoices' },
        { icon: Receipt, label: 'GST Management', path: '/gst' },
      ],
      defaultOpen: true,
    },
    {
      title: '⚙️ Administration',
      items: [
        { icon: BarChart3, label: 'Reports & Analytics', path: '/reports' },
        { icon: Calculator, label: 'Accounting', path: '/accounting' }, // NEW: Accounting Module
        { icon: Users, label: 'HRM', path: '/hrm' },
        { icon: Shield, label: 'User & Roles', path: '/user-role-management' },
        { icon: Settings, label: 'Approval Rules', path: '/approval-rules' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: Shield, label: 'Audit Logs', path: '/audit-logs' },
        { icon: WifiOff, label: 'Offline Mode', path: '/offline-mode' },
      ],
      defaultOpen: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-6 text-blue-600" />
            <span className="font-semibold">ERP System</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-2 px-6 py-4 border-b">
            <Building2 className="size-8 text-blue-600" />
            <div>
              <h1 className="font-bold text-lg">Enterprise ERP</h1>
              <p className="text-xs text-gray-500">Manufacturing System</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 mt-14 lg:mt-0">
            {menuSections.map((section) => (
              <div key={section.title}>
                <div
                  className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={() => {
                    const newExpandedSections = new Set(expandedSections);
                    if (newExpandedSections.has(section.title)) {
                      newExpandedSections.delete(section.title);
                    } else {
                      newExpandedSections.add(section.title);
                    }
                    setExpandedSections(newExpandedSections);
                  }}
                >
                  <Workflow className="size-5" />
                  <span className="text-sm font-medium">{section.title}</span>
                  <ChevronDown
                    className={`size-4 ml-auto transition-transform ${
                      expandedSections.has(section.title) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {expandedSections.has(section.title) && (
                  <div className="pl-6">
                    {section.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <item.icon className="size-5" />
                        <span className="text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">
                  {user?.user_metadata?.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 text-purple-600 font-semibold">
                      <Shield className="size-3" />
                      Administrator
                    </span>
                  ) : (
                    'User'
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="size-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}