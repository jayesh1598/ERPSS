import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../lib/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { Building2 } from 'lucide-react';
import { Shield } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Attempting Supabase login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login failed:', error.message);
        toast.error(`Login failed: ${error.message}`);
        return;
      }

      if (data.session) {
        console.log('✅ Login successful! Session:', {
          user: data.user?.email,
          token: data.session.access_token?.substring(0, 20) + '...',
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString()
        });
        
        toast.success('Login successful!');
        
        // Wait a bit to ensure session is fully stored
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify session is accessible
        const { data: { session: verifySession } } = await supabase.auth.getSession();
        if (verifySession) {
          console.log('✅ Session verified, navigating to dashboard...');
          navigate('/');
        } else {
          console.error('❌ Session not found after login');
          toast.error('Session error - please try logging in again');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(`Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Building2 className="size-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Enterprise ERP</CardTitle>
            <CardDescription className="text-center">
              Manufacturing Management System
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              <div className="space-y-2 w-full">
                <p className="text-sm text-center text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>
                </p>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>
                <Link to="/admin-login">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Shield className="size-4 mr-2" />
                    Admin Login
                  </Button>
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}