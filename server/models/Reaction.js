const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  emoji: { type: String, required: true },
  users: [{ type: String }], // array of user socketIds
  usernames: [{ type: String }],
  count: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Compound index for faster queries
reactionSchema.index({ messageId: 1, emoji: 1 }, { unique: true });

module.exports = mongoose.model('Reaction', reactionSchema);