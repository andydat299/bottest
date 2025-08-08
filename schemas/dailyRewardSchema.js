import mongoose from 'mongoose';

const dailyRewardSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  lastClaimDate: {
    type: Date,
    default: null
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  totalClaims: {
    type: Number,
    default: 0
  },
  totalRewards: {
    type: Number,
    default: 0
  },
  monthlyRewardsClaimed: {
    type: Number,
    default: 0
  },
  lastMonthReset: {
    type: Date,
    default: new Date()
  },
  specialRewardsUnlocked: [{
    type: String,
    name: String,
    unlockedAt: Date
  }],
  wheelSpinUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index cho performance
dailyRewardSchema.index({ userId: 1 });
dailyRewardSchema.index({ lastClaimDate: 1 });

export const DailyReward = mongoose.model('DailyReward', dailyRewardSchema);