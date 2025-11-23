const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatar: { type: String, default: '👤' },
  status: { type: String, enum: ['online', 'offline'], default: 'online' },
  lastSeen: { type: Date, default: Date.now },
  joinTime: { type: Date, default: Date.now },
  currentRoom: { type: String, default: 'general' }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ socketId: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);