import React, { useState } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import { useSocket } from './socket/socket';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function AppContent() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { connect, disconnect, isConnected, connectionError } = useSocket();

  const handleLogin = (user) => {
    setUsername(user);
    setIsLoggedIn(true);
    connect({ username: user });
  };

  const handleLogout = () => {
    disconnect();
    setUsername('');
    setIsLoggedIn(false);
  };

  return (
    <div className="app">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-container">
          {connectionError && (
            <div className="connection-error-banner">
              <span>⚠️ {connectionError}</span>
              <button onClick={handleLogout} className="reconnect-button">
                Reconnect
              </button>
            </div>
          )}
          <Chat 
            username={username} 
            onLogout={handleLogout} 
            isConnected={isConnected}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;