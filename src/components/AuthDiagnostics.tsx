import { useState, useEffect } from 'react';
import { supabase } from '../lib/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function AuthDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      frontend: {},
      backend: {},
      session: {},
    };

    try {
      // 1. Check frontend configuration
      results.frontend = {
        projectId,
        supabaseUrl: `https://${projectId}.supabase.co`,
        anonKeyPrefix: publicAnonKey.substring(0, 30) + '...',
        hasAnonKey: !!publicAnonKey,
      };

      // 2. Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      results.session = {
        hasSession: !!session,
        error: sessionError?.message || null,
        user: session?.user?.email || null,
        tokenPrefix: session?.access_token?.substring(0, 20) + '...' || null,
        expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        isExpired: session?.expires_at ? (session.expires_at * 1000) < Date.now() : null,
      };

      // Decode JWT if we have one
      if (session?.access_token) {
        try {
          const payload = JSON.parse(atob(session.access_token.split('.')[1]));
          results.session.jwtPayload = {
            iss: payload.iss,
            sub: payload.sub,
            exp: new Date(payload.exp * 1000).toISOString(),
            role: payload.role,
          };
        } catch (e) {
          results.session.jwtDecodeError = 'Failed to decode JWT';
        }
      }

      // 3. Check backend health
      try {
        const healthResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`,
          {
            headers: {
              'apikey': publicAnonKey,
            },
          }
        );
        results.backend = await healthResponse.json();
      } catch (e: any) {
        results.backend = {
          error: e.message,
          status: 'unreachable',
        };
      }

      // 4. Test authenticated endpoint
      if (session?.access_token) {
        try {
          const testResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/auth/me`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': publicAnonKey,
              },
            }
          );
          
          if (testResponse.ok) {
            results.authTest = {
              status: 'success',
              data: await testResponse.json(),
            };
          } else {
            results.authTest = {
              status: 'failed',
              statusCode: testResponse.status,
              error: await testResponse.json(),
            };
          }
        } catch (e: any) {
          results.authTest = {
            status: 'error',
            message: e.message,
          };
        }
      } else {
        results.authTest = {
          status: 'skipped',
          reason: 'No session found',
        };
      }

      setDiagnostics(results);
    } catch (error: any) {
      setDiagnostics({
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Diagnostics</CardTitle>
        <CardDescription>
          Detailed information about authentication configuration and status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? 'Running Diagnostics...' : 'Refresh Diagnostics'}
        </Button>

        {diagnostics && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Frontend Configuration</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(diagnostics.frontend, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Session</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(diagnostics.session, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Backend Health</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(diagnostics.backend, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Authentication Test</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(diagnostics.authTest, null, 2)}
              </pre>
            </div>

            {/* Summary */}
            <div className={`p-4 rounded-lg ${
              diagnostics.authTest?.status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <h3 className="font-semibold mb-2">
                {diagnostics.authTest?.status === 'success' 
                  ? '✅ Authentication Working' 
                  : '❌ Authentication Issues Detected'}
              </h3>
              {diagnostics.authTest?.status !== 'success' && (
                <div className="text-sm space-y-2">
                  <p><strong>Possible Issues:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    {!diagnostics.session?.hasSession && (
                      <li>No active session - Please log in</li>
                    )}
                    {diagnostics.session?.isExpired && (
                      <li>Session expired - Please log in again</li>
                    )}
                    {diagnostics.backend?.configuration?.targetProjectId !== projectId && (
                      <li>Backend configured for different project</li>
                    )}
                    {!diagnostics.backend?.configuration?.hasTargetServiceKey && (
                      <li>Backend missing TARGET_SUPABASE_SERVICE_ROLE_KEY</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
