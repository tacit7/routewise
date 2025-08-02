import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '@/components/register-form';
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

describe('RegisterForm', () => {
  const user = userEvent.setup();
  const mockOnSwitchToLogin = vi.fn();
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

  it('should render register form with all required elements', async () => {
    render(
      <TestWrapper>
        <RegisterForm 
          onSwitchToLogin={mockOnSwitchToLogin}
          onSuccess={mockOnSuccess}
        />
      </TestWrapper>
    );

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Check form elements
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account$/i })).toBeInTheDocument();
    expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in$/i)).toBeInTheDocument();
  });

  it('should show username validation feedback', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);

    // Type short username
    await user.type(usernameInput, 'ab');
    
    // Should show invalid feedback
    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 3 characters/i)).toHaveClass('text-red-500');
    });

    // Type valid username
    await user.type(usernameInput, 'cdef');
    
    // Should show valid feedback
    await waitFor(() => {
      expect(screen.getByText(/at least 3 characters/i)).toHaveClass('text-green-600');
    });
  });

  it('should show password requirements validation', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^password$/i);

    // Type weak password
    await user.type(passwordInput, 'weak');
    
    // Should show all requirements as not met
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toHaveClass('text-red-500');
      expect(screen.getByText(/contains uppercase letter/i)).toHaveClass('text-red-500');
      expect(screen.getByText(/contains lowercase letter/i)).toHaveClass('text-green-600'); // has lowercase
      expect(screen.getByText(/contains number/i)).toHaveClass('text-red-500');
    });

    // Clear and type strong password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongPass123');
    
    // Should show all requirements as met
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toHaveClass('text-green-600');
      expect(screen.getByText(/contains uppercase letter/i)).toHaveClass('text-green-600');
      expect(screen.getByText(/contains lowercase letter/i)).toHaveClass('text-green-600');
      expect(screen.getByText(/contains number/i)).toHaveClass('text-green-600');
    });
  });

  it('should validate password confirmation', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Type password
    await user.type(passwordInput, 'StrongPass123');
    
    // Type different confirmation
    await user.type(confirmPasswordInput, 'DifferentPass123');
    
    // Should show passwords don't match
    await waitFor(() => {
      expect(screen.getByText(/passwords match/i)).toHaveClass('text-red-500');
    });

    // Clear and type matching confirmation
    await user.clear(confirmPasswordInput);
    await user.type(confirmPasswordInput, 'StrongPass123');
    
    // Should show passwords match
    await waitFor(() => {
      expect(screen.getByText(/passwords match/i)).toHaveClass('text-green-600');
    });
  });

  it('should toggle password visibility for both password fields', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
    const toggleButtons = screen.getAllByRole('button', { name: '' }); // Eye icon buttons

    // Initially passwords should be hidden
    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('password');

    // Click to show first password
    await user.click(toggleButtons[0]);
    expect(passwordInput.type).toBe('text');

    // Click to show second password
    await user.click(toggleButtons[1]);
    expect(confirmPasswordInput.type).toBe('text');
  });

  it('should disable submit button when form is invalid', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account$/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create account$/i });
    
    // Initially should be disabled
    expect(submitButton).toBeDisabled();

    // Fill valid username
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    expect(submitButton).toBeDisabled();

    // Fill valid password
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123');
    expect(submitButton).toBeDisabled();

    // Fill matching confirmation
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');
    
    // Should now be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should handle successful registration', async () => {
    server.use(
      http.post('/api/auth/register', () => {
        return HttpResponse.json({
          success: true,
          user: { id: 1, username: 'testuser' }
        });
      })
    );

    render(
      <TestWrapper>
        <RegisterForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill valid form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account$/i }));

    // Should show loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();

    // Should call onSuccess callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle registration failure', async () => {
    server.use(
      http.post('/api/auth/register', () => {
        return HttpResponse.json({
          success: false,
          message: 'Username already exists'
        });
      })
    );

    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill valid form
    await user.type(screen.getByLabelText(/username/i), 'existinguser');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account$/i }));

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });
  });

  it('should prevent submission with client-side validation error', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill form with validation errors
    await user.type(screen.getByLabelText(/username/i), 'ab'); // Too short
    await user.type(screen.getByLabelText(/^password$/i), 'weak'); // Doesn't meet requirements
    await user.type(screen.getByLabelText(/confirm password/i), 'different'); // Doesn't match

    // Try to submit (button should be disabled, but let's force it)
    const form = screen.getByRole('button', { name: /create account$/i }).closest('form');
    
    // Manually trigger form submission
    if (form) {
      await user.click(form);
    }

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please fix the form errors/i)).toBeInTheDocument();
    });
  });

  it('should clear error when user starts typing', async () => {
    server.use(
      http.post('/api/auth/register', () => {
        return HttpResponse.json({
          success: false,
          message: 'Registration failed'
        });
      })
    );

    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill form and submit to trigger error
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /create account$/i }));

    // Error should be visible
    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });

    // Type in username field
    await user.type(screen.getByLabelText(/username/i), 'x');

    // Error should be cleared
    expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
  });

  it('should call onSwitchToLogin when sign in link is clicked', async () => {
    render(
      <TestWrapper>
        <RegisterForm onSwitchToLogin={mockOnSwitchToLogin} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/sign in$/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/sign in$/i));
    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });

  it('should not render switch to login link when callback not provided', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/already have an account/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sign in$/i)).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Check input attributes
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('autoComplete', 'username');
    expect(usernameInput).toHaveAttribute('required');

    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');
    expect(passwordInput).toHaveAttribute('required');

    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('autoComplete', 'new-password');
    expect(confirmPasswordInput).toHaveAttribute('required');
  });

  it('should handle network errors gracefully', async () => {
    server.use(
      http.post('/api/auth/register', () => {
        return HttpResponse.error();
      })
    );

    render(
      <TestWrapper>
        <RegisterForm />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Fill valid form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/^password$/i), 'StrongPass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account$/i }));

    // Should show generic error message
    await waitFor(() => {
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument();
    });
  });
});