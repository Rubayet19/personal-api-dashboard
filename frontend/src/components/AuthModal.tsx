import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { login, signup } from '../lib/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from './ui/dialog';
import { X } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Signup form schema
const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Reset the form mode when the modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLogin(defaultMode === 'login');
      setError(null);
    }
  }, [isOpen, defaultMode]);

  // Login form handler
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Signup form handler
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Handle login submission
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await login(data);
      onOpenChange(false);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup submission
  const onSignupSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newUser = await signup({
        email: data.email,
        password: data.password
      });
      
      console.log('Signup successful:', newUser);
      
      // The login is now handled automatically in the signup function
      onOpenChange(false);
      navigate('/dashboard');
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </div>
        
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <div className="mt-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="mt-2 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    {...signupForm.register('email')}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-600">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    {...signupForm.register('password')}
                  />
                  {signupForm.formState.errors.password && (
                    <p className="mt-2 text-sm text-red-600">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    {...signupForm.register('confirmPassword')}
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button 
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.08L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.075C15.0054 18.815 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 