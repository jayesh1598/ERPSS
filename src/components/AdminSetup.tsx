import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8eebe9eb`;

export function AdminSetup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Creating admin user...');
      
      const response = await fetch(`${API_BASE}/auth/init-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes('already exists')) {
          toast.error('Admin account already exists. Please use the admin login page.');
          setTimeout(() => navigate('/admin-login'), 2000);
        } else {
          toast.error(result.error || 'Failed to create admin account');
        }
        return;
      }

      console.log('✅ Admin created successfully:', result);
      toast.success('Admin account created successfully!');
      setSetupComplete(true);
      
      // Redirect to admin login after 2 seconds
      setTimeout(() => {
        navigate('/admin-login');
      }, 2000);
    } catch (error: any) {
      console.error('Admin setup error:', error);
      toast.error(`Setup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-md border-2 border-green-500/20 shadow-2xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-500 p-4 rounded-full">
                  <CheckCircle className="size-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-600">Setup Complete!</h2>
              <p className="text-gray-600">
                Admin account has been created successfully.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to admin login...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full border-2 border-purple-500/20 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-lg shadow-lg">
                <Shield className="size-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
              Admin Setup
            </CardTitle>
            <CardDescription className="text-center">
              Create the main administrator account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSetup}>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-800 font-medium">
                    First-time setup
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This page creates the first admin account. It can only be used once.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="border-purple-200 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️ <strong>Important:</strong> Keep these credentials secure. The admin has full access to all system features.
                </p>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={loading}
              >
                {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
              </Button>
              
              <div className="text-center mt-4">
                <Link
                  to="/admin-login"
                  className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
                >
                  Already have an admin account? Login here
                </Link>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
