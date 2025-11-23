const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sender: { type: String, required: true },
  senderId: { type: String, required: true },
  senderAvatar: { type: String, default: '' },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  roomId: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
  recipient: { type: String, default: '' },
  recipientId: { type: String, default: '' },
  edited: { type: Boolean, default: false },
  editTimestamp: { type: Date },
  isFile: { type: Boolean, default: false },
  fileData: {
    name: String,
    type: String,
    size: Number,
    url: String
  },
  system: { type: Boolean, default: false },
  reactions: [{
    emoji: String,
    users: [String],
    usernames: [String],
    count: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ roomId: 1, timestamp: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ id: 1 });

module.exports = mongoose.model('Message', messageSchema);