import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { formatDate, isSameDay } from '../utils/dateUtils';

const MessageList = ({ messages = [], currentUser, searchTerm }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const highlightText = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    return !isSameDay(currentMessage.timestamp, previousMessage.timestamp);
  };

  // Group messages by date for better organization
  const groupMessagesByDate = () => {
    const groups = [];
    let currentGroup = [];
    
    messages.forEach((message, index) => {
      const previousMessage = messages[index - 1];
      const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
      
      if (showDateSeparator && currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
      
      currentGroup.push(message);
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="messages-list">
      {messages && messages.length > 0 ? (
        messageGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="message-group">
            {/* Date Separator */}
            <div className="date-separator">
              <span>{formatDate(group[0].timestamp)}</span>
            </div>
            
            {/* Messages in this group */}
            {group.map((message, messageIndex) => (
              <div key={message.id || `${groupIndex}-${messageIndex}`}>
                <MessageBubble 
                  message={message}
                  currentUser={currentUser}
                  searchTerm={searchTerm}
                  highlightText={highlightText}
                />
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="empty-messages">
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No messages yet</p>
            <span>Start a conversation by sending a message!</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} className="scroll-anchor" />
    </div>
  );
};

export default MessageList;