import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  rodLevel: { type: Number, default: 1 },
  rodDurability: { type: Number, default: 100 }, // Độ bền cần câu (0-100)
  rodMaxDurability: { type: Number, default: 100 }, // Độ bền tối đa
  currentFishingLocation: { type: String, default: 'LAKE' }, // Địa điểm câu cá hiện tại
  experience: { type: Number, default: 0 }, // Kinh nghiệm
  fish: { type: Map, of: Number, default: {} },
  balance: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
  fishingStats: {
    totalFishingAttempts: { type: Number, default: 0 }, // Tổng lần câu
    successfulCatches: { type: Number, default: 0 },    // Lần câu thành công
    missedCatches: { type: Number, default: 0 },        // Lần câu hụt
    totalMoneyLostToMisses: { type: Number, default: 0 }, // Tổng xu mất do hụt
    biggestSingleLoss: { type: Number, default: 0 }     // Mất nhiều nhất 1 lần
  },
  dailyLossStats: { 
    type: Map, 
    of: {
      totalLost: { type: Number, default: 0 },
      lossCount: { type: Number, default: 0 }
    }, 
    default: {} 
  }, // Format: 'YYYY-MM-DD' -> { totalLost, lossCount }
  chatStats: {
    totalMessages: { type: Number, default: 0 },
    dailyMessages: { type: Map, of: Number, default: {} }, // Format: 'YYYY-MM-DD' -> count
    lastMessageDate: { type: String, default: '' }
  },
  stats: {
    totalChatRewards: { type: Number, default: 0 }, // Tổng xu nhận từ chat
    chatRewardCount: { type: Number, default: 0 },   // Số lần nhận thưởng chat
    blackjackGames: { type: Number, default: 0 },    // Số game blackjack đã chơi
    blackjackWinnings: { type: Number, default: 0 }, // Tổng thắng/thua blackjack
    wheelGames: { type: Number, default: 0 },        // Số lần chơi vòng quay
    wheelWinnings: { type: Number, default: 0 }      // Tổng thắng/thua vòng quay
  }
});

export const User = mongoose.model('User', userSchema);
