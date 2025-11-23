const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: String, required: true },
  createdById: { type: String, required: true },
  users: [{ type: String }], // array of socketIds
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  password: { type: String, default: null }
}, {
  timestamps: true
});

// Index for faster queries
roomSchema.index({ id: 1 });

module.exports = mongoose.model('Room', roomSchema);