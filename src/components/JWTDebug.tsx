import { useState } from 'react';
import { supabase, getAccessToken } from '../lib/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb`;

export function JWTDebug() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {};

    try {
      // Test 1: Get current session
      console.log('🧪 Test 1: Getting current session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      testResults.session = {
        success: !!session && !sessionError,
        data: session ? {
          user: session.user?.email,
          tokenLength: session.access_token?.length,
          tokenPrefix: session.access_token?.substring(0, 30),
          expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
          isExpired: session.expires_at ? (session.expires_at * 1000) < Date.now() : true
        } : null,
        error: sessionError?.message
      };

      // Test 2: Get access token via helper
      console.log('🧪 Test 2: Getting access token...');
      const token = await getAccessToken();
      testResults.accessToken = {
        success: !!token,
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 30) || 'N/A'
      };

      // Test 3: Validate token on backend
      if (token) {
        console.log('🧪 Test 3: Validating token on backend...');
        try {
          const response = await fetch(`${API_BASE}/debug/validate-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': publicAnonKey
            }
          });
          const result = await response.json();
          testResults.backendValidation = {
            success: result.success,
            data: result,
            status: response.status
          };
        } catch (error: any) {
          testResults.backendValidation = {
            success: false,
            error: error.message
          };
        }
      } else {
        testResults.backendValidation = {
          success: false,
          error: 'No token available to test'
        };
      }

      // Test 4: Test auth/me endpoint
      if (token) {
        console.log('🧪 Test 4: Testing /auth/me endpoint...');
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'apikey': publicAnonKey
            }
          });
          const result = await response.json();
          testResults.authMe = {
            success: response.ok,
            data: result,
            status: response.status
          };
        } catch (error: any) {
          testResults.authMe = {
            success: false,
            error: error.message
          };
        }
      } else {
        testResults.authMe = {
          success: false,
          error: 'No token available to test'
        };
      }

      // Test 5: Check user metadata
      console.log('🧪 Test 5: Checking user metadata...');
      const { data: { user } } = await supabase.auth.getUser();
      testResults.userMetadata = {
        success: !!user,
        data: user ? {
          email: user.email,
          metadata: user.user_metadata,
          role: user.user_metadata?.role,
          isAdmin: user.user_metadata?.role === 'admin'
        } : null
      };

    } catch (error: any) {
      console.error('Test error:', error);
      testResults.error = error.message;
    }

    setResults(testResults);
    setLoading(false);
  };

  const renderTestResult = (name: string, result: any) => {
    if (!result) return null;

    return (
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="size-5 text-green-600" />
          ) : (
            <XCircle className="size-5 text-red-600" />
          )}
          <h3 className="font-semibold">{name}</h3>
        </div>
        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-6" />
            JWT Debug Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This tool helps diagnose JWT authentication issues. Click the button below to run all tests.
            </p>
          </div>

          <Button 
            onClick={runTests} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Running Tests...' : 'Run JWT Tests'}
          </Button>

          {Object.keys(results).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Test Results:</h2>
              {renderTestResult('1. Session Check', results.session)}
              {renderTestResult('2. Access Token', results.accessToken)}
              {renderTestResult('3. Backend Token Validation', results.backendValidation)}
              {renderTestResult('4. Auth Me Endpoint', results.authMe)}
              {renderTestResult('5. User Metadata', results.userMetadata)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
