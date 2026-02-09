import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase, getAccessToken } from '../lib/api';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  message: string;
  details?: any;
}

export function JWTFixVerification() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Edge Function Deployment', status: 'pending', message: 'Not started' },
    { name: 'Service Role Key Configuration', status: 'pending', message: 'Not started' },
    { name: 'JWT Validation Method', status: 'pending', message: 'Not started' },
    { name: 'Session Availability', status: 'pending', message: 'Not started' },
    { name: 'Protected Endpoint Access', status: 'pending', message: 'Not started' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Test 1: Check Edge Function Deployment
    updateTest(0, { status: 'running', message: 'Checking...' });
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`
      );
      const data = await response.json();
      
      if (data.version === '4.1-production-jwt-fixed') {
        updateTest(0, { 
          status: 'pass', 
          message: `✅ Correct version deployed: ${data.version}`,
          details: data
        });
      } else {
        updateTest(0, { 
          status: 'fail', 
          message: `❌ Wrong version: ${data.version}. Expected: 4.1-production-jwt-fixed`,
          details: data
        });
      }
    } catch (error: any) {
      updateTest(0, { 
        status: 'fail', 
        message: `❌ Failed to reach Edge Function: ${error.message}` 
      });
    }

    // Test 2: Check Service Role Key
    updateTest(1, { status: 'running', message: 'Checking...' });
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`
      );
      const data = await response.json();
      
      if (data.environment?.hasServiceKey === true) {
        updateTest(1, { 
          status: 'pass', 
          message: '✅ Service Role Key is configured',
          details: data.environment
        });
      } else {
        updateTest(1, { 
          status: 'fail', 
          message: '❌ Service Role Key is missing. Set SUPABASE_SERVICE_ROLE_KEY environment variable.',
          details: data.environment
        });
      }
    } catch (error: any) {
      updateTest(1, { status: 'fail', message: `❌ ${error.message}` });
    }

    // Test 3: Check Auth Method
    updateTest(2, { status: 'running', message: 'Checking...' });
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`
      );
      const data = await response.json();
      
      if (data.authMethod?.includes('supabaseAdmin')) {
        updateTest(2, { 
          status: 'pass', 
          message: '✅ Using Service Role Key for JWT validation',
          details: data.authMethod
        });
      } else {
        updateTest(2, { 
          status: 'fail', 
          message: `❌ Not using Service Role Key. Method: ${data.authMethod}`,
          details: data.authMethod
        });
      }
    } catch (error: any) {
      updateTest(2, { status: 'fail', message: `❌ ${error.message}` });
    }

    // Test 4: Check Session
    updateTest(3, { status: 'running', message: 'Checking...' });
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        updateTest(3, { 
          status: 'fail', 
          message: `❌ Session error: ${error.message}` 
        });
      } else if (session) {
        updateTest(3, { 
          status: 'pass', 
          message: `✅ Active session found for ${session.user?.email}`,
          details: {
            user: session.user?.email,
            expiresAt: new Date(session.expires_at! * 1000).toISOString()
          }
        });
      } else {
        updateTest(3, { 
          status: 'fail', 
          message: '⚠️ No active session. Please log in to test protected endpoints.' 
        });
      }
    } catch (error: any) {
      updateTest(3, { status: 'fail', message: `❌ ${error.message}` });
    }

    // Test 5: Check Protected Endpoint (if logged in)
    updateTest(4, { status: 'running', message: 'Checking...' });
    try {
      const token = await getAccessToken();
      
      if (!token) {
        updateTest(4, { 
          status: 'fail', 
          message: '⚠️ No access token. Log in to test protected endpoints.' 
        });
      } else {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/auth/test`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': publicAnonKey,
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          updateTest(4, { 
            status: 'pass', 
            message: `✅ Protected endpoint accessible! User: ${data.user?.email}`,
            details: data
          });
        } else {
          const errorData = await response.json();
          updateTest(4, { 
            status: 'fail', 
            message: `❌ Protected endpoint failed: ${errorData.error || errorData.message}`,
            details: errorData
          });
        }
      }
    } catch (error: any) {
      updateTest(4, { status: 'fail', message: `❌ ${error.message}` });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="size-5 text-green-600" />;
      case 'fail':
        return <XCircle className="size-5 text-red-600" />;
      case 'running':
        return <Loader2 className="size-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="size-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-600">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-600">Fail</Badge>;
      case 'running':
        return <Badge className="bg-blue-600">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const allPassed = tests.every(t => t.status === 'pass');
  const anyFailed = tests.some(t => t.status === 'fail');

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>JWT Fix Verification</CardTitle>
        <CardDescription>
          Verifying that the JWT authentication fix has been deployed correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        {!isRunning && (
          <div className={`p-4 rounded-lg border-2 ${
            allPassed ? 'bg-green-50 border-green-200' : 
            anyFailed ? 'bg-red-50 border-red-200' : 
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              {allPassed ? (
                <>
                  <CheckCircle className="size-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">✅ All Tests Passed!</p>
                    <p className="text-sm text-green-700">JWT authentication is working correctly.</p>
                  </div>
                </>
              ) : anyFailed ? (
                <>
                  <XCircle className="size-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">❌ Some Tests Failed</p>
                    <p className="text-sm text-red-700">Please review the failures below and follow the recommended actions.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="size-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Tests Pending</p>
                    <p className="text-sm text-gray-700">Click "Run Tests" to verify the deployment.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-white"
            >
              <div className="mt-0.5">
                {getStatusIcon(test.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{test.name}</p>
                  {getStatusBadge(test.status)}
                </div>
                <p className="text-sm text-gray-600">{test.message}</p>
                {test.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">View details</summary>
                    <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Tests Again'
            )}
          </Button>
        </div>

        {/* Help Text */}
        {anyFailed && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">📚 Need Help?</p>
            <p className="text-sm text-blue-700">
              Check <code className="bg-blue-100 px-1 rounded">/DEPLOY_INSTRUCTIONS.md</code> for detailed deployment steps
              or <code className="bg-blue-100 px-1 rounded">/🚀_DEPLOY_NOW.md</code> for quick instructions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
