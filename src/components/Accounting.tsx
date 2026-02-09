import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Calculator, BookOpen, Receipt, FileText, TrendingUp, FileBarChart, Building2, AlertCircle, LogIn } from 'lucide-react';
import { ChartOfAccounts } from './accounting/ChartOfAccounts';
import { VoucherEntry } from './accounting/VoucherEntry';
import { BooksOfAccounts } from './accounting/BooksOfAccounts';
import { FinancialReports } from './accounting/FinancialReports';
import { GSTReports } from './accounting/GSTReports';
import { OutstandingReports } from './accounting/OutstandingReports';
import { BankReconciliation } from './accounting/BankReconciliation';
import { getCurrentUser } from '../lib/api';
import { useNavigate } from 'react-router';

export function Accounting() {
  const [activeTab, setActiveTab] = useState('chart-of-accounts');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
      if (!user) {
        console.warn('⚠️ No authenticated user - please log in');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    }
  };

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounting module...</p>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="size-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to access the Accounting Module. Please log in to continue.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            <LogIn className="size-4 mr-2" />
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Accounting Module
          </h1>
          <p className="text-gray-600 mt-1">Complete accounting system with vouchers, books, and reports</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-7 gap-4">
          <TabsTrigger value="chart-of-accounts" className="flex items-center gap-2">
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Chart of Accounts</span>
            <span className="sm:hidden">CoA</span>
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <Receipt className="size-4" />
            <span className="hidden sm:inline">Vouchers</span>
            <span className="sm:hidden">Vouchers</span>
          </TabsTrigger>
          <TabsTrigger value="books" className="flex items-center gap-2">
            <BookOpen className="size-4" />
            <span className="hidden sm:inline">Books</span>
            <span className="sm:hidden">Books</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="size-4" />
            <span className="hidden sm:inline">Reports</span>
            <span className="sm:hidden">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="gst" className="flex items-center gap-2">
            <FileBarChart className="size-4" />
            <span className="hidden sm:inline">GST Reports</span>
            <span className="sm:hidden">GST</span>
          </TabsTrigger>
          <TabsTrigger value="outstanding" className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            <span className="hidden sm:inline">Outstanding</span>
            <span className="sm:hidden">Outstanding</span>
          </TabsTrigger>
          <TabsTrigger value="bank-recon" className="flex items-center gap-2">
            <Building2 className="size-4" />
            <span className="hidden sm:inline">Bank Recon</span>
            <span className="sm:hidden">Bank</span>
          </TabsTrigger>
        </TabsList>

        {/* Chart of Accounts */}
        <TabsContent value="chart-of-accounts" className="space-y-4">
          <ChartOfAccounts />
        </TabsContent>

        {/* Vouchers */}
        <TabsContent value="vouchers" className="space-y-4">
          <VoucherEntry />
        </TabsContent>

        {/* Books of Accounts */}
        <TabsContent value="books" className="space-y-4">
          <BooksOfAccounts />
        </TabsContent>

        {/* Financial Reports */}
        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>

        {/* GST Reports */}
        <TabsContent value="gst" className="space-y-4">
          <GSTReports />
        </TabsContent>

        {/* Outstanding Reports */}
        <TabsContent value="outstanding" className="space-y-4">
          <OutstandingReports />
        </TabsContent>

        {/* Bank Reconciliation */}
        <TabsContent value="bank-recon" className="space-y-4">
          <BankReconciliation />
        </TabsContent>
      </Tabs>
    </div>
  );
}