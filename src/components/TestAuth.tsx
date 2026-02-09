import { useState } from 'react';
import { supabase, getAccessToken } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function TestAuth() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setTesting(true);
    const testResults: any = {
      session: null,
      token: null,
      tokenLength: 0,
      tokenPrefix: '',
      user: null,
      error: null
    };

    try {
      // Test 1: Get Session
      console.log('🧪 Test 1: Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        testResults.error = `Session Error: ${sessionError.message}`;
        console.error('❌ Session error:', sessionError);
      } else if (!session) {
        testResults.error = 'No active session found';
        console.warn('⚠️ No session');
      } else {
        testResults.session = {
          user: session.user.email,
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
          isExpired: session.expires_at ? (session.expires_at * 1000) < Date.now() : true
        };
        testResults.token = session.access_token?.substring(0, 50) + '...';
        testResults.tokenLength = session.access_token?.length || 0;
        testResults.tokenPrefix = session.access_token?.substring(0, 20);
        console.log('✅ Session found:', testResults.session);
      }

      // Test 2: Get Access Token (with refresh logic)
      console.log('🧪 Test 2: Getting access token...');
      const token = await getAccessToken();
      testResults.tokenFromHelper = token ? token.substring(0, 50) + '...' : null;
      
      // Test 3: Get User
      console.log('🧪 Test 3: Getting user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        testResults.userError = userError.message;
        console.error('❌ User error:', userError);
      } else {
        testResults.user = user ? {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        } : null;
        console.log('✅ User:', testResults.user);
      }
    } catch (error: any) {
      testResults.error = error.message;
      console.error('❌ Test error:', error);
    } finally {
      setResults(testResults);
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This page tests your authentication status. Click the button below to check your session.
          </p>
          
          <Button onClick={runTests} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Run Authentication Tests'
            )}
          </Button>

          {results && (
            <div className="mt-6 space-y-4">
              {/* Session Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {results.session ? (
                    <CheckCircle className="size-5 text-green-600" />
                  ) : (
                    <XCircle className="size-5 text-red-600" />
                  )}
                  <h3 className="font-semibold">Session Status</h3>
                </div>
                {results.session ? (
                  <div className="text-sm space-y-1 ml-7">
                    <p><strong>User:</strong> {results.session.user}</p>
                    <p><strong>Expires:</strong> {results.session.expiresAt}</p>
                    <p><strong>Is Expired:</strong> {results.session.isExpired ? '❌ YES' : '✅ NO'}</p>
                    <p><strong>Token Length:</strong> {results.tokenLength} chars</p>
                    <p className="font-mono text-xs bg-gray-50 p-2 rounded">
                      {results.token}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 ml-7">
                    {results.error || 'No active session'}
                  </p>
                )}
              </div>

              {/* User Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {results.user ? (
                    <CheckCircle className="size-5 text-green-600" />
                  ) : (
                    <XCircle className="size-5 text-red-600" />
                  )}
                  <h3 className="font-semibold">User Status</h3>
                </div>
                {results.user ? (
                  <div className="text-sm space-y-1 ml-7">
                    <p><strong>ID:</strong> {results.user.id}</p>
                    <p><strong>Email:</strong> {results.user.email}</p>
                    <p><strong>Created:</strong> {results.user.createdAt}</p>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 ml-7">
                    {results.userError || 'No user found'}
                  </p>
                )}
              </div>

              {/* Token Helper Status */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {results.tokenFromHelper ? (
                    <CheckCircle className="size-5 text-green-600" />
                  ) : (
                    <XCircle className="size-5 text-red-600" />
                  )}
                  <h3 className="font-semibold">Token Helper (with refresh)</h3>
                </div>
                {results.tokenFromHelper ? (
                  <p className="text-sm ml-7 font-mono text-xs bg-gray-50 p-2 rounded">
                    {results.tokenFromHelper}
                  </p>
                ) : (
                  <p className="text-sm text-red-600 ml-7">
                    Token not available
                  </p>
                )}
              </div>

              {/* Recommendation */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Recommendation</h3>
                {!results.session || results.error ? (
                  <p className="text-sm text-blue-800">
                    You need to <strong>log in</strong> to use the system. Please go to the login page and sign in with your credentials.
                  </p>
                ) : results.session.isExpired ? (
                  <p className="text-sm text-blue-800">
                    Your session has <strong>expired</strong>. Please log out and log in again.
                  </p>
                ) : (
                  <p className="text-sm text-green-800">
                    ✅ Your authentication is working correctly! You can access all features of the system.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
