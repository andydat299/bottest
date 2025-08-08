import mongoose from 'mongoose';

const autoFishingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  sessionStartTime: {
    type: Date,
    default: null
  },
  sessionEndTime: {
    type: Date,
    default: null
  },
  remainingTimeToday: {
    type: Number, // minutes
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  totalFishCaught: {
    type: Number,
    default: 0
  },
  totalXuEarned: {
    type: Number,
    default: 0
  },
  settings: {
    autoSell: { type: Boolean, default: true },
    fishingRod: { type: String, default: 'basic' },
    targetFishTypes: [{ type: String }],
    maxSessionLength: { type: Number, default: 120 } // minutes
  },
  history: [{
    date: Date,
    duration: Number, // minutes
    fishCaught: Number,
    xuEarned: Number,
    vipTier: String
  }]
}, {
  timestamps: true
});

// Index for performance
autoFishingSchema.index({ userId: 1 });
autoFishingSchema.index({ isActive: 1 });
autoFishingSchema.index({ lastResetDate: 1 });

export const AutoFishing = mongoose.model('AutoFishing', autoFishingSchema);