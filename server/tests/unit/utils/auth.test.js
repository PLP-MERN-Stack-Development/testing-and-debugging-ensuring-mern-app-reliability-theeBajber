// server/tests/unit/utils/auth.test.js - Unit tests for auth utilities

const { generateToken, verifyToken, hashPassword, comparePassword } = require('../../../src/utils/auth');
const jwt = require('jsonwebtoken');

describe('Auth Utilities', () => {
  const testUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
      expect(decoded.userId).toBe(testUser._id);
      expect(decoded.email).toBe(testUser.email);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = jwt.sign(
        { userId: testUser._id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '1h' }
      );

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(testUser._id);
      expect(decoded.email).toBe(testUser.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid-token';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '-1h' } // Expired
      );

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow();
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await hashPassword(password);
      
      const isMatch = await comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });
});