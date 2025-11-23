import React, { useState, useEffect } from 'react';

const UserProfile = ({ user, onUpdate, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || '👤');
  const [isChanged, setIsChanged] = useState(false);

  // Check if changes were made
  useEffect(() => {
    const usernameChanged = username !== user.username;
    const avatarChanged = avatar !== user.avatar;
    setIsChanged(usernameChanged || avatarChanged);
  }, [username, avatar, user.username, user.avatar]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && isChanged) {
      onUpdate({ 
        username: username.trim(), 
        avatar 
      });
    } else {
      onClose();
    }
  };

  const avatarOptions = [
    '👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', 
    '👨‍⚕️', '👩‍⚕️', '👨‍🔬', '👩‍🔬', '👨‍🍳', '👩‍🍳', '👨‍🌾', '👩‍🌾',
    '😊', '😎', '🤩', '🧐', '🤓', '😇', '🥳', '😍',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🎮', '🏀', '⚽', '🎸', '🎨', '🎭', '🚀', '🌟'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              required
              maxLength={20}
            />
            <div className="input-help">
              Maximum 20 characters • {username.length}/20
            </div>
          </div>
          
          <div className="form-group">
            <label>Choose Avatar</label>
            <div className="avatar-preview">
              <div className="selected-avatar">
                Current: <span className="avatar-large">{avatar}</span>
              </div>
            </div>
            <div className="avatar-options">
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`avatar-option ${avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setAvatar(emoji)}
                  title={`Select ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-button" 
              disabled={!username.trim() || !isChanged}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;