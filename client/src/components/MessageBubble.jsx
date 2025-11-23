import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import { formatTime } from '../utils/dateUtils';
import MessageReactions from './MessageReactions';

const MessageBubble = ({ message, currentUser, searchTerm, highlightText }) => {
  const { editMessage, deleteMessage } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.message);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const editInputRef = useRef(null);
  const menuRef = useRef(null);

  const isOwnMessage = message.sender === currentUser;

  // Focus on input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(
        editInputRef.current.value.length,
        editInputRef.current.value.length
      );
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.message) {
      editMessage(message.id, editContent.trim(), message.roomId);
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.message);
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteMessage(message.id, message.roomId);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const menuItems = [
    {
      label: 'Edit',
      icon: '✏️',
      action: () => {
        setIsEditing(true);
        setShowMenu(false);
      },
      show: isOwnMessage && !message.system
    },
    {
      label: 'Delete',
      icon: '🗑️',
      action: () => setShowDeleteConfirm(true),
      show: isOwnMessage && !message.system
    },
    {
      label: 'Copy Text',
      icon: '📋',
      action: () => {
        navigator.clipboard.writeText(message.message);
        setShowMenu(false);
      },
      show: true
    },
    {
      label: 'Reply',
      icon: '↩️',
      action: () => {
        // Future reply feature
        setShowMenu(false);
      },
      show: true
    }
  ];

  const filteredMenuItems = menuItems.filter(item => item.show);

  if (message.system) {
    return (
      <div className="system-message">
        <div className="system-content">
          {message.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
      {/* Message Menu */}
      {showMenu && (
        <div className="message-menu" ref={menuRef}>
          {filteredMenuItems.map((item, index) => (
            <button
              key={index}
              className="menu-item"
              onClick={item.action}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Message</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="close-button">×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this message? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="delete-confirm-button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOwnMessage && (
        <div className="message-sender">
          <div className="sender-avatar">
            {message.senderAvatar || (message.sender ? message.sender.charAt(0).toUpperCase() : '?')}
          </div>
          <div className="sender-info">
            <span className="sender-name">{message.sender || 'Unknown'}</span>
            <span className="message-time">
              {formatTime(message.timestamp)}
            </span>
          </div>
          {message.isPrivate && <span className="private-indicator">Private</span>}
        </div>
      )}
      
      <div className="message-content-wrapper">
        <div className="message-content">
          {isEditing ? (
            <div className="edit-container">
              <textarea
                ref={editInputRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyPress}
                className="edit-input"
                rows={Math.min(5, Math.max(1, editContent.split('\n').length))}
              />
              <div className="edit-actions">
                <button onClick={handleCancelEdit} className="edit-cancel">
                  Cancel
                </button>
                <button 
                  onClick={handleEdit} 
                  className="edit-save"
                  disabled={!editContent.trim() || editContent === message.message}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="message-text">
                {highlightText(message.message, searchTerm)}
              </div>
              {message.edited && (
                <span className="edited-indicator">(edited)</span>
              )}
            </>
          )}
        </div>

        {/* Message Actions */}
        {!isEditing && (
          <button 
            className="message-actions-button"
            onClick={() => setShowMenu(!showMenu)}
            title="Message actions"
          >
            ⋮
          </button>
        )}
      </div>
      
      {isOwnMessage && !isEditing && (
        <div className="message-footer own">
          <span className="message-time">
            {formatTime(message.timestamp)}
          </span>
          <span className="message-status">✓</span>
        </div>
      )}
      
      {message.reactions && <MessageReactions message={message} currentUser={currentUser} />}
    </div>
  );
};

export default MessageBubble;