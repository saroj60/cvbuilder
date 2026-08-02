import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterFormData } from '../lib/validations';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Sparkles, UserPlus } from 'lucide-react';

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      roleName: 'RECRUITER',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      login(response.accessToken, response.refreshToken, response.user);
      toast({
        type: 'success',
        title: 'Account Created',
        message: 'Welcome to the Resume builder!',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Registration Failed',
        message: error.response?.data?.message || 'Could not complete registration.',
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
          <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-sm text-muted-foreground">Get started with AI-driven candidate ranking</p>
        </div>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Fill in details to set up your hiring manager workspace</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Sarah Connor"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="sarah@company.com"
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                <UserPlus className="mr-2 h-4 w-4" /> Create Account
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Already registered?{' '}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
