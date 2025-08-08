import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  lastFishTime: {
    type: Date,
    default: null
  },
  fishingLuck: {
    successRate: {
      type: Number,
      default: null // null = use default rate (70%)
    },
    rareRate: {
      type: Number,
      default: null // null = use default rate (15%)
    },
    expiresAt: {
      type: Date,
      default: null
    },
    setBy: {
      type: String,
      default: null
    },
    setAt: {
      type: Date,
      default: null
    }
  },
  totalFishCaught: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index cho performance
userSchema.index({ discordId: 1 });
userSchema.index({ 'fishingLuck.expiresAt': 1 });

export const User = mongoose.model('User', userSchema);