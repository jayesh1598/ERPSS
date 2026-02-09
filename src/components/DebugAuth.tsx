import { useState } from 'react';
import { supabase } from '../lib/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DebugAuth() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setResult({ error: 'No session found. Please login first.' });
        setLoading(false);
        return;
      }

      console.log('📋 Session info:', {
        user: session.user.email,
        tokenLength: session.access_token.length,
        tokenPrefix: session.access_token.substring(0, 30),
        expiresAt: session.expires_at,
      });

      // Call debug endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/debug/validate-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': publicAnonKey,
          },
        }
      );

      const data = await response.json();
      console.log('📋 Debug endpoint response:', data);

      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
        sessionInfo: {
          user: session.user.email,
          userId: session.user.id,
          tokenLength: session.access_token.length,
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        }
      });
    } catch (error: any) {
      console.error('📋 Debug test error:', error);
      setResult({ error: error.message });
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Authentication Debug Tool</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Purpose:</strong> This tool tests JWT validation between frontend and backend.
          Make sure you're logged in first, then click the button below.
        </p>
      </div>

      <button
        onClick={testAuth}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {loading ? 'Testing...' : '🧪 Test Authentication'}
      </button>

      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Results:</h2>
          <pre className="bg-white p-4 rounded border border-gray-300 overflow-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
