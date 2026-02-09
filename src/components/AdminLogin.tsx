import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { Shield } from 'lucide-react';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Admin login attempt for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Admin login failed:', error.message);
        toast.error(`Login failed: ${error.message}`);
        return;
      }

      if (data.session && data.user) {
        console.log('✅ Login successful!');
        console.log('📝 Session:', {
          user: data.user.email,
          tokenPrefix: data.session.access_token?.substring(0, 30) + '...',
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
          metadata: data.user.user_metadata
        });
        
        // Wait a bit to ensure session is fully stored
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify the session is actually stored
        const { data: { session: verifySession } } = await supabase.auth.getSession();
        if (!verifySession) {
          console.error('❌ Session not found after login - storage issue');
          toast.error('Session error - please try again');
          return;
        }
        
        console.log('✅ Session verified in storage');
        
        // Check if user is admin
        const userMetadata = data.user.user_metadata;
        const isAdmin = userMetadata?.role === 'admin';
        
        console.log('👤 User role check:', { 
          metadata: userMetadata, 
          isAdmin,
          roleFromMetadata: userMetadata?.role 
        });
        
        if (isAdmin) {
          toast.success('Admin login successful!');
          console.log('✅ Admin verified, redirecting to dashboard...');
          // Give a moment for toast to show
          await new Promise(resolve => setTimeout(resolve, 500));
          navigate('/');
        } else {
          console.error('❌ User is not an admin');
          toast.error('Access denied: This account is not an admin.');
          await supabase.auth.signOut();
        }
      } else {
        console.error('❌ No session or user data returned');
        toast.error('Login failed - no session created');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error(`Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Admin Login Card */}
        <Card className="w-full border-2 border-purple-500/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-lg shadow-lg">
                <Shield className="size-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-center">
              Secure admin access to ERP System
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  🔒 <strong>Secure Access:</strong> This portal is restricted to authorized administrators only.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Admin Login'}
              </Button>
              <div className="text-center text-sm space-y-2">
                <Link
                  to="/login"
                  className="text-purple-600 hover:text-purple-800 hover:underline"
                >
                  ← Back to Regular Login
                </Link>
                <div className="text-xs text-gray-500 mt-2">
                  Need admin access? Contact system administrator.
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}