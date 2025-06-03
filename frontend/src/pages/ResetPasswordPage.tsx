import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPassword } from '../lib/auth';
import { useToast } from '../lib/hooks/use-toast';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

// Form validation schema
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Extract token and email from URL parameters
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Validate token and email on component mount
  useEffect(() => {
    if (!token || !email) {
      setTokenError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token || !email) {
      setTokenError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword({ email, token, new_password: data.newPassword }); // Pass as a single object
      setIsSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Check for specific error types
      if (errorMessage.includes('Invalid token') || errorMessage.includes('expired')) {
        setTokenError('This reset link is invalid or has expired. Please request a new password reset.');
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show error state for invalid token
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {tokenError}
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Request new reset link
            </Link>
            
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
          
          <h2 className="text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1">
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                placeholder="Enter your new password"
                {...form.register('newPassword')}
              />
              {form.formState.errors.newPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                placeholder="Confirm your new password"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting password...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 