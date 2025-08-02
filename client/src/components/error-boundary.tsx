import React, { Component, ErrorInfo, ReactNode } from 'react';
import { performanceMonitor } from '@/lib/performance-monitor';
import { userPreferences } from '@/lib/user-preferences';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  lastErrorTime: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  maxRetries?: number;
  retryDelay?: number;
  isolate?: boolean; // Prevent error from bubbling up
  level?: 'page' | 'section' | 'component';
}

/**
 * Enhanced error boundary with retry logic, error reporting, and graceful degradation
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    const { onError, level = 'component' } = this.props;

    // Record performance metric
    performanceMonitor.recordMetric(
      `error-boundary-${level}`,
      0,
      'component',
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId,
        retryCount: this.state.retryCount,
      }
    );

    // Store error info
    this.setState({ errorInfo });

    // Call custom error handler
    if (onError && errorId) {
      try {
        onError(error, errorInfo, errorId);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // Log error with context
    this.logError(error, errorInfo, errorId);

    // Report to external service if configured
    this.reportError(error, errorInfo, errorId);
  }

  private logError(error: Error, errorInfo: ErrorInfo, errorId: string | null) {
    const { level = 'component' } = this.props;
    
    console.group(`🚨 Error Boundary (${level}) - ${errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Add user context
    try {
      const preferences = userPreferences.getPreferences();
      console.info('User Context:', {
        isFirstVisit: preferences.isFirstVisit,
        hasSelectedInterests: preferences.lastSelectedInterests.length > 0,
        storageHealth: userPreferences.getStorageHealth(),
      });
    } catch (contextError) {
      console.warn('Failed to get user context:', contextError);
    }

    // Add performance context
    try {
      const perfSummary = performanceMonitor.getPerformanceSummary();
      console.info('Performance Context:', perfSummary);
    } catch (perfError) {
      console.warn('Failed to get performance context:', perfError);
    }

    console.groupEnd();
  }

  private reportError(error: Error, errorInfo: ErrorInfo, errorId: string | null) {
    // In a real app, you would send this to an error reporting service
    // like Sentry, Bugsnag, or your own logging service
    
    const errorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level,
      retryCount: this.state.retryCount,
    };

    // Example: Send to error reporting service
    // errorReportingService.report(errorReport);
    
    console.info('Error report prepared:', errorReport);
  }

  private retry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('Maximum retries reached, not retrying');
      return;
    }

    performanceMonitor.recordMetric(
      'error-boundary-retry',
      retryDelay,
      'user-action',
      {
        retryCount: retryCount + 1,
        errorId: this.state.errorId,
      }
    );

    // Clear any existing retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    // Delay the retry to prevent rapid fire retries
    this.retryTimer = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: retryCount + 1,
      });
    }, retryDelay);
  };

  private isRapidRetry(): boolean {
    const { lastErrorTime } = this.state;
    const now = Date.now();
    return now - lastErrorTime < 5000; // Less than 5 seconds
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, maxRetries = 3, level = 'component' } = this.props;

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo, this.retry);
      }

      // Default fallback UI based on level
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          retry={this.retry}
          retryCount={retryCount}
          maxRetries={maxRetries}
          level={level}
          canRetry={retryCount < maxRetries && !this.isRapidRetry()}
        />
      );
    }

    return children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  retry: () => void;
  retryCount: number;
  maxRetries: number;
  level: string;
  canRetry: boolean;
}

/**
 * Default error fallback component with contextual messaging
 */
function ErrorFallback({ 
  error, 
  errorInfo, 
  retry, 
  retryCount, 
  maxRetries, 
  level, 
  canRetry 
}: ErrorFallbackProps) {
  const isPageLevel = level === 'page';
  const isSectionLevel = level === 'section';

  const getMessage = () => {
    if (isPageLevel) {
      return "We're having trouble loading this page.";
    }
    if (isSectionLevel) {
      return "This section couldn't load properly.";
    }
    return "Something went wrong with this component.";
  };

  const getSubMessage = () => {
    if (retryCount > 0) {
      return `We've tried ${retryCount} time${retryCount > 1 ? 's' : ''} to fix this.`;
    }
    return "This is usually temporary and can be fixed by trying again.";
  };

  return (
    <div className={`error-boundary ${level}`} role="alert">
      <div className="error-content">
        <div className="error-icon">
          {isPageLevel ? '🚫' : isSectionLevel ? '⚠️' : '❌'}
        </div>
        
        <div className="error-message">
          <h2>{getMessage()}</h2>
          <p>{getSubMessage()}</p>
          
          {error.message && (
            <details className="error-details">
              <summary>Technical Details</summary>
              <pre>{error.message}</pre>
              {process.env.NODE_ENV === 'development' && (
                <pre>{error.stack}</pre>
              )}
            </details>
          )}
        </div>

        <div className="error-actions">
          {canRetry && (
            <button
              onClick={retry}
              className="retry-button"
              disabled={!canRetry}
            >
              Try Again ({maxRetries - retryCount} attempts left)
            </button>
          )}
          
          {isPageLevel && (
            <button
              onClick={() => window.location.reload()}
              className="reload-button"
            >
              Reload Page
            </button>
          )}
          
          <button
            onClick={() => window.history.back()}
            className="back-button"
          >
            Go Back
          </button>
        </div>
      </div>

      <style jsx>{`
        .error-boundary {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          padding: 2rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .error-boundary.page {
          min-height: 400px;
          margin: 0;
        }

        .error-content {
          text-align: center;
          max-width: 500px;
        }

        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .error-message h2 {
          color: #dc2626;
          margin-bottom: 0.5rem;
        }

        .error-message p {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .error-details {
          text-align: left;
          margin: 1rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 4px;
        }

        .error-details pre {
          font-size: 0.875rem;
          color: #374151;
          overflow-x: auto;
        }

        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .error-actions button {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-button {
          background: #3b82f6 !important;
          color: white !important;
          border-color: #3b82f6 !important;
        }

        .retry-button:hover:not(:disabled) {
          background: #2563eb !important;
        }

        .retry-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reload-button:hover {
          background: #f3f4f6;
        }

        .back-button:hover {
          background: #f3f4f6;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook for error handling with automatic boundary integration
 */
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, errorInfo?: Partial<ErrorInfo>) => {
    // Record the error for monitoring
    performanceMonitor.recordMetric(
      'manual-error',
      0,
      'user-action',
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
      }
    );

    // Log the error
    console.error('Manual error reported:', error);
    
    // In development, show the error
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
  }, []);

  const wrapAsync = React.useCallback(<T>(
    asyncFn: () => Promise<T>,
    fallback?: T
  ): Promise<T> => {
    return asyncFn().catch((error) => {
      handleError(error);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    });
  }, [handleError]);

  return { handleError, wrapAsync };
}

/**
 * Higher-order component for automatic error boundary wrapping
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorBoundary;