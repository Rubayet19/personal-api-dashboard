import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordReset } from '../lib/auth';
import { useToast } from '../lib/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    
    try {
      await requestPasswordReset({ email: data.email }); // Pass as an object
      setIsSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              If an account with that email exists, we've sent you a password reset link.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => setIsSubmitted(false)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
            
            <Link
              to="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                placeholder="Enter your email address"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.email.message}
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
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
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