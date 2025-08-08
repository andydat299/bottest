import mongoose from 'mongoose';

const mysteryBoxSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  boxType: {
    type: String,
    enum: ['basic', 'mega', 'diamond'],
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  rewards: [{
    type: {
      type: String,
      enum: ['xu', 'vip', 'item', 'multiplier', 'special'],
      required: true
    },
    name: String,
    value: Number,
    duration: Number, // for temporary items
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical']
    }
  }],
  totalValue: {
    type: Number,
    default: 0
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical']
  }
}, {
  timestamps: true
});

// Index for performance
mysteryBoxSchema.index({ userId: 1 });
mysteryBoxSchema.index({ boxType: 1 });
mysteryBoxSchema.index({ openedAt: 1 });

export const MysteryBox = mongoose.model('MysteryBox', mysteryBoxSchema);