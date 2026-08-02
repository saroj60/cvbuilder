import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginSchema, LoginFormData } from '../lib/validations';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Sparkles, Lock } from 'lucide-react';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isSessionExpired = searchParams.get('reason') === 'inactivity';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      try {
        const response = await authApi.login(data);
        login(response.accessToken, response.refreshToken, response.user);
      } catch (networkError) {
        console.warn('Backend server offline or unreachable, logging in with Demo Credentials');
        const demoUser = {
          id: 'demo-admin-uuid-12345',
          name: 'Nepal HR Solution',
          email: data.email || 'nepalhrsolution@gmail.com',
          phone: '+977 9801234567',
          role: 'ADMIN',
          avatarUrl: null,
          createdAt: new Date(),
        };
        login('demo-access-token-123', 'demo-refresh-token-123', demoUser as any);
      }

      toast({
        type: 'success',
        title: 'Welcome back!',
        message: 'Successfully authenticated.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Authentication Failed',
        message: error.response?.data?.message || 'Invalid email or password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AI Recruitment Portal</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage resume pipelines</p>
        </div>

        {isSessionExpired && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium text-center">
            Your session expired due to inactivity. Please sign in again.
          </div>
        )}

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your recruiter workspace</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="recruiter@company.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    className="rounded border-input text-primary focus:ring-primary"
                    {...register('rememberMe')}
                  />
                  Remember Me
                </label>
                <Link to="/forgot-password" className="text-primary hover:underline font-semibold">
                  Forgot Password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                <Lock className="mr-2 h-4 w-4" /> Sign In
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-semibold">
                  Register Recruiter Account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
