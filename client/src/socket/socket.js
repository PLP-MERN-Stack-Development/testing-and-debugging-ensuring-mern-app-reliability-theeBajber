// socket.js - Enhanced Socket.io client setup with all features

import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connectionError, setConnectionError] = useState(null);

  // Connect to socket server
  const connect = (userData) => {
    try {
      setConnectionError(null);
      socket.connect();
      if (userData) {
        socket.emit('user_join', userData);
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionError('Failed to connect to server');
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a message
  const sendMessage = (messageData) => {
    if (socket.connected) {
      socket.emit('send_message', messageData);
    } else {
      setConnectionError('Not connected to server');
    }
  };

  // Send a private message
  const sendPrivateMessage = (to, message) => {
    if (socket.connected) {
      socket.emit('private_message', { to, message });
    } else {
      setConnectionError('Not connected to server');
    }
  };

  // Edit a message
  const editMessage = (messageId, newContent, roomId) => {
    if (socket.connected) {
      socket.emit('edit_message', { 
        messageId, 
        newContent, 
        roomId: roomId || 'general' 
      });
    } else {
      setConnectionError('Not connected to server');
    }
  };

  // Delete a message
  const deleteMessage = (messageId, roomId) => {
    if (socket.connected) {
      socket.emit('delete_message', { 
        messageId, 
        roomId: roomId || 'general' 
      });
    } else {
      setConnectionError('Not connected to server');
    }
  };

  // Set typing status
  const setTyping = (typingData) => {
    if (socket.connected) {
      socket.emit('typing', typingData);
    }
  };

  // Create a new room
  const createRoom = (roomData) => {
    if (socket.connected) {
      socket.emit('create_room', roomData);
    }
  };

  // Join a room
  const joinRoom = (roomId) => {
    if (socket.connected) {
      socket.emit('join_room', roomId);
    }
  };

  // Leave a room
  const leaveRoom = (roomId) => {
    if (socket.connected) {
      socket.emit('leave_room', roomId);
    }
  };

  // Update user profile
  const updateProfile = (profileData) => {
    if (socket.connected) {
      socket.emit('update_profile', profileData);
    }
  };

  // Add message reaction
  const addReaction = (messageId, emoji, roomId) => {
    if (socket.connected) {
      socket.emit('message_reaction', {
        messageId,
        emoji,
        roomId: roomId || 'general'
      });
    }
  };

  // Remove message reaction
  const removeReaction = (messageId, emoji, roomId) => {
    if (socket.connected) {
      socket.emit('remove_reaction', {
        messageId,
        emoji,
        roomId: roomId || 'general'
      });
    }
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Connected to server');
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      console.log('Disconnected from server:', reason);
      
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    };

    const onConnectError = (error) => {
      setConnectionError('Connection error: ' + error.message);
      console.error('Connection error:', error);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const onPrivateMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const onMessageHistory = (messageHistory) => {
      setMessages(messageHistory);
    };

    const onMessageEdited = (editedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg.id === editedMessage.id ? editedMessage : msg
      ));
    };

    const onMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (user) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onProfileUpdated = (user) => {
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, ...user } : u
      ));
    };

    // Room events
    const onRoomList = (roomList) => {
      setRooms(roomList);
    };

    const onRoomCreated = (room) => {
      setRooms(prev => [...prev, room]);
    };

    const onRoomJoined = (room) => {
      console.log('Joined room:', room.name);
    };

    const onUserJoinedRoom = ({ user, roomId }) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the room`,
          timestamp: new Date().toISOString(),
          roomId
        },
      ]);
    };

    const onUserLeftRoom = ({ user, roomId }) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the room`,
          timestamp: new Date().toISOString(),
          roomId
        },
      ]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Reaction events
    const onMessageReactionAdded = ({ messageId, emoji, reactions, user }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions } 
          : msg
      ));
    };

    const onMessageReactionRemoved = ({ messageId, emoji, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions } 
          : msg
      ));
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('message_history', onMessageHistory);
    socket.on('message_edited', onMessageEdited);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('profile_updated', onProfileUpdated);
    socket.on('room_list', onRoomList);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('user_joined_room', onUserJoinedRoom);
    socket.on('user_left_room', onUserLeftRoom);
    socket.on('typing_users', onTypingUsers);
    socket.on('message_reaction_added', onMessageReactionAdded);
    socket.on('message_reaction_removed', onMessageReactionRemoved);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('message_history', onMessageHistory);
      socket.off('message_edited', onMessageEdited);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('profile_updated', onProfileUpdated);
      socket.off('room_list', onRoomList);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('user_joined_room', onUserJoinedRoom);
      socket.off('user_left_room', onUserLeftRoom);
      socket.off('typing_users', onTypingUsers);
      socket.off('message_reaction_added', onMessageReactionAdded);
      socket.off('message_reaction_removed', onMessageReactionRemoved);
    };
  }, []);

  return {
    socket,
    isConnected,
    messages,
    users,
    rooms,
    typingUsers,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    editMessage,
    deleteMessage,
    setTyping,
    createRoom,
    joinRoom,
    leaveRoom,
    updateProfile,
    addReaction,
    removeReaction,
  };
};

export default socket;