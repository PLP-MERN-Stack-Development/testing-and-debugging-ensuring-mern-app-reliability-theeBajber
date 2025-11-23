// client/src/tests/integration/PostForm.test.js - Integration tests for PostForm

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import PostForm from '../../components/PostForm';
import { postService } from '../../services/api';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock API service
jest.mock('../../services/api', () => ({
  postService: {
    createPost: jest.fn(),
    updatePost: jest.fn(),
  },
}));

// Mock auth context
const mockAuth = {
  user: { id: 1, username: 'testuser' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const renderWithProviders = (component) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider value={mockAuth}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('PostForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should submit form with valid data', async () => {
    const mockPost = {
      id: 1,
      title: 'Test Post',
      content: 'Test Content',
      category: 'tech',
    };

    postService.createPost.mockResolvedValue(mockPost);
    const onSuccess = jest.fn();

    renderWithProviders(<PostForm onSuccess={onSuccess} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Post' },
    });

    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test Content' },
    });

    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'tech' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create post/i }));

    // Wait for submission
    await waitFor(() => {
      expect(postService.createPost).toHaveBeenCalledWith({
        title: 'Test Post',
        content: 'Test Content',
        category: 'tech',
      });
    });

    expect(onSuccess).toHaveBeenCalledWith(mockPost);
  });

  it('should show validation errors', async () => {
    renderWithProviders(<PostForm />);

    // Try to submit empty form
    fireEvent.click(screen.getByRole('button', { name: /create post/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    expect(postService.createPost).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to create post';
    postService.createPost.mockRejectedValue(new Error(errorMessage));

    renderWithProviders(<PostForm />);

    // Fill out and submit form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Post' },
    });

    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test Content' },
    });

    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: 'tech' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create post/i }));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});