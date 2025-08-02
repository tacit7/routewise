/**
 * Advanced TypeScript types for API integration and data engineering
 * Provides type safety, validation, and utility types for RouteWise frontend
 */

import type { UserInterest, InterestCategory, SuggestedTrip } from './interests';

/**
 * Generic API response wrapper
 */
export interface APIResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * API error response structure
 */
export interface APIErrorResponse {
  message: string;
  errors?: string[];
  code?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * API request status types
 */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Cache status types
 */
export type CacheStatus = 'fresh' | 'stale' | 'expired' | 'missing';

/**
 * API client configuration
 */
export interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  cacheTTL: number;
}

/**
 * Request metadata for monitoring and debugging
 */
export interface RequestMetadata {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  duration?: number;
  status?: number;
  cached?: boolean;
  retryCount?: number;
}

/**
 * Advanced utility types for data manipulation
 */

/**
 * Make specific properties optional while keeping others required
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required while keeping others optional
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract properties that are functions
 */
export type FunctionProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Extract properties that are not functions
 */
export type NonFunctionProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];

/**
 * Create a type with only the data properties (no functions)
 */
export type DataOnly<T> = Pick<T, NonFunctionProperties<T>>;

/**
 * Create a type with only the function properties
 */
export type ActionsOnly<T> = Pick<T, FunctionProperties<T>>;

/**
 * Recursive partial type that makes all nested properties optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Recursive required type that makes all nested properties required
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Type-safe event handler signatures
 */
export type EventHandler<T = void> = (data: T) => void;
export type AsyncEventHandler<T = void> = (data: T) => Promise<void>;

/**
 * Generic loading state wrapper
 */
export interface LoadingState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated?: number;
}

/**
 * Optimistic update state
 */
export interface OptimisticState<T> {
  current: T;
  optimistic: T | null;
  isPending: boolean;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
  tags?: string[];
}

/**
 * Query result with enhanced metadata
 */
export interface QueryResult<T> extends LoadingState<T> {
  status: RequestStatus;
  cacheStatus: CacheStatus;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Mutation result with optimistic updates
 */
export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  error: Error | null;
  isLoading: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

/**
 * Type-safe API client interface
 */
export interface APIClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

/**
 * Request configuration options
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Validation result with detailed error information
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Data transformer interface
 */
export interface DataTransformer<TInput, TOutput> {
  transform(input: TInput): TOutput;
  validate(input: unknown): ValidationResult<TInput>;
  sanitize(input: TInput): TInput;
}

/**
 * Performance monitoring types
 */
export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  slowestRequests: RequestMetadata[];
}

/**
 * Real-time sync configuration
 */
export interface SyncConfig {
  enabled: boolean;
  interval: number;
  conflictResolution: 'client' | 'server' | 'merge';
  retryPolicy: RetryPolicy;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

/**
 * Type guards for runtime type checking
 */
export function isAPIResponse<T>(value: unknown): value is APIResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'timestamp' in value
  );
}

export function isAPIErrorResponse(value: unknown): value is APIErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'timestamp' in value
  );
}

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return (
    isAPIResponse(value) &&
    'pagination' in value &&
    Array.isArray((value as any).data)
  );
}

/**
 * Utility function to create type-safe API endpoints
 */
export function createEndpoint<TParams = void, TResponse = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string
) {
  return {
    method,
    path,
    call: (params: TParams extends void ? void : TParams): Promise<TResponse> => {
      throw new Error('Endpoint not implemented');
    }
  };
}

/**
 * Hook return type utility
 */
export type HookReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * Extract the data type from a LoadingState
 */
export type ExtractData<T> = T extends LoadingState<infer U> ? U : never;

/**
 * Create union type from array of strings
 */
export type ArrayToUnion<T extends ReadonlyArray<string>> = T[number];

/**
 * Conditional type based on environment
 */
export type EnvironmentType = 'development' | 'staging' | 'production';

/**
 * Feature flag configuration
 */
export interface FeatureFlags {
  optimisticUpdates: boolean;
  performanceMonitoring: boolean;
  advancedCaching: boolean;
  errorReporting: boolean;
  realTimeSync: boolean;
}

/**
 * Enhanced type for interests-specific API operations
 */
export interface InterestsAPIOperations {
  getCategories: () => Promise<InterestCategory[]>;
  getUserInterests: (userId: number) => Promise<UserInterest[]>;
  updateUserInterests: (userId: number, interests: Partial<UserInterest>[]) => Promise<UserInterest[]>;
  getSuggestedTrips: (userId: number, limit?: number) => Promise<SuggestedTrip[]>;
  toggleInterest: (userId: number, categoryId: number, enabled: boolean) => Promise<UserInterest[]>;
  batchUpdateInterests: (userId: number, updates: Array<{categoryId: number; enabled: boolean}>) => Promise<UserInterest[]>;
}

/**
 * Type-safe storage interface
 */
export interface StorageAdapter<T = unknown> {
  get(key: string): T | null;
  set(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
  keys(): string[];
  size(): number;
}

/**
 * Cross-tab synchronization types
 */
export interface SyncEvent<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
  source: string;
}

export interface SyncListener<T = unknown> {
  (event: SyncEvent<T>): void;
}

/**
 * Error boundary types
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

/**
 * Advanced React hook types
 */
export type UseAsyncState<T> = [
  LoadingState<T>,
  {
    execute: (...args: any[]) => Promise<void>;
    reset: () => void;
  }
];

export type UseOptimisticState<T> = [
  OptimisticState<T>,
  {
    update: (updater: (current: T) => T) => void;
    commit: () => void;
    rollback: () => void;
    setPending: (pending: boolean) => void;
  }
];

/**
 * Configuration for data engineering hooks
 */
export interface DataEngineConfig {
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  optimisticUpdates: {
    enabled: boolean;
    timeout: number;
    maxRetries: number;
  };
  realTimeSync: {
    enabled: boolean;
    interval: number;
    conflictResolution: 'client' | 'server' | 'merge';
  };
  performance: {
    monitoring: boolean;
    slowQueryThreshold: number;
    errorTracking: boolean;
  };
}

/**
 * Export commonly used type combinations
 */
export type StandardAPIResponse<T> = Promise<APIResponse<T>>;
export type StandardQueryResult<T> = QueryResult<T>;
export type StandardMutationResult<TData, TVariables = void> = MutationResult<TData, TVariables>;