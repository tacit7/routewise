import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form when not authenticated', async ({ page }) => {
    // Check if login/register forms are visible for unauthenticated users
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByText('Create Account')).toBeVisible();
  });

  test('should show Google OAuth sign-in button', async ({ page }) => {
    // Look for Google sign-in button
    const googleSignInButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(googleSignInButton).toBeVisible();
  });

  test('should validate login form inputs', async ({ page }) => {
    // Test form validation
    const usernameInput = page.getByLabel(/username/i);
    const passwordInput = page.getByLabel(/password/i);
    const loginButton = page.getByRole('button', { name: /sign in/i });

    // Try to submit empty form
    await loginButton.click();
    
    // Should show validation errors
    await expect(page.getByText(/username.*required/i)).toBeVisible();
    await expect(page.getByText(/password.*required/i)).toBeVisible();
  });

  test('should handle login errors gracefully', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('[name="username"]', 'invaliduser');
    await page.fill('[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should switch between login and register forms', async ({ page }) => {
    // Start with login form
    await expect(page.getByText('Sign In')).toBeVisible();
    
    // Click to switch to register
    await page.getByText(/create account/i).click();
    await expect(page.getByText('Create Account')).toBeVisible();
    
    // Click to switch back to login
    await page.getByText(/sign in/i).click();
    await expect(page.getByText('Sign In')).toBeVisible();
  });

  test('should validate register form inputs', async ({ page }) => {
    // Switch to register form
    await page.getByText(/create account/i).click();
    
    const usernameInput = page.getByLabel(/username/i);
    const passwordInput = page.getByLabel(/password/i);
    const registerButton = page.getByRole('button', { name: /create account/i });

    // Test minimum length validation
    await usernameInput.fill('ab'); // Too short
    await passwordInput.fill('123'); // Too short
    await registerButton.click();
    
    await expect(page.getByText(/username.*3 characters/i)).toBeVisible();
    await expect(page.getByText(/password.*8 characters/i)).toBeVisible();
  });

  test('should persist authentication state on page reload', async ({ page }) => {
    // This test assumes we have a way to mock successful authentication
    // For now, we'll test the behavior when authentication token exists
    
    // Mock successful authentication by setting token in localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });
    
    await page.reload();
    
    // Should not show login forms
    await expect(page.getByText('Sign In')).not.toBeVisible();
  });

  test('should handle OAuth redirect parameters', async ({ page }) => {
    // Test OAuth success redirect
    await page.goto('/?oauth=success');
    await expect(page.getByText(/signed in successfully/i)).toBeVisible();
    
    // Test OAuth error redirect
    await page.goto('/?oauth=error');
    await expect(page.getByText(/authentication failed/i)).toBeVisible();
  });

  test('should log out user successfully', async ({ page }) => {
    // Mock authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
    });
    
    await page.reload();
    
    // Find and click logout button
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should return to login state
    await expect(page.getByText('Sign In')).toBeVisible();
    
    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('auth-token'));
    expect(token).toBeNull();
  });
});