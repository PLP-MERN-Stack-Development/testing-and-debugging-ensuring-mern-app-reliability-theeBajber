// client/src/tests/unit/contexts/AuthContext.test.jsx - AuthContext tests

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/api';

jest.mock('../../../services/api');

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No User'}</div>
      <button onClick={auth.login}>Login</button>
      <button onClick={auth.logout}>Logout</button>
      <button onClick={auth.register}>Register</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should provide auth context with initial loading state', async () => {
    authService.getCurrentUser = jest.fn().mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  it('should load user from token on mount', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    localStorage.setItem('token', 'valid-token');
    authService.getCurrentUser = jest.fn().mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('should handle failed token verification', async () => {
    localStorage.setItem('token', 'invalid-token');
    authService.getCurrentUser = jest.fn().mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    });

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should not load user if no token present', async () => {
    authService.getCurrentUser = jest.fn();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(authService.getCurrentUser).not.toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
  });

  it('should handle login successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    const mockCredentials = { email: 'test@example.com', password: 'password' };
    authService.login = jest.fn().mockResolvedValue({ user: mockUser, token: 'new-token' });
    authService.getCurrentUser = jest.fn().mockResolvedValue(null);

    let authContext;
    const LoginComponent = () => {
      authContext = useAuth();
      return <div>Login Test</div>;
    };

    render(
      <AuthProvider>
        <LoginComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });

    await act(async () => {
      await authContext.login(mockCredentials);
    });

    expect(authService.login).toHaveBeenCalledWith(mockCredentials);
    expect(authContext.user).toEqual(mockUser);
    expect(authContext.isAuthenticated).toBe(true);
  });

  it('should handle logout', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    localStorage.setItem('token', 'valid-token');
    authService.getCurrentUser = jest.fn().mockResolvedValue(mockUser);
    authService.logout = jest.fn();

    let authContext;
    const LogoutComponent = () => {
      authContext = useAuth();
      return <div>Logout Test</div>;
    };

    render(
      <AuthProvider>
        <LogoutComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authContext.isAuthenticated).toBe(true);
    });

    act(() => {
      authContext.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(authContext.user).toBeNull();
    expect(authContext.isAuthenticated).toBe(false);
  });

  it('should handle register successfully', async () => {
    const mockUser = { id: '123', email: 'newuser@example.com' };
    const mockUserData = { email: 'newuser@example.com', password: 'password' };
    authService.register = jest.fn().mockResolvedValue({ user: mockUser, token: 'new-token' });
    authService.getCurrentUser = jest.fn().mockResolvedValue(null);

    let authContext;
    const RegisterComponent = () => {
      authContext = useAuth();
      return <div>Register Test</div>;
    };

    render(
      <AuthProvider>
        <RegisterComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Register Test')).toBeInTheDocument();
    });

    await act(async () => {
      await authContext.register(mockUserData);
    });

    expect(authService.register).toHaveBeenCalledWith(mockUserData);
    expect(authContext.user).toEqual(mockUser);
    expect(authContext.isAuthenticated).toBe(true);
  });

  it('should accept value prop for testing', () => {
    const mockValue = {
      user: { email: 'test@example.com' },
      loading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    };

    render(
      <AuthProvider value={mockValue}>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
  });
});
