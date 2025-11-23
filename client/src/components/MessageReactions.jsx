import React, { useState } from 'react';
import { useSocket } from '../socket/socket';

const MessageReactions = ({ message, currentUser }) => {
  const { socket } = useSocket();
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😠', '👏', '🎉'];
  
  const handleReaction = (emoji) => {
    socket.emit('message_reaction', {
      messageId: message.id,
      emoji,
      roomId: message.roomId
    });
    setShowReactionPicker(false);
  };

  const userReaction = message.reactions?.find(r => 
    r.users?.includes(socket.id)
  );

  return (
    <div className="message-reactions">
      {/* Reaction picker */}
      {showReactionPicker && (
        <div className="reaction-picker">
          {reactions.map(emoji => (
            <button
              key={emoji}
              className="reaction-option"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Existing reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <div className="reactions-list">
          {message.reactions.map((reaction, index) => (
            <span
              key={index}
              className={`reaction ${userReaction?.emoji === reaction.emoji ? 'user-reaction' : ''}`}
              onClick={() => handleReaction(reaction.emoji)}
              title={reaction.usernames?.join(', ') || reaction.users?.join(', ')}
            >
              {reaction.emoji} {reaction.count}
            </span>
          ))}
        </div>
      )}

      {/* Reaction button */}
      <button
        className="reaction-button"
        onClick={() => setShowReactionPicker(!showReactionPicker)}
      >
        😊
      </button>
    </div>
  );
};

export default MessageReactions;