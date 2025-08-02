/**
 * Comprehensive type guards for runtime type checking
 * Provides safe type narrowing for API responses and user data
 */

import type {
  InterestCategory,
  UserInterest,
  SuggestedTrip,
  FrontendInterestCategory,
  FrontendSuggestedTrip,
  UserPreferences,
} from '@/types/interests';

import type {
  APIResponse,
  APIErrorResponse,
  PaginatedResponse,
  ValidationResult,
  LoadingState,
  OptimisticState,
} from '@/types/api';

/**
 * Basic type checking utilities
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * Interest-related type guards
 */
export function isInterestCategory(value: unknown): value is InterestCategory {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  return (
    isPositiveNumber(obj.id) &&
    isNonEmptyString(obj.name) &&
    isNonEmptyString(obj.displayName) &&
    isBoolean(obj.isActive) &&
    (obj.description === undefined || obj.description === null || isString(obj.description)) &&
    (obj.iconName === undefined || obj.iconName === null || isString(obj.iconName)) &&
    (obj.createdAt === undefined || isDate(new Date(obj.createdAt as string)))
  );
}

export function isFrontendInterestCategory(value: unknown): value is FrontendInterestCategory {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    isNonEmptyString(obj.imageUrl) &&
    (obj.description === undefined || obj.description === null || isString(obj.description))
  );
}

export function isUserInterest(value: unknown): value is UserInterest {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  return (
    isPositiveNumber(obj.id) &&
    isPositiveNumber(obj.userId) &&
    isPositiveNumber(obj.categoryId) &&
    isBoolean(obj.isEnabled) &&
    isNonNegativeNumber(obj.priority) &&
    isDate(new Date(obj.createdAt as string)) &&
    isDate(new Date(obj.updatedAt as string)) &&
    isInterestCategory(obj.category)
  );
}

export function isSuggestedTrip(value: unknown): value is SuggestedTrip {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    isNonEmptyString(obj.description) &&
    isNonEmptyString(obj.startCity) &&
    isNonEmptyString(obj.endCity) &&
    isNumber(obj.score) &&
    obj.score >= 0 &&
    obj.score <= 100 &&
    isArray(obj.pois) &&
    (obj.estimatedDuration === undefined || isString(obj.estimatedDuration)) &&
    (obj.estimatedDistance === undefined || isString(obj.estimatedDistance)) &&
    (obj.matchingInterests === undefined || (isArray(obj.matchingInterests) && 
      (obj.matchingInterests as unknown[]).every(isString))) &&
    (obj.imageUrl === undefined || isString(obj.imageUrl))
  );
}

export function isFrontendSuggestedTrip(value: unknown): value is FrontendSuggestedTrip {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    isNonEmptyString(obj.description) &&
    isNonEmptyString(obj.imageUrl) &&
    isNonEmptyString(obj.duration) &&
    isArray(obj.highlights) &&
    (obj.highlights as unknown[]).every(isString) &&
    (obj.difficulty === undefined || ['easy', 'moderate', 'challenging'].includes(obj.difficulty as string)) &&
    isNonEmptyString(obj.startLocation) &&
    isNonEmptyString(obj.endLocation)
  );
}

export function isUserPreferences(value: unknown): value is UserPreferences {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  return (
    isBoolean(obj.isFirstVisit) &&
    isArray(obj.lastSelectedInterests) &&
    (obj.lastSelectedInterests as unknown[]).every(isString) &&
    (obj.suggestedTripsCache === undefined || isObject(obj.suggestedTripsCache))
  );
}

/**
 * API response type guards
 */
export function isAPIResponse<T>(value: unknown, dataGuard?: (data: unknown) => data is T): value is APIResponse<T> {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  const basicStructure = (
    'data' in obj &&
    isNonEmptyString(obj.timestamp) &&
    (obj.message === undefined || isString(obj.message)) &&
    (obj.requestId === undefined || isString(obj.requestId))
  );

  if (!basicStructure) return false;

  // If a data guard is provided, use it to validate the data
  if (dataGuard) {
    return dataGuard(obj.data);
  }

  return true;
}

export function isAPIErrorResponse(value: unknown): value is APIErrorResponse {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  return (
    isNonEmptyString(obj.message) &&
    isNonEmptyString(obj.timestamp) &&
    (obj.errors === undefined || (isArray(obj.errors) && (obj.errors as unknown[]).every(isString))) &&
    (obj.code === undefined || isString(obj.code)) &&
    (obj.requestId === undefined || isString(obj.requestId))
  );
}

export function isPaginatedResponse<T>(
  value: unknown, 
  dataGuard?: (data: unknown) => data is T
): value is PaginatedResponse<T> {
  if (!isAPIResponse(value)) return false;

  const obj = value as Record<string, unknown>;
  
  if (!('pagination' in obj) || !isObject(obj.pagination)) return false;

  const pagination = obj.pagination as Record<string, unknown>;
  const paginationValid = (
    isPositiveNumber(pagination.page) &&
    isPositiveNumber(pagination.limit) &&
    isNonNegativeNumber(pagination.total) &&
    isBoolean(pagination.hasNext) &&
    isBoolean(pagination.hasPrev)
  );

  if (!paginationValid) return false;

  if (!isArray(obj.data)) return false;

  // If a data guard is provided, validate each item in the array
  if (dataGuard) {
    return (obj.data as unknown[]).every(dataGuard);
  }

  return true;
}

/**
 * Utility type guards
 */
export function isValidationResult<T>(
  value: unknown,
  dataGuard?: (data: unknown) => data is T
): value is ValidationResult<T> {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  const basicStructure = (
    isBoolean(obj.isValid) &&
    isArray(obj.errors)
  );

  if (!basicStructure) return false;

  // Validate error structure
  const errorsValid = (obj.errors as unknown[]).every(error => {
    return isObject(error) && 
           isNonEmptyString((error as any).field) &&
           isNonEmptyString((error as any).message) &&
           isNonEmptyString((error as any).code);
  });

  if (!errorsValid) return false;

  // If valid and data guard provided, validate data
  if (obj.isValid && dataGuard && obj.data !== undefined) {
    return dataGuard(obj.data);
  }

  return true;
}

export function isLoadingState<T>(
  value: unknown,
  dataGuard?: (data: unknown) => data is T
): value is LoadingState<T> {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  const basicStructure = (
    isBoolean(obj.isLoading) &&
    (obj.error === null || obj.error instanceof Error) &&
    (obj.lastUpdated === undefined || isNumber(obj.lastUpdated))
  );

  if (!basicStructure) return false;

  // If data guard provided and data exists, validate it
  if (dataGuard && obj.data !== null) {
    return dataGuard(obj.data);
  }

  return true;
}

export function isOptimisticState<T>(
  value: unknown,
  dataGuard?: (data: unknown) => data is T
): value is OptimisticState<T> {
  if (!isObject(value)) return false;

  const obj = value as Record<string, unknown>;
  
  const basicStructure = (
    isBoolean(obj.isPending) &&
    'current' in obj &&
    'optimistic' in obj
  );

  if (!basicStructure) return false;

  // If data guard provided, validate current and optimistic data
  if (dataGuard) {
    const currentValid = dataGuard(obj.current);
    const optimisticValid = obj.optimistic === null || dataGuard(obj.optimistic);
    return currentValid && optimisticValid;
  }

  return true;
}

/**
 * Array type guards
 */
export function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return isArray(value) && value.every(itemGuard);
}

export function isNonEmptyArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is [T, ...T[]] {
  return isArrayOf(value, itemGuard) && value.length > 0;
}

/**
 * Conditional type guards
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function hasRequiredProperty<K extends string, T>(
  obj: unknown,
  key: K,
  guard: (value: unknown) => value is T
): obj is Record<K, T> {
  return hasProperty(obj, key) && guard(obj[key]);
}

/**
 * Safe parsing utilities with type guards
 */
export function safeParseJSON<T>(
  json: string,
  guard: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function safeGet<T>(
  obj: unknown,
  path: string,
  guard: (value: unknown) => value is T
): T | null {
  if (!isObject(obj)) return null;

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (!isObject(current) || !(key in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return guard(current) ? current : null;
}

/**
 * Assertion functions for development/debugging
 */
export function assertIsInterestCategory(value: unknown): asserts value is InterestCategory {
  if (!isInterestCategory(value)) {
    throw new Error('Value is not a valid InterestCategory');
  }
}

export function assertIsUserInterest(value: unknown): asserts value is UserInterest {
  if (!isUserInterest(value)) {
    throw new Error('Value is not a valid UserInterest');
  }
}

export function assertIsSuggestedTrip(value: unknown): asserts value is SuggestedTrip {
  if (!isSuggestedTrip(value)) {
    throw new Error('Value is not a valid SuggestedTrip');
  }
}

/**
 * Type narrowing utilities
 */
export function narrowToString(value: unknown): string {
  if (isString(value)) return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export function narrowToNumber(value: unknown, fallback: number = 0): number {
  if (isNumber(value)) return value;
  const parsed = Number(value);
  return isNaN(parsed) ? fallback : parsed;
}

export function narrowToArray<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T,
  fallback: T[] = []
): T[] {
  if (isArrayOf(value, itemGuard)) return value;
  return fallback;
}

/**
 * Development-only type checking (removed in production)
 */
export function devOnlyTypeCheck<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): T {
  if (process.env.NODE_ENV === 'development') {
    if (!guard(value)) {
      console.error(errorMessage, value);
      throw new Error(errorMessage);
    }
  }
  return value as T;
}