import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { performanceMonitor } from "./performance-monitor";

/**
 * Enhanced error class with more context
 */
export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
    public method: string,
    message?: string
  ) {
    super(message || `${status}: ${statusText}`);
    this.name = 'APIError';
  }
}

async function throwIfResNotOk(res: Response, url: string, method: string) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new APIError(res.status, res.statusText, url, method, text);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const start = performance.now();
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    const duration = performance.now() - start;
    
    // Record performance metric
    performanceMonitor.recordMetric(
      `api-${method.toLowerCase()}-${url.replace(/[^a-zA-Z0-9]/g, '-')}`,
      duration,
      'api',
      {
        method,
        url,
        status: res.status,
        statusText: res.statusText,
        success: res.ok,
      }
    );

    await throwIfResNotOk(res, url, method);
    return res;
  } catch (error) {
    const duration = performance.now() - start;
    
    // Record error metric
    performanceMonitor.recordMetric(
      `api-${method.toLowerCase()}-${url.replace(/[^a-zA-Z0-9]/g, '-')}`,
      duration,
      'api',
      {
        method,
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }
    );

    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, url, 'GET');
    return await res.json();
  };

/**
 * Enhanced query client with performance monitoring and better error handling
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Enhanced retry logic with APIError support
        if (error instanceof APIError) {
          // Don't retry on client errors
          if (error.status >= 400 && error.status < 500) {
            performanceMonitor.recordMetric(
              'query-retry-skipped',
              0,
              'api',
              { status: error.status, url: error.url, reason: 'client-error' }
            );
            return false;
          }
        } else if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('401') || 
              errorMessage.includes('403') || 
              errorMessage.includes('404')) {
            return false;
          }
        }
        
        // Record retry attempt
        performanceMonitor.recordMetric(
          'query-retry-attempt',
          0,
          'api',
          { 
            attemptNumber: failureCount + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        );
        
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
        performanceMonitor.recordMetric(
          'query-retry-delay',
          delay,
          'api',
          { attemptIndex }
        );
        return delay;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Enhanced mutation retry with APIError support
        if (error instanceof APIError) {
          // Don't retry mutations on client errors (4xx)
          if (error.status >= 400 && error.status < 500) {
            performanceMonitor.recordMetric(
              'mutation-retry-skipped',
              0,
              'api',
              { status: error.status, url: error.url, reason: 'client-error' }
            );
            return false;
          }
        } else if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes('4')) {
            return false;
          }
        }
        
        // Record retry attempt
        performanceMonitor.recordMetric(
          'mutation-retry-attempt',
          0,
          'api',
          { 
            attemptNumber: failureCount + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        );
        
        // Retry once for server errors (5xx)
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});
