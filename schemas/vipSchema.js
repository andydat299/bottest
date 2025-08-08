import mongoose from 'mongoose';

const vipSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  currentTier: {
    type: String,
    enum: ['none', 'bronze', 'silver', 'gold', 'diamond'],
    default: 'none'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  purchasedBy: {
    type: String, // Admin or self
    default: 'self'
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  benefits: {
    fishingMissReduction: { type: Number, default: 0 }, // Percentage reduction
    rareFishBoost: { type: Number, default: 0 }, // Percentage boost
    dailyBonus: { type: Number, default: 0 }, // Extra xu per day
    casinoWinBoost: { type: Number, default: 0 }, // Win rate boost
    cooldownReduction: { type: Number, default: 0 }, // Percentage reduction
    shopDiscount: { type: Number, default: 0 }, // Percentage discount
    mysteryBoxChance: { type: Number, default: 0 }, // Daily mystery box chance
    automationHours: { type: Number, default: 0 }, // Auto-fishing hours per day
    hasNoCooldowns: { type: Boolean, default: false },
    hasFullAutomation: { type: Boolean, default: false },
    accessVipTables: { type: Boolean, default: false },
    accessPrivateRooms: { type: Boolean, default: false }
  },
  purchaseHistory: [{
    tier: String,
    duration: Number, // days
    cost: Number,
    purchasedAt: Date,
    purchasedBy: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
vipSchema.index({ userId: 1 });
vipSchema.index({ expiresAt: 1 });
vipSchema.index({ currentTier: 1 });

export const VIP = mongoose.model('VIP', vipSchema);