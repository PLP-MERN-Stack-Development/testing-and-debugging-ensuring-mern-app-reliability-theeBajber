import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import RoomList from './RoomList';
import TypingIndicator from './TypingIndicator';
import CreateRoomModal from './CreateRoomModal';
import UserProfile from './UserProfile';
import { useSocket } from '../socket/socket';
import { useTheme } from '../context/ThemeContext';

const Chat = ({ username, onLogout, isConnected }) => {
  const { messages = [], users = [], typingUsers = [], rooms = [], joinRoom, createRoom, sendPrivateMessage, updateProfile, socket } = useSocket();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [activeView, setActiveView] = useState('general');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState({
    username: username,
    avatar: '👤' // Default avatar
  });

  const currentRoom = rooms.find(room => room.id === activeView);
  const currentUser = users.find(user => user.id === activeView);
  
  // Update user profile when socket updates
  useEffect(() => {
    const currentSocketUser = users.find(user => user.id === socket.id);
    if (currentSocketUser) {
      setCurrentUserProfile(prev => ({
        ...prev,
        avatar: currentSocketUser.avatar || prev.avatar
      }));
    }
  }, [users, socket.id]);

  // Safely filter messages
  const filteredMessages = Array.isArray(messages) ? messages.filter(message => {
    if (!message) return false;
    
    const inCurrentRoom = message.roomId === activeView;
    const inPrivateChat = message.isPrivate && 
      (message.senderId === activeView || message.recipientId === activeView);
    
    const matchesSearch = !searchTerm || 
      (message.message && message.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (message.sender && message.sender.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return (inCurrentRoom || inPrivateChat) && matchesSearch;
  }) : [];

  const handleUserClick = (user) => {
    if (user && user.id !== activeView) {
      setActiveView(user.id);
    }
  };

  const handleRoomClick = (room) => {
    if (room && room.id !== activeView) {
      joinRoom(room.id);
      setActiveView(room.id);
      setIsSidebarOpen(false); // Close sidebar on mobile
    }
  };

  const handleCreateRoom = (roomData) => {
    if (roomData && roomData.name) {
      createRoom(roomData);
      setShowCreateRoom(false);
    }
  };

  const handleProfileUpdate = (profileData) => {
    if (profileData && profileData.username) {
      // Update local state immediately for better UX
      setCurrentUserProfile(prev => ({
        username: profileData.username,
        avatar: profileData.avatar
      }));
      
      // Send update to server
      updateProfile(profileData);
      
      // Close the modal
      setShowUserProfile(false);
    }
  };

  const getChatTitle = () => {
    if (activeView === 'general') {
      return 'General Chat';
    }
    if (currentRoom) {
      return currentRoom.name || 'Room';
    }
    if (currentUser) {
      return `Chat with ${currentUser.username || 'User'}`;
    }
    return 'Chat';
  };

  const getChatSubtitle = () => {
    if (currentRoom) {
      return `${currentRoom.users?.size || 0} members`;
    }
    if (currentUser) {
      return currentUser.status === 'online' ? 'Online' : 'Offline';
    }
    return 'Everyone is here';
  };

  return (
    <div className="chat-app">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay active"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`chat-sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              {currentUserProfile.avatar}
            </div>
            <div className="user-details">
              <h3>{currentUserProfile.username}</h3>
              <span className={`status ${isConnected ? 'online' : 'offline'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button 
              onClick={toggleTheme}
              className="icon-button"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => setShowUserProfile(true)}
              className="icon-button"
              title="Edit profile"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sidebar-content">
          {/* Rooms Section */}
          <div className="sidebar-section">
            <div className="section-header">
              <h4>Rooms</h4>
              <button 
                onClick={() => setShowCreateRoom(true)}
                className="add-button"
                title="Create new room"
              >
                +
              </button>
            </div>
            <RoomList 
              rooms={rooms}
              activeRoom={activeView}
              onRoomClick={handleRoomClick}
            />
          </div>

          {/* Users Section */}
          <div className="sidebar-section">
            <div className="section-header">
              <h4>Online Users ({users.length})</h4>
            </div>
            <UserList 
              users={users}
              currentUser={currentUserProfile.username}
              activeChat={activeView}
              onUserClick={handleUserClick}
            />
          </div>
        </div>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-button">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <button 
            className="mobile-menu-button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle menu"
          >
            ☰
          </button>
          <div className="chat-info">
            <h2>{getChatTitle()}</h2>
            <p>{getChatSubtitle()}</p>
          </div>
          <div className="chat-actions">
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-button"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        <div className="messages-container">
          <MessageList 
            messages={filteredMessages}
            currentUser={currentUserProfile.username}
            searchTerm={searchTerm}
          />
          <TypingIndicator 
            typingUsers={typingUsers}
            currentUser={currentUserProfile.username}
          />
        </div>

        <MessageInput 
          currentChat={activeView}
          isPrivate={!!currentUser}
          recipient={currentUser}
        />
      </div>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomModal 
          onCreate={handleCreateRoom}
          onClose={() => setShowCreateRoom(false)}
        />
      )}

      {showUserProfile && (
        <UserProfile 
          user={currentUserProfile}
          onUpdate={handleProfileUpdate}
          onClose={() => setShowUserProfile(false)}
        />
      )}
    </div>
  );
};

export default Chat;