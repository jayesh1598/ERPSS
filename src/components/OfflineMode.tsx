import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface OfflineTransaction {
  id: string;
  transaction_data: string;
  transaction_type: string;
  device_id: string;
  created_at: string;
  synced: boolean;
  synced_at?: string;
  conflict: boolean;
  conflict_resolution?: string;
}

export function OfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineTransactions, setOfflineTransactions] = useState<OfflineTransaction[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    synced: 0,
    conflicts: 0,
  });

  useEffect(() => {
    loadOfflineTransactions();
    setupOnlineStatusListeners();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setupOnlineStatusListeners = () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  };

  const handleOnline = () => {
    setIsOnline(true);
    toast.success('Internet connection restored');
    // Auto-sync when coming back online
    syncOfflineTransactions();
  };

  const handleOffline = () => {
    setIsOnline(false);
    toast.warning('You are now offline. Changes will be queued for sync.');
  };

  const loadOfflineTransactions = async () => {
    setLoading(true);
    try {
      const result = await api.getOfflineTransactions();
      const transactions = result.transactions || [];
      setOfflineTransactions(transactions);
      
      // Calculate stats
      const stats = {
        total: transactions.length,
        pending: transactions.filter((t: OfflineTransaction) => !t.synced).length,
        synced: transactions.filter((t: OfflineTransaction) => t.synced).length,
        conflicts: transactions.filter((t: OfflineTransaction) => t.conflict).length,
      };
      setStats(stats);
    } catch (error: any) {
      console.error('Load offline transactions error:', error);
      // Only show error if not an auth issue
      if (!error.message?.includes('Unauthorized')) {
        toast.error(`Failed to load offline data: ${error.message}`);
      }
      // Set empty stats to prevent UI errors
      setStats({ total: 0, pending: 0, synced: 0, conflicts: 0 });
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineTransactions = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }

    setSyncStatus('syncing');
    toast.info('Synchronizing offline transactions...');

    try {
      const result = await api.syncOfflineTransactions();
      
      if (result.success) {
        setSyncStatus('success');
        toast.success(`Sync complete! ${result.synced_count} transactions synchronized`);
        
        if (result.conflicts > 0) {
          toast.warning(`${result.conflicts} conflicts detected. Please review and resolve.`);
        }
        
        // Reload transactions
        await loadOfflineTransactions();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      toast.error(`Sync failed: ${error.message}`);
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const resolveConflict = async (transactionId: string, resolution: 'keep_local' | 'keep_server' | 'merge') => {
    try {
      await api.resolveOfflineConflict(transactionId, resolution);
      toast.success('Conflict resolved successfully');
      await loadOfflineTransactions();
    } catch (error: any) {
      console.error('Resolve conflict error:', error);
      toast.error(`Failed to resolve conflict: ${error.message}`);
    }
  };

  const clearSyncedTransactions = async () => {
    if (!confirm('This will clear all synced offline transactions. Continue?')) {
      return;
    }

    try {
      await api.clearSyncedOfflineTransactions();
      toast.success('Synced transactions cleared');
      await loadOfflineTransactions();
    } catch (error: any) {
      console.error('Clear error:', error);
      toast.error(`Failed to clear transactions: ${error.message}`);
    }
  };

  const createTestOfflineTransaction = async () => {
    try {
      const testData = {
        transaction_type: 'test_transaction',
        transaction_data: JSON.stringify({
          type: 'sample',
          timestamp: new Date().toISOString(),
          data: {
            description: 'Test offline transaction',
            value: Math.floor(Math.random() * 10000),
          },
        }),
        device_id: 'test-device-' + Math.random().toString(36).substring(7),
      };

      await api.createOfflineTransaction(testData);
      toast.success('Test transaction created');
      await loadOfflineTransactions();
    } catch (error: any) {
      console.error('Create test transaction error:', error);
      toast.error(`Failed to create test transaction: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading offline data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offline Mode & Sync</h1>
          <p className="text-gray-500 mt-1">
            Manage offline transactions and synchronization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isOnline ? 'default' : 'destructive'} className="px-3 py-1.5">
            {isOnline ? (
              <>
                <Wifi className="size-4 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="size-4 mr-1" />
                Offline
              </>
            )}
          </Badge>
          <Button
            onClick={syncOfflineTransactions}
            disabled={!isOnline || syncStatus === 'syncing' || stats.pending === 0}
            className="bg-blue-600 text-white"
          >
            <RefreshCw className={`size-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Syncing...' : `Sync Now (${stats.pending})`}
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {!isOnline && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="size-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Offline Mode Active:</strong> You are currently offline. Any changes you make will be queued and synchronized when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {stats.conflicts > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <XCircle className="size-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Conflicts Detected:</strong> {stats.conflicts} transaction(s) have sync conflicts that require manual resolution.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="size-5 text-blue-600" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-yellow-600" />
              <span className="text-3xl font-bold">{stats.pending}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Synced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-3xl font-bold">{stats.synced}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              <span className="text-3xl font-bold">{stats.conflicts}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Offline Transaction Queue
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={createTestOfflineTransaction}
              >
                Create Test Transaction
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSyncedTransactions}
                disabled={stats.synced === 0}
              >
                Clear Synced
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Synced At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offlineTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell>
                    {txn.conflict ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <XCircle className="size-3" />
                        Conflict
                      </Badge>
                    ) : txn.synced ? (
                      <Badge variant="default" className="flex items-center gap-1 w-fit bg-green-600">
                        <CheckCircle className="size-3" />
                        Synced
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Clock className="size-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{txn.transaction_type}</TableCell>
                  <TableCell className="text-sm text-gray-600">{txn.device_id}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(txn.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {txn.synced_at ? new Date(txn.synced_at).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    {txn.conflict && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveConflict(txn.id, 'keep_local')}
                        >
                          Keep Local
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveConflict(txn.id, 'keep_server')}
                        >
                          Keep Server
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {offlineTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No offline transactions found. Changes made while offline will appear here.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Offline Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">How It Works</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>When offline, all data modifications are stored locally</li>
              <li>Transactions are automatically synced when connection is restored</li>
              <li>Conflicts are detected and can be manually resolved</li>
              <li>Each device has a unique ID to track transaction sources</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Conflict Resolution</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><strong>Keep Local:</strong> Use the version from this device</li>
              <li><strong>Keep Server:</strong> Use the version from the server</li>
              <li><strong>Merge:</strong> Combine both versions (manual review required)</li>
            </ul>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Pro Tip:</strong> Enable offline mode for field operations where internet connectivity may be unreliable. All critical operations can continue seamlessly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}