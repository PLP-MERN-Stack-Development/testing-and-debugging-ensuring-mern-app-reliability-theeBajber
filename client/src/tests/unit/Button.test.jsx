// client/src/tests/unit/Button.test.js - Unit tests for Button component
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/common/Button';

describe('Button Component', () => {
  it('should render button with correct text', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} loading>Loading Button</Button>);
    
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should show loading state when loading prop is true', () => {
    render(<Button loading>Loading Button</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(button).toHaveTextContent('Loading...');
  });

  it('should apply correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary Button</Button>);
    
    let button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-blue-600');

    rerender(<Button variant="secondary">Secondary Button</Button>);
    button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-gray-600');

    rerender(<Button variant="danger">Danger Button</Button>);
    button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-red-600');
  });

  it('should use primary variant for invalid variant', () => {
    render(<Button variant="invalid">Button</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should support custom data-testid', () => {
    render(<Button data-testid="custom-button">Custom TestId</Button>);
    
    const button = screen.getByTestId('custom-button');
    expect(button).toBeInTheDocument();
  });

  it('should set button type correctly', () => {
    const { rerender } = render(<Button type="submit">Submit</Button>);
    
    let button = screen.getByTestId('button');
    expect(button).toHaveAttribute('type', 'submit');

    rerender(<Button type="button">Button</Button>);
    button = screen.getByTestId('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should handle onClick with undefined handler', () => {
    render(<Button>No Handler</Button>);
    
    const button = screen.getByTestId('button');
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('should show children when not loading', () => {
    render(<Button>Button Text</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toHaveTextContent('Button Text');
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});