import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../lib/validations';
import { authApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
      if (response.resetToken) {
        setDevResetToken(response.resetToken);
      }
      toast({
        type: 'success',
        title: 'Request Processed',
        message: response.message || 'Check your email for reset instructions.',
      });
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Request Failed',
        message: error.response?.data?.message || 'Could not process request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card className="border shadow-lg">
          <CardHeader>
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              Enter your registered email address to receive a password reset link
            </CardDescription>
          </CardHeader>

          {isSubmitted ? (
            <CardContent className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium">Reset instructions sent!</p>
              {devResetToken && (
                <div className="p-3 bg-muted rounded border text-xs text-left space-y-2">
                  <p className="font-semibold text-primary">Development Reset Token:</p>
                  <p className="break-all font-mono text-[10px] text-muted-foreground">{devResetToken}</p>
                  <Link
                    to={`/reset-password?token=${devResetToken}`}
                    className="inline-block mt-2 text-primary underline font-bold"
                  >
                    Click to Reset Password directly
                  </Link>
                </div>
              )}
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="recruiter@company.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Send Reset Link
                </Button>
                <Link to="/login" className="text-xs text-center text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
