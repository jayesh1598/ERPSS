import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Rocket, 
  Terminal, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  ExternalLink,
  Code,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

export function DeploymentInstructions() {
  const projectId = 'dhahhnqdwsncjieqydjh';
  const functionName = 'make-server-8eebe9eb';
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const commands = {
    installCLI: {
      macos: 'brew install supabase/tap/supabase',
      windows: 'scoop install supabase',
      npm: 'npm install -g supabase'
    },
    login: 'supabase login',
    link: `supabase link --project-ref ${projectId}`,
    deploy: `supabase functions deploy ${functionName} --project-ref ${projectId}`,
    checkSecrets: `supabase secrets list --project-ref ${projectId}`,
    setServiceKey: `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key --project-ref ${projectId}`,
    setUrl: `supabase secrets set SUPABASE_URL=https://${projectId}.supabase.co --project-ref ${projectId}`,
    setAnonKey: `supabase secrets set SUPABASE_ANON_KEY=your_key --project-ref ${projectId}`
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="size-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          <strong>Action Required:</strong> The JWT authentication fix is implemented in the code but needs to be deployed to Supabase.
        </AlertDescription>
      </Alert>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="size-5" />
            Deployment Status
          </CardTitle>
          <CardDescription>
            Your Edge Function is ready to deploy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              <span className="font-medium">Code is ready</span>
            </div>
            <Badge className="bg-green-600">JWT Fix Implemented</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-600" />
              <span className="font-medium">Deployment needed</span>
            </div>
            <Badge className="bg-orange-600">Not Yet Deployed</Badge>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Project ID:</span>
                <code className="text-xs bg-white px-2 py-1 rounded">{projectId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Function Name:</span>
                <code className="text-xs bg-white px-2 py-1 rounded">{functionName}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <code className="text-xs bg-white px-2 py-1 rounded">4.1-production-jwt-fixed</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="size-5" />
            Deployment Methods
          </CardTitle>
          <CardDescription>
            Choose your preferred deployment method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Method 1: CLI (Recommended) */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  Option 1: Supabase CLI
                  <Badge variant="outline">Recommended</Badge>
                </h3>
                <p className="text-sm text-gray-600 mt-1">Deploy directly from your terminal</p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              {/* Install CLI */}
              <div>
                <p className="text-sm font-medium mb-2">Step 1: Install Supabase CLI</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                      {commands.installCLI.macos}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(commands.installCLI.macos, 'Command')}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    macOS/Linux: Use Homebrew | Windows: Use Scoop | Or: {commands.installCLI.npm}
                  </p>
                </div>
              </div>

              {/* Login */}
              <div>
                <p className="text-sm font-medium mb-2">Step 2: Login to Supabase</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-50 p-2 rounded border">
                    {commands.login}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(commands.login, 'Command')}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Link Project */}
              <div>
                <p className="text-sm font-medium mb-2">Step 3: Link to Your Project</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                    {commands.link}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(commands.link, 'Command')}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Deploy */}
              <div>
                <p className="text-sm font-medium mb-2">Step 4: Deploy the Function</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                    {commands.deploy}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(commands.deploy, 'Command')}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Method 2: Dashboard */}
          <div className="border rounded-lg p-4 space-y-3">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                Option 2: Supabase Dashboard
              </h3>
              <p className="text-sm text-gray-600 mt-1">Deploy using the web interface</p>
            </div>

            <div className="space-y-2 pt-3 border-t">
              <ol className="space-y-2 text-sm list-decimal list-inside">
                <li>Go to your Supabase Dashboard</li>
                <li>Navigate to <strong>Edge Functions</strong></li>
                <li>Create or edit the <code className="bg-gray-100 px-1 rounded">{functionName}</code> function</li>
                <li>Copy the code from <code className="bg-gray-100 px-1 rounded">/supabase/functions/server/index.tsx</code></li>
                <li>Click <strong>Deploy</strong></li>
              </ol>
              
              <Button
                className="w-full mt-2"
                variant="outline"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')}
              >
                <ExternalLink className="size-4 mr-2" />
                Open Edge Functions Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>
            Ensure these are configured in your Supabase project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              The <strong>SUPABASE_SERVICE_ROLE_KEY</strong> is critical for JWT authentication.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {/* Service Role Key */}
            <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
              <p className="text-sm font-medium mb-1">SUPABASE_SERVICE_ROLE_KEY</p>
              <p className="text-xs text-gray-600 mb-2">Required for validating JWTs</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                  {commands.setServiceKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(commands.setServiceKey, 'Command')}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>

            {/* URL */}
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-1">SUPABASE_URL</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                  {commands.setUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(commands.setUrl, 'Command')}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>

            {/* Anon Key */}
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-medium mb-1">SUPABASE_ANON_KEY</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                  {commands.setAnonKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(commands.setAnonKey, 'Command')}
                >
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/settings/api`, '_blank')}
          >
            <ExternalLink className="size-4 mr-2" />
            Get API Keys from Dashboard
          </Button>
        </CardContent>
      </Card>

      {/* Quick Deployment Script */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="size-5" />
            Quick Deployment Script
          </CardTitle>
          <CardDescription>
            Run this script to deploy automatically (requires Supabase CLI)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-xs">
{`#!/bin/bash
# Make the script executable
chmod +x deploy-edge-function.sh

# Run the deployment script
./deploy-edge-function.sh`}
            </pre>
          </div>
          <p className="text-sm text-gray-600">
            The deployment script is available at <code className="bg-gray-100 px-1 rounded">/deploy-edge-function.sh</code>
          </p>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>After Deployment</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Run the verification tests to confirm deployment</li>
            <li>Test the login functionality</li>
            <li>Verify protected endpoints are accessible</li>
            <li>Check the Edge Function logs if issues persist</li>
          </ol>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>📖 Need more help?</strong> Check{' '}
              <code className="bg-blue-100 px-1 rounded">/DEPLOY_EDGE_FUNCTION_NOW.md</code>{' '}
              for detailed instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
