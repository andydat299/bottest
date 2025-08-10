import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  coins: { type: Number, default: 1000 },
  experience: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  fishCaught: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  dailyStreak: { type: Number, default: 0 },
  lastWork: { type: Date, default: null },
  inventory: [{
    itemId: String,
    name: String,
    quantity: { type: Number, default: 1 },
    rarity: String,
    value: Number,
    acquiredAt: { type: Date, default: Date.now }
  }],
  achievements: [{
    id: String,
    name: String,
    description: String,
    unlockedAt: { type: Date, default: Date.now },
    reward: Number
  }],
  stats: {
    totalFished: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    loginDays: { type: Number, default: 0 },
    commandsUsed: { type: Number, default: 0 }
  },
  settings: {
    notifications: { type: Boolean, default: true },
    privacy: { type: String, enum: ['public', 'private'], default: 'public' },
    language: { type: String, default: 'vi' }
  },
  cooldowns: {
    fish: { type: Date, default: null },
    daily: { type: Date, default: null },
    work: { type: Date, default: null }
  },
  autoFishingToday: {
    date: { type: String, default: null },
    minutes: { type: Number, default: 0 }
  },
  banned: { type: Boolean, default: false },
  banReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { bufferCommands: false });

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Methods
userSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  const newLevel = Math.floor(this.experience / 1000) + 1;
  const leveledUp = newLevel > this.level;
  this.level = newLevel;
  return leveledUp;
};

userSchema.methods.canUseCommand = function(commandName, cooldownMinutes = 0) {
  if (cooldownMinutes === 0) return true;
  
  const lastUsed = this.cooldowns[commandName];
  if (!lastUsed) return true;
  
  const timeDiff = Date.now() - lastUsed.getTime();
  const cooldownTime = cooldownMinutes * 60 * 1000;
  
  return timeDiff >= cooldownTime;
};

userSchema.methods.setCooldown = function(commandName) {
  this.cooldowns[commandName] = new Date();
};

userSchema.methods.addToInventory = function(item) {
  const existingItem = this.inventory.find(invItem => invItem.itemId === item.itemId);
  
  if (existingItem) {
    existingItem.quantity += item.quantity || 1;
  } else {
    this.inventory.push(item);
  }
};

userSchema.methods.removeFromInventory = function(itemId, quantity = 1) {
  const itemIndex = this.inventory.findIndex(item => item.itemId === itemId);
  
  if (itemIndex !== -1) {
    const item = this.inventory[itemIndex];
    item.quantity -= quantity;
    
    if (item.quantity <= 0) {
      this.inventory.splice(itemIndex, 1);
    }
    
    return true;
  }
  
  return false;
};

export default mongoose.models.User || mongoose.model('User', userSchema);