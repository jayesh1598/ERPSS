import { AlertCircle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';

export function DeploymentWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  useEffect(() => {
    checkServerVersion();
  }, []);

  const checkServerVersion = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb/health`
      );
      const data = await response.json();
      setServerVersion(data.version);
      
      // Show warning if version is not the expected one
      const expectedVersion = '2.0-getUser-with-token-param';
      if (data.version !== expectedVersion) {
        setShowWarning(true);
      }
    } catch (error) {
      console.error('Failed to check server version:', error);
      setShowWarning(true);
    }
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start">
        <AlertCircle className="size-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">
            ⚠️ Edge Function Not Deployed
          </h3>
          <p className="text-sm text-red-700 mb-2">
            Your Edge Function is running outdated code (version: {serverVersion || 'unknown'}). 
            This will cause JWT authentication errors.
          </p>
          <div className="flex gap-2">
            <a
              href="/deployment-check.html"
              target="_blank"
              className="inline-flex items-center text-sm font-medium text-red-800 hover:text-red-900 underline"
            >
              Run Diagnostics
              <ExternalLink className="size-3 ml-1" />
            </a>
            <a
              href="/FIX_JWT_ERROR.md"
              target="_blank"
              className="inline-flex items-center text-sm font-medium text-red-800 hover:text-red-900 underline"
            >
              View Fix Instructions
              <ExternalLink className="size-3 ml-1" />
            </a>
          </div>
          <div className="mt-2 bg-red-100 p-2 rounded text-xs font-mono text-red-900">
            supabase functions deploy make-server-8eebe9eb --no-verify-jwt
          </div>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="text-red-500 hover:text-red-700 ml-3"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
