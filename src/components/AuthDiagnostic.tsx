import { useState } from 'react';
import { supabase } from '../lib/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function AuthDiagnostic() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnosticResults: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Check Supabase Session
      console.log('🔍 Test 1: Checking Supabase session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      diagnosticResults.tests.push({
        name: 'Supabase Session',
        status: session ? 'success' : 'error',
        details: session ? {
          user: session.user?.email,
          tokenLength: session.access_token?.length,
          tokenPrefix: session.access_token?.substring(0, 30) + '...',
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          expiresIn: Math.floor((session.expires_at! * 1000 - Date.now()) / 1000) + ' seconds'
        } : { error: sessionError?.message || 'No session found' }
      });

      if (!session) {
        diagnosticResults.overallStatus = 'error';
        diagnosticResults.message = 'No active session - please log in first';
        setResults(diagnosticResults);
        setLoading(false);
        return;
      }

      // Test 2: Check Server Health
      console.log('🔍 Test 2: Checking server health...');
      try {
        const healthResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`,
          {
            headers: {
              'apikey': publicAnonKey
            }
          }
        );
        const healthData = await healthResponse.json();
        
        diagnosticResults.tests.push({
          name: 'Server Health',
          status: healthResponse.ok ? 'success' : 'error',
          details: healthData
        });
      } catch (error: any) {
        diagnosticResults.tests.push({
          name: 'Server Health',
          status: 'error',
          details: { error: error.message }
        });
      }

      // Test 3: Test Auth Endpoint
      console.log('🔍 Test 3: Testing auth endpoint...');
      try {
        const authTestResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/auth/test`,
          {
            headers: {
              'apikey': publicAnonKey,
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );
        
        let authTestData;
        try {
          authTestData = await authTestResponse.json();
        } catch {
          authTestData = { error: 'Failed to parse response' };
        }
        
        diagnosticResults.tests.push({
          name: 'Auth Test Endpoint',
          status: authTestResponse.ok ? 'success' : 'error',
          details: {
            statusCode: authTestResponse.status,
            statusText: authTestResponse.statusText,
            response: authTestData
          }
        });
      } catch (error: any) {
        diagnosticResults.tests.push({
          name: 'Auth Test Endpoint',
          status: 'error',
          details: { error: error.message }
        });
      }

      // Test 4: Test Debug Validate Token Endpoint
      console.log('🔍 Test 4: Testing debug validate token endpoint...');
      try {
        const debugResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/debug/validate-token`,
          {
            method: 'POST',
            headers: {
              'apikey': publicAnonKey,
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        let debugData;
        try {
          debugData = await debugResponse.json();
        } catch {
          debugData = { error: 'Failed to parse response' };
        }
        
        diagnosticResults.tests.push({
          name: 'Debug Validate Token',
          status: debugResponse.ok && debugData.success ? 'success' : 'error',
          details: {
            statusCode: debugResponse.status,
            response: debugData
          }
        });
      } catch (error: any) {
        diagnosticResults.tests.push({
          name: 'Debug Validate Token',
          status: 'error',
          details: { error: error.message }
        });
      }

      // Test 5: Test Dashboard Stats (real endpoint)
      console.log('🔍 Test 5: Testing dashboard stats endpoint...');
      try {
        const statsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/dashboard/stats`,
          {
            headers: {
              'apikey': publicAnonKey,
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );
        
        let statsData;
        try {
          statsData = await statsResponse.json();
        } catch {
          statsData = { error: 'Failed to parse response' };
        }
        
        diagnosticResults.tests.push({
          name: 'Dashboard Stats Endpoint',
          status: statsResponse.ok ? 'success' : 'error',
          details: {
            statusCode: statsResponse.status,
            response: statsData
          }
        });
      } catch (error: any) {
        diagnosticResults.tests.push({
          name: 'Dashboard Stats Endpoint',
          status: 'error',
          details: { error: error.message }
        });
      }

      // Determine overall status
      const hasErrors = diagnosticResults.tests.some((t: any) => t.status === 'error');
      diagnosticResults.overallStatus = hasErrors ? 'warning' : 'success';
      diagnosticResults.message = hasErrors 
        ? 'Some tests failed - see details below'
        : 'All authentication tests passed!';

    } catch (error: any) {
      diagnosticResults.overallStatus = 'error';
      diagnosticResults.message = error.message;
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Authentication Diagnostics</CardTitle>
        <CardDescription>
          Test authentication and API connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={loading} className="w-full">
          {loading ? 'Running Diagnostics...' : 'Run Authentication Tests'}
        </Button>

        {results && (
          <div className="space-y-4 mt-4">
            {/* Overall Status */}
            <div className={`p-4 rounded-lg ${
              results.overallStatus === 'success' ? 'bg-green-50 border border-green-200' :
              results.overallStatus === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {results.overallStatus === 'success' && <CheckCircle2 className="size-5 text-green-600" />}
                {results.overallStatus === 'warning' && <AlertCircle className="size-5 text-yellow-600" />}
                {results.overallStatus === 'error' && <XCircle className="size-5 text-red-600" />}
                <span className="font-semibold">{results.message}</span>
              </div>
            </div>

            {/* Individual Test Results */}
            <div className="space-y-3">
              {results.tests.map((test: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {test.status === 'success' ? (
                      <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{test.name}</div>
                      <pre className="text-xs mt-2 overflow-x-auto bg-gray-50 p-2 rounded">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 text-center">
              Test run at: {new Date(results.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
