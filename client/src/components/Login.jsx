import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { isDarkMode } = useTheme();

  const validateUsername = (name) => {
    if (!name.trim()) {
      return 'Username is required';
    }
    if (name.length < 2) {
      return 'Username must be at least 2 characters';
    }
    if (name.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
      return 'Username can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate a brief loading state for better UX
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onLogin(username.trim());
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div className={`login-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="login-card">
        {/* Header Section */}
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">💬</div>
            <h1>ChatApp</h1>
          </div>
          <p className="login-subtitle">Connect and chat in real-time</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Choose Your Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleInputChange}
              placeholder="Enter your username..."
              className={`form-input ${error ? 'error' : ''}`}
              disabled={isLoading}
              maxLength={20}
              autoFocus
            />
            <div className="input-footer">
              <span className="char-count">{username.length}/20</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Connecting...
              </>
            ) : (
              'Join Chat'
            )}
          </button>
        </form>

        {/* Features Section */}
        <div className="features-section">
          <h3>Features</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>Real-time messaging</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <span>Group chats & DMs</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <span>Dark/Light mode</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure connection</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>By joining, you agree to our <a href="#terms">Terms of Service</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;