import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LoginForm } from '@/components/login-form';
import { RegisterForm } from '@/components/register-form';
import { useAuth } from '@/components/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, setLocation]);

  // Don't render anything while checking auth or if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleLoginSuccess = () => {
    // LoginForm handles navigation internally
  };

  const handleRegisterSuccess = () => {
    // Switch to login tab after successful registration
    setActiveTab('login');
  };

  const handleSwitchToRegister = () => {
    setActiveTab('register');
  };

  const handleSwitchToLogin = () => {
    setActiveTab('login');
  };

  const handleBackToHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold text-lg text-gray-900">RouteWise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account or create a new one
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <div className="text-center">
                <CardTitle className="text-xl">Get Started</CardTitle>
                <CardDescription>
                  Choose your preferred sign-in method
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" className="text-sm">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-sm">
                    Create Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6 space-y-4">
                  <LoginForm
                    onSwitchToRegister={handleSwitchToRegister}
                    onSuccess={handleLoginSuccess}
                  />
                </TabsContent>

                <TabsContent value="register" className="mt-6 space-y-4">
                  <RegisterForm
                    onSwitchToLogin={handleSwitchToLogin}
                    onSuccess={handleRegisterSuccess}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By signing in, you agree to our{' '}
              <button className="underline hover:text-gray-700 transition-colors">
                Terms of Service
              </button>{' '}
              and{' '}
              <button className="underline hover:text-gray-700 transition-colors">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}