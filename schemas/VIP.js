import mongoose from 'mongoose';

const vipSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  vipTier: { type: String, enum: ['basic', 'premium', 'ultimate', 'lifetime'], default: null },
  vipExpireAt: { type: Date, default: null },
  vipBenefits: {
    coinMultiplier: { type: Number, default: 1 },
    fishingBonus: { type: Number, default: 1 },
    dailyBonus: { type: Number, default: 1 },
    workBonus: { type: Number, default: 1 },
    autoFishingTime: { type: Number, default: 0 },
    color: { type: String, default: '#0099ff' }
  },
  vipPurchaseHistory: [{
    tier: String,
    duration: Number,
    price: Number,
    paymentMethod: String,
    transactionId: String,
    purchasedAt: { type: Date, default: Date.now }
  }],
  vipStats: {
    totalSpent: { type: Number, default: 0 },
    totalDaysActive: { type: Number, default: 0 },
    lastUsed: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { bufferCommands: false });

vipSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
vipSchema.methods.isVipActive = function() {
  if (this.vipTier === 'lifetime') return true;
  if (!this.vipExpireAt) return false;
  return new Date() < this.vipExpireAt;
};

vipSchema.methods.extendVip = function(days) {
  if (this.vipTier === 'lifetime') return;
  
  const now = new Date();
  if (!this.vipExpireAt || this.vipExpireAt < now) {
    this.vipExpireAt = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  } else {
    this.vipExpireAt = new Date(this.vipExpireAt.getTime() + (days * 24 * 60 * 60 * 1000));
  }
};

vipSchema.methods.getRemainingDays = function() {
  if (this.vipTier === 'lifetime') return 'Vĩnh viễn';
  if (!this.vipExpireAt) return 0;
  
  const now = new Date();
  if (this.vipExpireAt < now) return 0;
  
  return Math.ceil((this.vipExpireAt - now) / (24 * 60 * 60 * 1000));
};

export default mongoose.models.VIP || mongoose.model('VIP', vipSchema);