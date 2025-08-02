import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/login-form';
import { AuthProvider } from '@/components/auth-context';
import { server } from '../../setup';
import { http, HttpResponse } from 'msw';

// Mock the Google Sign In button component
vi.mock('@/components/google-signin-button', () => ({
  GoogleSignInButton: ({ text, disabled }: { text: string; disabled: boolean }) => (
    <button disabled={disabled} data-testid="google-signin-button">
      {text}
    </button>
  ),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Test wrapper with AuthProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('LoginForm', () => {
  const user = userEvent.setup();
  const mockOnSwitchToRegister = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth check to return unauthenticated state
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ success: false });
      })
    );
  });

  it('should render login form with all required elements', async () => {
    render(
      <TestWrapper>
        <LoginForm 
          onSwitchToRegister={mockOnSwitchToRegister}
          onSuccess={mockOnSuccess}
        />
      </TestWrapper>
    );

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Check form elements
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/create one/i)).toBeInTheDocument();
  });

  it('should handle form input changes', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
  });

  it('should toggle password visibility', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should disable submit button when fields are empty', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in$/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /sign in$/i });
    expect(submitButton).toBeDisabled();

    // Fill only username
    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'testuser');
    expect(submitButton).toBeDisabled();

    // Fill password too
    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'password123');
    expect(submitButton).not.toBeDisabled();
  });

  it('should handle successful login', async () => {
    server.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.json({
          success: true,
          user: { id: 1, username: 'testuser' }
        });
      })
    );

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in$/i }));

    // Should show loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    // Should call onSuccess callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle login failure', async () => {
    server.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.json({
          success: false,
          message: 'Invalid credentials'
        });
      })
    );

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText(/username/i), 'wronguser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in$/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    server.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.error();
      })
    );

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in$/i }));

    // Should show generic error message
    await waitFor(() => {
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('should clear error when user starts typing', async () => {
    server.use(
      http.post('/api/auth/login', () => {
        return HttpResponse.json({
          success: false,
          message: 'Invalid credentials'
        });
      })
    );

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill form and submit to trigger error
    await user.type(screen.getByLabelText(/username/i), 'wronguser');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in$/i }));

    // Error should be visible
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Type in username field
    await user.type(screen.getByLabelText(/username/i), 'x');

    // Error should be cleared
    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
  });

  it('should call onSwitchToRegister when create account link is clicked', async () => {
    render(
      <TestWrapper>
        <LoginForm onSwitchToRegister={mockOnSwitchToRegister} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/create one/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/create one/i));
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  it('should disable all inputs and buttons during loading', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise(resolve => {
      resolveLogin = resolve;
    });

    server.use(
      http.post('/api/auth/login', async () => {
        await loginPromise;
        return HttpResponse.json({
          success: true,
          user: { id: 1, username: 'testuser' }
        });
      })
    );

    render(
      <TestWrapper>
        <LoginForm onSwitchToRegister={mockOnSwitchToRegister} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in$/i }));

    // All form elements should be disabled during loading
    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    expect(screen.getByTestId('google-signin-button')).toBeDisabled();
    expect(screen.getByText(/create one/i)).toHaveParent().toBeDisabled();

    // Resolve the login promise
    resolveLogin!({ success: true });
  });

  it('should not render switch to register link when callback not provided', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/don't have an account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/create one/i)).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Check input attributes
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('autoComplete', 'username');
    expect(usernameInput).toHaveAttribute('required');

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    expect(passwordInput).toHaveAttribute('required');

    // Check form can be submitted with Enter
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');
    
    // Simulate Enter key press
    await user.keyboard('{Enter}');
    
    // Form should submit (loading state should appear)
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });
});