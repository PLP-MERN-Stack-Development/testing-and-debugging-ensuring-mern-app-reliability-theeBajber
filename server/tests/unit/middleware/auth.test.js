// server/tests/unit/middleware/auth.test.js - Auth middleware tests

const { authenticate } = require('../../../src/middleware/auth');
const { verifyToken } = require('../../../src/utils/auth');

jest.mock('../../../src/utils/auth');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token provided', () => {
    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header is empty', () => {
    req.headers.authorization = '';

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should authenticate valid token and call next', () => {
    const decoded = { userId: '123', email: 'test@example.com', role: 'user' };
    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue(decoded);

    authenticate(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if token verification fails', () => {
    req.headers.authorization = 'Bearer invalid-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle Bearer token with extra spaces', () => {
    const decoded = { userId: '123', email: 'test@example.com' };
    req.headers.authorization = 'Bearer  token-with-spaces';
    verifyToken.mockReturnValue(decoded);

    authenticate(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith(' token-with-spaces');
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
  });

  it('should handle token without Bearer prefix', () => {
    req.headers.authorization = 'just-a-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Invalid token format');
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });
});
