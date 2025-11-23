import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../socket/socket';

const MessageInput = ({ currentChat, isPrivate, recipient }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, sendPrivateMessage, setTyping, isConnected } = useSocket();
  const typingTimeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && isConnected) {
      if (isPrivate && recipient) {
        sendPrivateMessage(recipient.id, message.trim());
      } else {
        sendMessage({ 
          message: message.trim(), 
          roomId: currentChat 
        });
      }
      setMessage('');
      handleStopTyping();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      setTyping({ 
        isTyping: true, 
        roomId: isPrivate ? undefined : currentChat 
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      setTyping({ 
        isTyping: false, 
        roomId: isPrivate ? undefined : currentChat 
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        setTyping({ 
          isTyping: false, 
          roomId: isPrivate ? undefined : currentChat 
        });
      }
    };
  }, [isTyping, isPrivate, currentChat]);

  const placeholder = isPrivate && recipient
    ? `Message ${recipient.username}...` 
    : `Message in ${currentChat === 'general' ? 'General Chat' : 'this room'}...`;

  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit} className="message-form">
        <div className="input-wrapper">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? placeholder : "Connecting..."}
            className="message-input"
            disabled={!isConnected}
            rows="1"
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!message.trim() || !isConnected}
            title="Send message"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;