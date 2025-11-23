import React from 'react';

const TypingIndicator = ({ typingUsers, currentUser }) => {
  // Filter out current user from typing indicators
  const otherTypingUsers = typingUsers.filter(user => user !== currentUser);

  if (otherTypingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0]} is typing`;
    } else if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing`;
    } else {
      return `${otherTypingUsers[0]} and ${otherTypingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-content">
        <div className="typing-dots">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
        <span className="typing-text">{getTypingText()}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;