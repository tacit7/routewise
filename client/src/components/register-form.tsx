import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { GoogleSignInButton } from './google-signin-button';
import { useAuth } from './auth-context';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

interface PasswordRequirement {
  text: string;
  met: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register, isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Password requirements
  const passwordRequirements: PasswordRequirement[] = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { text: 'Contains number', met: /\d/.test(formData.password) },
  ];

  const usernameValid = formData.username.length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const passwordValid = passwordRequirements.every(req => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const formValid = usernameValid && emailValid && passwordValid && passwordsMatch;

  // Effect to handle redirect after authentication
  useEffect(() => {
    if (shouldRedirect && isAuthenticated && user) {
      console.log('Redirecting to dashboard after registration');
      setLocation('/dashboard');
      setShouldRedirect(false);
    }
  }, [shouldRedirect, isAuthenticated, user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formValid) {
      setError('Please fix the form errors before submitting');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await register(formData.username, formData.password, formData.email);
      
      if (result.success) {
        onSuccess?.();
        // Set flag to trigger redirect when auth state updates
        setShouldRedirect(true);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Google Sign-In */}
      <GoogleSignInButton 
        text="Sign up with Google"
        disabled={isLoading}
      />
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2 text-muted-fg">Or create account with</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            autoComplete="username"
            className={`w-full ${formData.username && !usernameValid ? 'border-red-300' : ''}`}
          />
          {formData.username.length > 0 && (
            <p className={`text-xs flex items-center gap-1 ${usernameValid ? 'text-green-600' : 'text-red-500'}`}>
              {usernameValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              At least 3 characters
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            autoComplete="email"
            className={`w-full ${formData.email && !emailValid ? 'border-red-300' : ''}`}
          />
          {formData.email.length > 0 && (
            <p className={`text-xs flex items-center gap-1 ${emailValid ? 'text-green-600' : 'text-red-500'}`}>
              {emailValid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Valid email address
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              required
              autoComplete="new-password"
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-fg hover:text-fg"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {formData.password.length > 0 && (
            <div className="space-y-1">
              {passwordRequirements.map((req, index) => (
                <p key={index} className={`text-xs flex items-center gap-1 ${req.met ? 'text-green-600' : 'text-red-500'}`}>
                  {req.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {req.text}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading}
              required
              autoComplete="new-password"
              className={`w-full pr-10 ${formData.confirmPassword && !passwordsMatch ? 'border-red-300' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-fg hover:text-fg"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {formData.confirmPassword.length > 0 && (
            <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
              {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              Passwords match
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !formValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      {onSwitchToLogin && (
        <div className="text-center">
          <p className="text-sm text-muted-fg">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-medium text-primary hover:text-primary/90 transition-colors"
              disabled={isLoading}
            >
              Sign in
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
