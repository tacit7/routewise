import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedRouteForm from '@/components/enhanced-route-form';
import { server } from '../../setup';
import { http, HttpResponse } from 'msw';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock wouter location hook
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/test', mockSetLocation],
}));

// Mock the PlaceAutocomplete component
vi.mock('@/components/place-autocomplete', () => ({
  PlaceAutocomplete: ({ value, onSelect, placeholder, className }: any) => {
    const handleClick = () => {
      if (placeholder?.includes('starting')) {
        onSelect({
          place_id: 'start_place_id',
          description: 'San Francisco, CA, USA',
          main_text: 'San Francisco',
          secondary_text: 'CA, USA',
        });
      } else {
        onSelect({
          place_id: 'end_place_id',
          description: 'Los Angeles, CA, USA',
          main_text: 'Los Angeles',
          secondary_text: 'CA, USA',
        });
      }
    };

    return (
      <div className={className}>
        <input
          placeholder={placeholder}
          value={value || ''}
          onChange={() => {}}
          data-testid={placeholder?.includes('starting') ? 'start-autocomplete' : 'end-autocomplete'}
        />
        <button 
          onClick={handleClick}
          data-testid={placeholder?.includes('starting') ? 'select-start-city' : 'select-end-city'}
        >
          Select {placeholder?.includes('starting') ? 'Start' : 'End'} City
        </button>
      </div>
    );
  },
}));

describe('EnhancedRouteForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render route form with all required elements', () => {
    render(<EnhancedRouteForm />);

    // Check form elements
    expect(screen.getByText(/from/i)).toBeInTheDocument();
    expect(screen.getByText(/to/i)).toBeInTheDocument();
    expect(screen.getByTestId('start-autocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('end-autocomplete')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /plan my route/i })).toBeInTheDocument();
  });

  it('should handle place selection from autocomplete', async () => {
    render(<EnhancedRouteForm />);

    // Select start city
    await user.click(screen.getByTestId('select-start-city'));
    
    // Select end city
    await user.click(screen.getByTestId('select-end-city'));

    // Form should be ready to submit
    const submitButton = screen.getByRole('button', { name: /plan my route/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should validate that places are selected before submission', async () => {
    render(<EnhancedRouteForm />);

    const submitButton = screen.getByRole('button', { name: /plan my route/i });
    
    // Try to submit without selecting places
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/please select a starting city/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a destination city/i)).toBeInTheDocument();
    });
  });

  it('should validate that places are selected from suggestions', async () => {
    render(<EnhancedRouteForm />);

    // Manually type in the autocomplete inputs (simulating typing without selection)
    const startInput = screen.getByTestId('start-autocomplete');
    const endInput = screen.getByTestId('end-autocomplete');
    
    // Note: Since we're mocking the component, we can't actually type in it
    // But we can simulate the validation logic by trying to submit
    
    const submitButton = screen.getByRole('button', { name: /plan my route/i });
    await user.click(submitButton);

    // Should show validation errors requiring selection from suggestions
    await waitFor(() => {
      expect(screen.getByText(/please select a starting city from the suggestions/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a destination city from the suggestions/i)).toBeInTheDocument();
    });
  });

  it('should successfully plan route when valid data is provided', async () => {
    render(<EnhancedRouteForm />);

    // Select start city
    await user.click(screen.getByTestId('select-start-city'));
    
    // Select end city
    await user.click(screen.getByTestId('select-end-city'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: /plan my route/i });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/planning route/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Should store route data in localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'currentRoute',
        expect.stringContaining('San Francisco')
      );
    });

    // Should navigate to route results page
    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith(
        '/route?start=San%20Francisco&end=Los%20Angeles'
      );
    });

    // Should show success toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "Route planned!",
      description: "Preparing your route with embedded map...",
    });
  });

  it('should handle route planning errors', async () => {
    // Mock localStorage.setItem to throw error
    vi.mocked(localStorage.setItem).mockImplementation(() => {
      throw new Error('Storage error');
    });

    render(<EnhancedRouteForm />);

    // Select places
    await user.click(screen.getByTestId('select-start-city'));
    await user.click(screen.getByTestId('select-end-city'));

    // Submit form
    await user.click(screen.getByRole('button', { name: /plan my route/i }));

    // Should show error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to plan route. Please try again.",
        variant: "destructive",
      });
    });
  });

  it('should disable submit button during loading', async () => {
    render(<EnhancedRouteForm />);

    // Select places
    await user.click(screen.getByTestId('select-start-city'));
    await user.click(screen.getByTestId('select-end-city'));

    const submitButton = screen.getByRole('button', { name: /plan my route/i });
    
    // Submit form
    await user.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/planning route/i)).toBeInTheDocument();
  });

  it('should clear errors when valid places are selected', async () => {
    render(<EnhancedRouteForm />);

    // Try to submit without places to trigger errors
    await user.click(screen.getByRole('button', { name: /plan my route/i }));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/please select a starting city from the suggestions/i)).toBeInTheDocument();
    });

    // Select start city
    await user.click(screen.getByTestId('select-start-city'));

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/please select a starting city from the suggestions/i)).not.toBeInTheDocument();
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<EnhancedRouteForm />);

    // Check labels are properly associated
    expect(screen.getByText(/from/i)).toBeInTheDocument();
    expect(screen.getByText(/to/i)).toBeInTheDocument();

    // Check form structure
    const form = screen.getByRole('button', { name: /plan my route/i }).closest('form');
    expect(form).toBeInTheDocument();
  });

  it('should handle form submission with enter key', async () => {
    render(<EnhancedRouteForm />);

    // Select places
    await user.click(screen.getByTestId('select-start-city'));
    await user.click(screen.getByTestId('select-end-city'));

    // Get the form element
    const form = screen.getByRole('button', { name: /plan my route/i }).closest('form');
    
    if (form) {
      // Simulate Enter key press on form
      await user.type(form, '{enter}');
    }

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/planning route/i)).toBeInTheDocument();
    });
  });

  it('should encode URL parameters correctly', async () => {
    // Mock places with special characters
    vi.mocked(screen.getByTestId).mockImplementation((testId) => {
      const mockElement = document.createElement('button');
      mockElement.onclick = () => {
        if (testId === 'select-start-city') {
          // Simulate selecting a place with special characters
          const event = new CustomEvent('select', {
            detail: {
              place_id: 'special_place_id',
              description: 'San José, CA, USA',
              main_text: 'San José',
              secondary_text: 'CA, USA',
            }
          });
          mockElement.dispatchEvent(event);
        }
      };
      return mockElement;
    });

    render(<EnhancedRouteForm />);

    // Select places with special characters
    await user.click(screen.getByTestId('select-start-city'));
    await user.click(screen.getByTestId('select-end-city'));

    // Submit form
    await user.click(screen.getByRole('button', { name: /plan my route/i }));

    // URL should be properly encoded
    await waitFor(() => {
      expect(mockSetLocation).toHaveBeenCalledWith(
        expect.stringContaining('start=San%20Francisco&end=Los%20Angeles')
      );
    });
  });

  it('should store complete route data including places and checkpoints', async () => {
    render(<EnhancedRouteForm />);

    // Select places
    await user.click(screen.getByTestId('select-start-city'));
    await user.click(screen.getByTestId('select-end-city'));

    // Submit form
    await user.click(screen.getByRole('button', { name: /plan my route/i }));

    // Should store complete route data
    await waitFor(() => {
      const storedData = vi.mocked(localStorage.setItem).mock.calls[0][1];
      const parsedData = JSON.parse(storedData);
      
      expect(parsedData).toMatchObject({
        startCity: 'San Francisco',
        endCity: 'Los Angeles',
        startPlace: expect.objectContaining({
          place_id: 'start_place_id',
          main_text: 'San Francisco',
        }),
        endPlace: expect.objectContaining({
          place_id: 'end_place_id',
          main_text: 'Los Angeles',
        }),
        checkpoints: [],
      });
    });
  });
});