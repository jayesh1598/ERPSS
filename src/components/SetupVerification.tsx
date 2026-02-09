import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export function SetupVerification() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runChecks = async () => {
    setChecking(true);
    const checks: any = {};

    try {
      // Check 1: Frontend Config
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      checks.frontendConfig = {
        status: projectId && publicAnonKey ? 'pass' : 'fail',
        projectId: projectId || 'MISSING',
        hasAnonKey: !!publicAnonKey,
        message: projectId && publicAnonKey ? 'Frontend configured correctly' : 'Missing configuration'
      };

      // Check 2: API Health
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`,
          {
            headers: {
              'apikey': publicAnonKey
            }
          }
        );
        const data = await response.json();
        checks.apiHealth = {
          status: response.ok ? 'pass' : 'fail',
          data,
          message: response.ok ? 'API is responding' : 'API not accessible'
        };
      } catch (error: any) {
        checks.apiHealth = {
          status: 'fail',
          error: error.message,
          message: 'Cannot reach API endpoint'
        };
      }

      // Check 3: Supabase Client
      const { supabase } = await import('../lib/api');
      checks.supabaseClient = {
        status: supabase ? 'pass' : 'fail',
        message: supabase ? 'Supabase client initialized' : 'Client not initialized'
      };

      // Check 4: Session Storage
      const { data: { session } } = await supabase.auth.getSession();
      checks.session = {
        status: session ? 'pass' : 'warning',
        hasSession: !!session,
        user: session?.user?.email || 'Not logged in',
        message: session ? 'Active session found' : 'No active session (login required)'
      };

      // Check 5: Token Availability
      if (session) {
        checks.token = {
          status: 'pass',
          tokenLength: session.access_token?.length || 0,
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'Unknown',
          isExpired: session.expires_at ? (session.expires_at * 1000) < Date.now() : true,
          message: 'JWT token available'
        };
      } else {
        checks.token = {
          status: 'warning',
          message: 'No token (not logged in)'
        };
      }

      setResults(checks);
    } catch (error: any) {
      checks.error = {
        status: 'fail',
        message: error.message
      };
      setResults(checks);
    } finally {
      setChecking(false);
    }
  };

  const renderCheck = (title: string, check: any) => {
    if (!check) return null;

    let icon;
    let colorClass;
    
    switch (check.status) {
      case 'pass':
        icon = <CheckCircle className="size-5" />;
        colorClass = 'text-green-600 border-green-200 bg-green-50';
        break;
      case 'warning':
        icon = <AlertTriangle className="size-5" />;
        colorClass = 'text-yellow-600 border-yellow-200 bg-yellow-50';
        break;
      case 'fail':
        icon = <XCircle className="size-5" />;
        colorClass = 'text-red-600 border-red-200 bg-red-50';
        break;
      default:
        icon = <AlertTriangle className="size-5" />;
        colorClass = 'text-gray-600 border-gray-200 bg-gray-50';
    }

    return (
      <div className={`border rounded-lg p-4 ${colorClass}`}>
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm mt-1">{check.message}</p>
            {Object.keys(check).length > 2 && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer hover:underline">View Details</summary>
                <pre className="text-xs mt-2 p-2 bg-white rounded overflow-x-auto">
                  {JSON.stringify(check, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>System Setup Verification</CardTitle>
          <CardDescription>
            Check if your ERP system is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What This Checks:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Frontend configuration (Project ID, Anon Key)</li>
              <li>✓ Backend API accessibility</li>
              <li>✓ Supabase client initialization</li>
              <li>✓ Current session status</li>
              <li>✓ JWT token availability</li>
            </ul>
          </div>

          <Button 
            onClick={runChecks} 
            disabled={checking}
            className="w-full"
            size="lg"
          >
            {checking ? (
              <>
                <RefreshCw className="size-4 mr-2 animate-spin" />
                Running Checks...
              </>
            ) : (
              'Run System Checks'
            )}
          </Button>

          {results && (
            <div className="space-y-3 mt-6">
              <h2 className="text-lg font-bold">Results:</h2>
              {renderCheck('Frontend Configuration', results.frontendConfig)}
              {renderCheck('API Health', results.apiHealth)}
              {renderCheck('Supabase Client', results.supabaseClient)}
              {renderCheck('Session Status', results.session)}
              {renderCheck('JWT Token', results.token)}
              {results.error && renderCheck('System Error', results.error)}

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
                <h3 className="font-semibold mb-2">📋 Summary:</h3>
                {Object.values(results).every((r: any) => r.status === 'pass') && (
                  <p className="text-green-600">
                    ✅ All checks passed! Your system is properly configured.
                  </p>
                )}
                {Object.values(results).some((r: any) => r.status === 'warning') && (
                  <p className="text-yellow-600">
                    ⚠️ Some warnings detected. Review the details above.
                  </p>
                )}
                {Object.values(results).some((r: any) => r.status === 'fail') && (
                  <div className="text-red-600 space-y-2">
                    <p>❌ Some checks failed. Action required:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {results.frontendConfig?.status === 'fail' && (
                        <li>Configure project settings in /utils/supabase/info.tsx</li>
                      )}
                      {results.apiHealth?.status === 'fail' && (
                        <li>Ensure Edge Function is deployed at Supabase</li>
                      )}
                      {results.session?.status === 'fail' && (
                        <li>Log in to create an active session</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Next Steps */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 Next Steps:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  {!results.session?.hasSession && (
                    <li>Login at <a href="/admin-login" className="underline font-semibold">/admin-login</a></li>
                  )}
                  <li>Run <a href="/jwt-debug" className="underline font-semibold">/jwt-debug</a> to test authentication</li>
                  <li>Check dashboard at <a href="/" className="underline font-semibold">/</a></li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
