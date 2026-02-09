import { useState, useEffect } from 'react';
import { supabase } from '../lib/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { AuthDiagnostic } from './AuthDiagnostic';

export function DiagnosePage() {
  const [health, setHealth] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkHealth();
    checkSession();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`,
        {
          headers: {
            'apikey': publicAnonKey,
          },
        }
      );
      const data = await response.json();
      setHealth(data);
      console.log('🏥 Health check:', data);
    } catch (error: any) {
      setHealth({ error: error.message });
    }
  };

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession({
          user: session.user.email,
          userId: session.user.id,
          tokenLength: session.access_token.length,
          tokenPrefix: session.access_token.substring(0, 40),
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          isExpired: Date.now() > (session.expires_at! * 1000),
        });
      } else {
        setSession({ error: 'No session - please login first' });
      }
    } catch (error: any) {
      setSession({ error: error.message });
    }
  };

  const testDebugEndpoint = async () => {
    setLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setDebugResult({ error: 'No session found. Please login first.' });
        setLoading(false);
        return;
      }

      console.log('🧪 Testing debug endpoint with token:', currentSession.access_token.substring(0, 40));

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/debug/validate-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentSession.access_token}`,
            'apikey': publicAnonKey,
          },
        }
      );

      const data = await response.json();
      console.log('🧪 Debug endpoint response:', data);

      setDebugResult({
        status: response.status,
        statusText: response.statusText,
        ...data,
      });
    } catch (error: any) {
      console.error('🧪 Debug test error:', error);
      setDebugResult({ error: error.message });
    }
    setLoading(false);
  };

  const testDashboardAPI = async () => {
    setLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setDebugResult({ error: 'No session found. Please login first.' });
        setLoading(false);
        return;
      }

      console.log('📊 Testing dashboard API with token:', currentSession.access_token.substring(0, 40));

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/dashboard/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentSession.access_token}`,
            'apikey': publicAnonKey,
          },
        }
      );

      const data = await response.json();
      console.log('📊 Dashboard API response:', data);

      setDebugResult({
        endpoint: '/dashboard/stats',
        status: response.status,
        statusText: response.statusText,
        ...data,
      });
    } catch (error: any) {
      console.error('📊 Dashboard test error:', error);
      setDebugResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔍 System Diagnostics</h1>
        <p className="text-gray-600">Complete authentication and server status</p>
      </div>

      {/* Server Health */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🏥 Server Health
        </h2>
        {health ? (
          <div>
            <pre className="bg-gray-50 p-4 rounded border text-sm overflow-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
            {health.version && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-semibold text-blue-900">Deployed Version:</p>
                <p className="text-sm text-blue-700">{health.version}</p>
                <p className="text-xs text-blue-600 mt-1">{health.authMethod}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Loading...</p>
        )}
        <Button onClick={checkHealth} className="mt-4" variant="outline" size="sm">
          Refresh Health Check
        </Button>
      </Card>

      {/* Session Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          🔑 Current Session
        </h2>
        {session ? (
          <div>
            <pre className="bg-gray-50 p-4 rounded border text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
            {session.isExpired && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-semibold text-red-900">⚠️ Session Expired!</p>
                <p className="text-sm text-red-700">Please login again</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Loading...</p>
        )}
        <Button onClick={checkSession} className="mt-4" variant="outline" size="sm">
          Refresh Session
        </Button>
      </Card>

      {/* Comprehensive Auth Diagnostic */}
      <AuthDiagnostic />

      {/* Test Buttons */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🧪 API Tests</h2>
        <div className="flex gap-3 mb-4">
          <Button onClick={testDebugEndpoint} disabled={loading}>
            Test Debug Endpoint
          </Button>
          <Button onClick={testDashboardAPI} disabled={loading} variant="secondary">
            Test Dashboard API
          </Button>
        </div>

        {debugResult && (
          <div>
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="bg-gray-50 p-4 rounded border text-sm overflow-auto max-h-96">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
            {debugResult.status === 401 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="font-semibold text-red-900">❌ Authentication Failed (401)</p>
                <p className="text-sm text-red-700 mt-2">
                  This means the server is rejecting the JWT token.
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Check that you've deployed with: <code className="bg-red-100 px-2 py-1 rounded">supabase functions deploy make-server-8eebe9eb --no-verify-jwt</code>
                </p>
              </div>
            )}
            {debugResult.status === 200 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="font-semibold text-green-900">✅ Authentication Successful!</p>
                <p className="text-sm text-green-700 mt-2">
                  The server is correctly validating JWT tokens.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-3">📋 Deployment Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Make sure you're logged in at <a href="/login" className="text-blue-600 underline">/login</a></li>
          <li>Check that Server Health shows <code className="bg-yellow-100 px-2 py-1 rounded">version: "2.0-getUser-with-token-param"</code></li>
          <li>If version is wrong, redeploy: <code className="bg-yellow-100 px-2 py-1 rounded">supabase functions deploy make-server-8eebe9eb --no-verify-jwt</code></li>
          <li>After deployment, hard refresh this page (Ctrl+Shift+R)</li>
          <li>Click "Test Debug Endpoint" - should return success: true</li>
          <li>Click "Test Dashboard API" - should return dashboard stats</li>
        </ol>
      </Card>
    </div>
  );
}
