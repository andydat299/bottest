import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  rodLevel: { type: Number, default: 1 },
  fish: { type: Map, of: Number, default: {} },
  balance: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  fishingStats: {
    totalFishingAttempts: { type: Number, default: 0 }, // Tổng lần câu
    successfulCatches: { type: Number, default: 0 },    // Lần câu thành công
    missedCatches: { type: Number, default: 0 }         // Lần câu hụt
  },
  chatStats: {
    totalMessages: { type: Number, default: 0 },
    dailyMessages: { type: Map, of: Number, default: {} }, // Format: 'YYYY-MM-DD' -> count
    lastMessageDate: { type: String, default: '' }
  }
});

export const User = mongoose.model('User', userSchema);
