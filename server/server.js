// server.js - Main server file with MongoDB integration

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');
const Reaction = require('./models/Reaction');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// CORS configuration for production
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  // Additional production settings
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

connectDB();

// In-memory storage for real-time data (for performance)
const onlineUsers = new Map(); // socketId -> user data
const typingUsers = new Map();

// Initialize default room in database
const initializeDefaultRoom = async () => {
  try {
    const existingRoom = await Room.findOne({ id: 'general' });
    if (!existingRoom) {
      const generalRoom = new Room({
        id: 'general',
        name: 'General Chat',
        description: 'Main chat room for everyone',
        createdBy: 'system',
        createdById: 'system',
        users: [],
        isPrivate: false,
        createdAt: new Date().toISOString()
      });
      await generalRoom.save();
      console.log('✅ Default room created');
    }
  } catch (error) {
    console.error('❌ Error initializing default room:', error);
  }
};

initializeDefaultRoom();

// Utility functions
const getOnlineUsers = () => Array.from(onlineUsers.values());

// Socket.io connection handler with database
io.on('connection', async (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', async (userData) => {
    try {
      // Create or update user in database
      let user = await User.findOne({ socketId: socket.id });
      if (user) {
        user.status = 'online';
        user.lastSeen = new Date();
        user.username = userData.username;
        user.avatar = userData.avatar || user.avatar;
        user.currentRoom = 'general';
      } else {
        user = new User({
          socketId: socket.id,
          username: userData.username,
          avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=667eea&color=fff`,
          status: 'online',
          currentRoom: 'general'
        });
      }
      await user.save();

      // Add to online users map for real-time access
      onlineUsers.set(socket.id, user.toObject());

      // Join default room
      socket.join('general');
      const generalRoom = await Room.findOne({ id: 'general' });
      if (generalRoom) {
        if (!generalRoom.users.includes(socket.id)) {
          generalRoom.users.push(socket.id);
          await generalRoom.save();
        }
      }

      // Send room list and user list
      const allRooms = await Room.find({});
      socket.emit('room_list', allRooms.map(room => ({
        ...room.toObject(),
        userCount: room.users.length
      })));

      const onlineUsersList = getOnlineUsers();
      io.emit('user_list', onlineUsersList);
      
      // Send user joined notification
      io.to('general').emit('user_joined', user.toObject());

      // Send message history for general room
      const roomMessages = await Message.find({ roomId: 'general' })
        .sort({ timestamp: 1 })
        .limit(100);
      socket.emit('message_history', roomMessages);

      console.log(`👋 ${user.username} joined the chat`);
    } catch (error) {
      console.error('❌ Error in user_join:', error);
    }
  });

  // Handle chat messages with database
  socket.on('send_message', async (messageData) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const roomId = messageData.roomId || user.currentRoom || 'general';
      const message = new Message({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        sender: user.username,
        senderId: socket.id,
        senderAvatar: user.avatar,
        message: messageData.message,
        timestamp: new Date(),
        roomId: roomId,
        edited: false
      });

      await message.save();
      io.to(roomId).emit('receive_message', message.toObject());
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  });

  // Handle message editing with database
  socket.on('edit_message', async ({ messageId, newContent, roomId }) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const message = await Message.findOne({ id: messageId });
      if (message && message.senderId === socket.id) {
        message.message = newContent;
        message.edited = true;
        message.editTimestamp = new Date();
        await message.save();

        io.to(roomId).emit('message_edited', message.toObject());
        console.log(`✏️ Message ${messageId} edited by ${user.username}`);
      }
    } catch (error) {
      console.error('❌ Error editing message:', error);
    }
  });

  // Handle message deletion with database
  socket.on('delete_message', async ({ messageId, roomId }) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const message = await Message.findOne({ id: messageId });
      if (message && message.senderId === socket.id) {
        await Message.deleteOne({ id: messageId });
        
        // Also delete reactions
        await Reaction.deleteMany({ messageId });

        io.to(roomId).emit('message_deleted', { messageId, roomId });
        console.log(`🗑️ Message ${messageId} deleted by ${user.username}`);
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
    }
  });

  // Handle message reactions
  socket.on('message_reaction', async ({ messageId, emoji, roomId }) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      // Find or create reaction
      let reaction = await Reaction.findOne({ messageId, emoji });
      if (reaction) {
        if (!reaction.users.includes(socket.id)) {
          reaction.users.push(socket.id);
          reaction.usernames.push(user.username);
          reaction.count = reaction.users.length;
          await reaction.save();
        }
      } else {
        reaction = new Reaction({
          messageId,
          emoji,
          users: [socket.id],
          usernames: [user.username],
          count: 1
        });
        await reaction.save();
      }

      // Get all reactions for this message
      const messageReactions = await Reaction.find({ messageId });
      
      io.to(roomId).emit('message_reaction_added', {
        messageId,
        emoji,
        reactions: messageReactions,
        user: { id: socket.id, username: user.username }
      });
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
    }
  });

  // Handle reaction removal
  socket.on('remove_reaction', async ({ messageId, emoji, roomId }) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const reaction = await Reaction.findOne({ messageId, emoji });
      if (reaction) {
        const userIndex = reaction.users.indexOf(socket.id);
        if (userIndex !== -1) {
          reaction.users.splice(userIndex, 1);
          reaction.usernames.splice(userIndex, 1);
          reaction.count = reaction.users.length;
          
          if (reaction.count === 0) {
            await Reaction.deleteOne({ messageId, emoji });
          } else {
            await reaction.save();
          }
        }
      }

      // Get updated reactions for this message
      const messageReactions = await Reaction.find({ messageId });
      
      io.to(roomId).emit('message_reaction_removed', {
        messageId,
        emoji,
        reactions: messageReactions
      });
    } catch (error) {
      console.error('❌ Error removing reaction:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ isTyping, roomId }) => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    const room = roomId || user.currentRoom || 'general';
    
    if (isTyping) {
      typingUsers.set(socket.id, { 
        username: user.username, 
        roomId: room 
      });
    } else {
      typingUsers.delete(socket.id);
    }
    
    // Only send typing users for the specific room
    const roomTypingUsers = Array.from(typingUsers.values())
      .filter(t => t.roomId === room)
      .map(t => t.username);
    
    io.to(room).emit('typing_users', roomTypingUsers);
  });

  // Handle private messages
  socket.on('private_message', async ({ to, message }) => {
    try {
      const user = onlineUsers.get(socket.id);
      const targetUser = onlineUsers.get(to);
      
      if (user && targetUser) {
        const messageData = new Message({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          sender: user.username,
          senderId: socket.id,
          senderAvatar: user.avatar,
          message,
          timestamp: new Date(),
          isPrivate: true,
          recipient: targetUser.username,
          recipientId: to,
          roomId: `private_${[socket.id, to].sort().join('_')}`
        });

        await messageData.save();
        
        socket.to(to).emit('private_message', messageData.toObject());
        socket.emit('private_message', messageData.toObject());
      }
    } catch (error) {
      console.error('❌ Error sending private message:', error);
    }
  });

  // Handle room creation
  socket.on('create_room', async (roomData) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const room = new Room({
        id: roomId,
        name: roomData.name,
        description: roomData.description,
        createdBy: user.username,
        createdById: socket.id,
        users: [socket.id],
        isPrivate: roomData.isPrivate || false,
        createdAt: new Date().toISOString(),
        password: roomData.password || null
      });
      
      await room.save();
      
      // Move user to new room
      const previousRoom = user.currentRoom;
      if (previousRoom && previousRoom !== 'general') {
        socket.leave(previousRoom);
        const prevRoom = await Room.findOne({ id: previousRoom });
        if (prevRoom) {
          prevRoom.users = prevRoom.users.filter(id => id !== socket.id);
          await prevRoom.save();
        }
      }
      
      socket.join(roomId);
      user.currentRoom = roomId;
      await User.updateOne({ socketId: socket.id }, { currentRoom: roomId });
      
      socket.emit('room_created', room.toObject());
      socket.emit('room_joined', room.toObject());
      
      // Send empty message history for new room
      socket.emit('message_history', []);
      
      // Update room list for all users
      const allRooms = await Room.find({});
      io.emit('room_list', allRooms.map(r => ({
        ...r.toObject(),
        userCount: r.users.length
      })));
      
      console.log(`🏠 ${user.username} created room: ${roomData.name}`);
    } catch (error) {
      console.error('❌ Error creating room:', error);
    }
  });

  // Handle joining room
  socket.on('join_room', async (roomId) => {
    try {
      const user = onlineUsers.get(socket.id);
      const room = await Room.findOne({ id: roomId });
      
      if (user && room && (!room.isPrivate || room.users.includes(socket.id))) {
        // Leave current room
        const previousRoom = user.currentRoom;
        if (previousRoom) {
          socket.leave(previousRoom);
          const prevRoom = await Room.findOne({ id: previousRoom });
          if (prevRoom) {
            prevRoom.users = prevRoom.users.filter(id => id !== socket.id);
            await prevRoom.save();
            io.to(previousRoom).emit('user_left_room', {
              user: user,
              roomId: previousRoom
            });
          }
        }
        
        // Join new room
        socket.join(roomId);
        if (!room.users.includes(socket.id)) {
          room.users.push(socket.id);
          await room.save();
        }
        user.currentRoom = roomId;
        await User.updateOne({ socketId: socket.id }, { currentRoom: roomId });
        
        socket.emit('room_joined', room.toObject());
        
        // Send message history for the room
        const roomMessages = await Message.find({ roomId })
          .sort({ timestamp: 1 })
          .limit(100);
        socket.emit('message_history', roomMessages);
        
        io.to(roomId).emit('user_joined_room', {
          user: user,
          roomId: roomId
        });
        
        // Update room list for all users
        const allRooms = await Room.find({});
        io.emit('room_list', allRooms.map(r => ({
          ...r.toObject(),
          userCount: r.users.length
        })));
        
        console.log(`🚪 ${user.username} joined room: ${room.name}`);
      }
    } catch (error) {
      console.error('❌ Error joining room:', error);
    }
  });

  // Handle leaving room
  socket.on('leave_room', async (roomId) => {
    try {
      const user = onlineUsers.get(socket.id);
      const room = await Room.findOne({ id: roomId });
      
      if (user && room && room.id !== 'general') {
        socket.leave(roomId);
        room.users = room.users.filter(id => id !== socket.id);
        await room.save();
        
        user.currentRoom = 'general';
        await User.updateOne({ socketId: socket.id }, { currentRoom: 'general' });
        
        // Join general room
        socket.join('general');
        const generalRoom = await Room.findOne({ id: 'general' });
        if (generalRoom && !generalRoom.users.includes(socket.id)) {
          generalRoom.users.push(socket.id);
          await generalRoom.save();
        }
        
        socket.emit('room_left', roomId);
        socket.emit('room_joined', generalRoom.toObject());
        
        // Send message history for general room
        const generalMessages = await Message.find({ roomId: 'general' })
          .sort({ timestamp: 1 })
          .limit(100);
        socket.emit('message_history', generalMessages);
        
        io.to(roomId).emit('user_left_room', {
          user: user,
          roomId: roomId
        });
        
        io.to('general').emit('user_joined_room', {
          user: user,
          roomId: 'general'
        });
        
        // Update room list
        const allRooms = await Room.find({});
        io.emit('room_list', allRooms.map(r => ({
          ...r.toObject(),
          userCount: r.users.length
        })));
      }
    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  });

  // Handle user profile update
  socket.on('update_profile', async (profileData) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (user) {
        user.username = profileData.username || user.username;
        user.avatar = profileData.avatar || user.avatar;
        
        // Update in database
        await User.updateOne(
          { socketId: socket.id },
          { 
            username: profileData.username,
            avatar: profileData.avatar 
          }
        );
        
        // Update in online users map
        onlineUsers.set(socket.id, user);
        
        io.emit('user_list', getOnlineUsers());
        io.emit('profile_updated', user);
        console.log(`👤 Profile updated for ${user.username}`);
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
    }
  });

  // Handle file sharing
  socket.on('share_file', async (fileData) => {
    try {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const roomId = fileData.roomId || user.currentRoom || 'general';
      const message = new Message({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        sender: user.username,
        senderId: socket.id,
        senderAvatar: user.avatar,
        timestamp: new Date(),
        roomId: roomId,
        isFile: true,
        fileData: {
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          url: fileData.url
        },
        message: `Shared a file: ${fileData.name}`
      });
      
      await message.save();
      io.to(roomId).emit('receive_message', message.toObject());
    } catch (error) {
      console.error('❌ Error sharing file:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async (reason) => {
    try {
      const user = onlineUsers.get(socket.id);
      
      if (user) {
        // Update user status in database
        await User.updateOne(
          { socketId: socket.id },
          { 
            status: 'offline',
            lastSeen: new Date()
          }
        );
        
        // Remove from online users
        onlineUsers.delete(socket.id);
        
        // Remove user from all rooms in database
        await Room.updateMany(
          { users: socket.id },
          { $pull: { users: socket.id } }
        );
        
        io.emit('user_left', user);
        console.log(`👋 ${user.username} left the chat: ${reason}`);
      }
      
      // Clean up typing indicators
      typingUsers.delete(socket.id);
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
    }
  });

  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.log(`❌ Connection error for ${socket.id}:`, error);
  });
});

// API routes with database
app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const roomId = req.params.roomId || 'general';
    const roomMessages = await Message.find({ roomId })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(roomMessages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const onlineUsersList = getOnlineUsers();
    res.json(onlineUsersList);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const allRooms = await Room.find({});
    const roomList = allRooms.map(room => ({
      ...room.toObject(),
      userCount: room.users.length
    }));
    res.json(roomList);
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

app.get('/api/reactions/:messageId', async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const reactions = await Reaction.find({ messageId });
    res.json(reactions);
  } catch (error) {
    console.error('❌ Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const roomsCount = await Room.countDocuments();
    const messagesCount = await Message.countDocuments();
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'MongoDB',
      users: usersCount,
      online: onlineUsers.size,
      rooms: roomsCount,
      messages: messagesCount
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR',
      error: 'Database connection failed'
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Socket.io Chat Server with MongoDB is running',
    environment: process.env.NODE_ENV || 'development',
    version: '3.0.0',
    database: 'MongoDB',
    features: [
      'Real-time messaging with persistence',
      'Message reactions with database storage',
      'Message editing & deletion',
      'Multiple chat rooms with persistence',
      'Private messaging',
      'User profiles & avatars with database',
      'Typing indicators',
      'File sharing'
    ],
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`🗄️ Database: MongoDB`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Update all online users to offline
  try {
    await User.updateMany(
      { socketId: { $in: Array.from(onlineUsers.keys()) } },
      { 
        status: 'offline',
        lastSeen: new Date()
      }
    );
    console.log('✅ Updated user statuses before shutdown');
  } catch (error) {
    console.error('❌ Error updating user statuses:', error);
  }
  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server, io };