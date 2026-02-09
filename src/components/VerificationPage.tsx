import { Link } from 'react-router';
import { JWTFixVerification } from './JWTFixVerification';
import { DeploymentInstructions } from './DeploymentInstructions';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, CheckCircle, Rocket } from 'lucide-react';

export function VerificationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Login
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">JWT Fix Verification & Deployment</h1>
            <p className="text-gray-600">Verify the authentication fix and deploy to production</p>
          </div>
        </div>

        {/* Tabs for Verification and Deployment */}
        <Tabs defaultValue="deploy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deploy" className="flex items-center gap-2">
              <Rocket className="size-4" />
              Deployment Instructions
            </TabsTrigger>
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <CheckCircle className="size-4" />
              Verification Tests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="deploy" className="mt-6">
            <DeploymentInstructions />
          </TabsContent>
          
          <TabsContent value="verify" className="mt-6">
            <div className="space-y-6">
              <JWTFixVerification />
              
              {/* What to Expect */}
              <div className="p-6 bg-white rounded-lg border">
                <h3 className="font-semibold mb-3">✅ What to Expect After Deployment</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>All tests above should show <strong className="text-green-600">Pass</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Login will work without being immediately logged out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Dashboard and all protected routes will be accessible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>No "Invalid JWT" errors in browser console</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Edge Function logs will show successful authentication</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}