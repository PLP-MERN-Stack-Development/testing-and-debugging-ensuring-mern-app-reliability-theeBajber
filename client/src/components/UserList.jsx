import React from 'react';

const UserList = ({ users, currentUser, activeChat, onUserClick }) => {
  const currentUserObj = users.find(user => user.username === currentUser);
  const otherUsers = users.filter(user => user.username !== currentUser);

  return (
    <div className="user-list">
      {otherUsers.map(user => (
        <div
          key={user.id}
          className={`user-item ${activeChat === user.id ? 'active' : ''}`}
          onClick={() => onUserClick(user)}
        >
          <div className="user-avatar">
            {user.avatar || user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="username">{user.username}</span>
            <span className={`user-status ${user.status || 'online'}`}>
              {user.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className={`status-indicator ${user.status || 'online'}`}></div>
        </div>
      ))}
      
      {otherUsers.length === 0 && (
        <div className="empty-state">
          <p>No other users online</p>
        </div>
      )}
    </div>
  );
};

export default UserList;