import React, { useState, useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundaryProps } from "@/types/trip-wizard";

export function StepErrorBoundary({ children, onRetry }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(new Error(event.message));
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setError(new Error(event.reason?.toString() || 'Promise rejection'));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setError(null);
    onRetry?.();
  };

  if (hasError) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <CardTitle className="mb-2">Something went wrong</CardTitle>
        <CardDescription className="mb-4">
          We encountered an error while loading this step. Please try again.
        </CardDescription>
        
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mb-4 text-left bg-slate-50 p-4 rounded-md">
            <summary className="cursor-pointer text-sm font-medium text-slate-700 mb-2">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-slate-600 whitespace-pre-wrap break-words">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <Button 
          onClick={handleRetry}
          className="w-full sm:w-auto"
          variant="outline"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </Card>
    );
  }

  return <>{children}</>;
}