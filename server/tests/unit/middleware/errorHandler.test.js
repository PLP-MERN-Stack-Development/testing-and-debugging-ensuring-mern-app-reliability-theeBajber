// server/tests/unit/middleware/errorHandler.test.js - Error handler middleware tests

const errorHandler = require('../../../src/middleware/errorHandler');

// Save original NODE_ENV
const originalEnv = process.env.NODE_ENV;

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    console.error = jest.fn(); // Mock console.error
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv; // Restore NODE_ENV
  });

  it('should handle ValidationError', () => {
    const error = {
      name: 'ValidationError',
      message: 'Validation failed',
      errors: {
        title: { message: 'Title is required' },
        content: { message: 'Content is required' },
      },
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation Error',
      details: ['Title is required', 'Content is required'],
    });
  });

  it('should handle duplicate key error (11000)', () => {
    const error = {
      code: 11000,
      keyValue: { email: 'test@example.com' },
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Duplicate Entry',
      message: 'email already exists',
    });
  });

  it('should handle JsonWebTokenError', () => {
    const error = {
      name: 'JsonWebTokenError',
      message: 'jwt malformed',
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid Token',
    });
  });

  it('should handle TokenExpiredError', () => {
    const error = {
      name: 'TokenExpiredError',
      message: 'jwt expired',
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token Expired',
    });
  });

  it('should handle generic errors with custom status code', () => {
    const error = {
      statusCode: 404,
      message: 'Resource not found',
      stack: 'Error stack trace',
    };

    process.env.NODE_ENV = 'development';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Resource not found',
      stack: 'Error stack trace',
    });
  });

  it('should handle generic errors without status code', () => {
    const error = {
      message: 'Something went wrong',
      stack: 'Error stack trace',
    };

    process.env.NODE_ENV = 'development';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Something went wrong',
      stack: 'Error stack trace',
    });
  });

  it('should hide error details in production', () => {
    const error = {
      statusCode: 500,
      message: 'Database connection failed',
      stack: 'Error stack trace',
    };

    process.env.NODE_ENV = 'production';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Something went wrong',
    });
  });

  it('should use default message when no message provided', () => {
    const error = {
      stack: 'Error stack trace',
    };

    process.env.NODE_ENV = 'development';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      stack: 'Error stack trace',
    });
  });

  it('should log error details to console', () => {
    const error = {
      message: 'Test error',
      stack: 'Error stack trace',
    };

    errorHandler(error, req, res, next);

    expect(console.error).toHaveBeenCalledWith('Error occurred:', {
      message: 'Test error',
      stack: 'Error stack trace',
      url: '/api/test',
      method: 'POST',
      ip: '127.0.0.1',
    });
  });
});
