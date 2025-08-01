import { describe, it, expect } from 'vitest';

describe('Basic Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('hello');
    expect(result).toBe('hello');
  });

  it('should work with JSON operations', () => {
    const obj = { name: 'test', value: 42 };
    const json = JSON.stringify(obj);
    const parsed = JSON.parse(json);
    
    expect(parsed.name).toBe('test');
    expect(parsed.value).toBe(42);
  });
});