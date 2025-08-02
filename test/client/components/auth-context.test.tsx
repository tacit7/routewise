import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/components/auth-context';
import { server } from '../../setup';
import { http, HttpResponse } from 'msw';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, login, register, logout, checkAuth } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? `Authenticated: ${user?.username}` : 'Not authenticated'}
      </div>
      <button 
        onClick={() => login('testuser', 'password123')}
        data-testid="login-button"
      >
        Login
      </button>
      <button 
        onClick={() => register('newuser', 'password123')}
        data-testid="register-button"
      >
        Register
      </button>
      <button 
        onClick={() => logout()}
        data-testid="logout-button"
      >
        Logout
      </button>
      <button 
        onClick={() => checkAuth()}
        data-testid="check-auth-button"
      >
        Check Auth
      </button>
    </div>
  );
};

// Test component wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Clear any URL parameters
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: '',
        pathname: '/',
      },
      writable: true,
    });

    // Mock history.replaceState
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should provide authentication context to children', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ success: false });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Should show not authenticated after loading
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  it('should handle successful authentication check', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({
          success: true,
          user: { id: 1, username: 'testuser' }
        });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated: testuser');
    });
  });

  it('should handle successful login', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ success: false });
      }),
      http.post('/api/auth/login', () => {
        return HttpResponse.json({
          success: true,
          user: { id: 1, username: 'testuser' }
        });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    // Perform login
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated: testuser');
    });
  });

  it('should handle failed login', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ success: false });
      }),
      http.post('/api/auth/login', () => {
        return HttpResponse.json({
          success: false,
          message: 'Invalid credentials'
        });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    await user.click(screen.getByTestId('login-button'));

    // Should remain not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  it('should handle successful registration', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ success: false });
      }),
      http.post('/api/auth/register', () => {
        return HttpResponse.json({
          success: true,
          user: { id: 2, username: 'newuser' }
        });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    await user.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated: newuser');
    });
  });

  it('should handle logout', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({
          success: true,
          user: { id: 1, username: 'testuser' }
        });
      }),
      http.post('/api/auth/logout', () => {
        return HttpResponse.json({ success: true });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should be authenticated initially
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated: testuser');
    });

    // Perform logout
    await user.click(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  it('should handle OAuth success redirect', async () => {
    const mockToast = vi.fn();

    // Mock URL with OAuth success parameters
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: '?success=google_auth&message=Welcome back!',
        pathname: '/',
      },
      writable: true,
    });

    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ success: false });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Welcome!",
        description: "Welcome back!",
      });
    });

    expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
  });

  it('should handle OAuth error redirect', async () => {
    const mockToast = vi.fn();

    // Mock URL with OAuth error parameters
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        search: '?error=oauth_error&message=Authentication failed',
        pathname: '/',
      },
      writable: true,
    });

    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.json({ success: false });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Authentication Error",
        description: "Google authentication was cancelled or failed",
        variant: "destructive",
      });
    });

    expect(window.history.replaceState).toHaveBeenCalledWith({}, document.title, '/');
  });

  it('should handle network errors gracefully', async () => {
    server.use(
      http.get('/api/auth/me', () => {
        return HttpResponse.error();
      }),
      http.post('/api/auth/login', () => {
        return HttpResponse.error();
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Should handle auth check error
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    // Should handle login error
    await user.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
  });

  it('should call checkAuth on manual trigger', async () => {
    let authCallCount = 0;
    server.use(
      http.get('/api/auth/me', () => {
        authCallCount++;
        return HttpResponse.json({ success: false });
      })
    );

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    // Initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    expect(authCallCount).toBe(1);

    // Manual auth check
    await user.click(screen.getByTestId('check-auth-button'));

    await waitFor(() => {
      expect(authCallCount).toBe(2);
    });
  });
});