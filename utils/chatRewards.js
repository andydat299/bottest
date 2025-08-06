/**
 * Chat Rewards System - Hệ thống thưởng xu khi chat
 */
import User from '../schemas/userSchema.js';

// Cấu hình chat rewards
const CHAT_REWARD_CONFIG = {
  channelId: '1363492195478540348', // Channel ID được chỉ định
  dropRate: 0.01, // 1% tỉ lệ rơi xu
  minCoins: 1,
  maxCoins: 1000,
  cooldown: 30000, // 30 giây cooldown mỗi user
  enabled: true
};

// Map lưu cooldown của từng user
const userCooldowns = new Map();

/**
 * Tạo số xu ngẫu nhiên trong khoảng min-max
 */
function generateRandomCoins() {
  return Math.floor(Math.random() * (CHAT_REWARD_CONFIG.maxCoins - CHAT_REWARD_CONFIG.minCoins + 1)) + CHAT_REWARD_CONFIG.minCoins;
}

/**
 * Kiểm tra cooldown của user
 */
function isUserOnCooldown(userId) {
  const lastReward = userCooldowns.get(userId);
  if (!lastReward) return false;
  
  const timePassed = Date.now() - lastReward;
  return timePassed < CHAT_REWARD_CONFIG.cooldown;
}

/**
 * Xử lý tin nhắn chat để kiểm tra và trao thưởng
 */
export async function processChatMessage(message) {
  try {
    // Bỏ qua nếu hệ thống bị tắt
    if (!CHAT_REWARD_CONFIG.enabled) return null;
    
    // Bỏ qua nếu không phải channel được chỉ định
    if (message.channel.id !== CHAT_REWARD_CONFIG.channelId) return null;
    
    // Bỏ qua bot messages
    if (message.author.bot) return null;
    
    // Kiểm tra cooldown
    if (isUserOnCooldown(message.author.id)) return null;
    
    // Kiểm tra tỉ lệ rơi (1%)
    const roll = Math.random();
    if (roll > CHAT_REWARD_CONFIG.dropRate) return null;
    
    // Tạo số xu thưởng
    const rewardCoins = generateRandomCoins();
    
    // Cập nhật database
    const user = await User.findOneAndUpdate(
      { userId: message.author.id },
      { 
        $inc: { 
          money: rewardCoins,
          'stats.totalChatRewards': rewardCoins,
          'stats.chatRewardCount': 1
        }
      },
      { upsert: true, new: true }
    );
    
    // Đặt cooldown
    userCooldowns.set(message.author.id, Date.now());
    
    // Trả về thông tin thưởng
    return {
      success: true,
      userId: message.author.id,
      username: message.author.username,
      coins: rewardCoins,
      newBalance: user.money,
      channel: message.channel.name
    };
    
  } catch (error) {
    console.error('Error processing chat reward:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lấy thống kê chat rewards của user
 */
export async function getChatRewardStats(userId) {
  try {
    const user = await User.findOne({ userId });
    if (!user) return null;
    
    return {
      totalRewards: user.stats?.totalChatRewards || 0,
      rewardCount: user.stats?.chatRewardCount || 0,
      averageReward: user.stats?.chatRewardCount ? 
        Math.round((user.stats.totalChatRewards || 0) / user.stats.chatRewardCount) : 0
    };
  } catch (error) {
    console.error('Error getting chat reward stats:', error);
    return null;
  }
}

/**
 * Admin functions - Quản lý hệ thống chat rewards
 */

/**
 * Bật/tắt hệ thống chat rewards
 */
export function toggleChatRewards(enabled = null) {
  if (enabled !== null) {
    CHAT_REWARD_CONFIG.enabled = enabled;
  } else {
    CHAT_REWARD_CONFIG.enabled = !CHAT_REWARD_CONFIG.enabled;
  }
  
  return {
    success: true,
    enabled: CHAT_REWARD_CONFIG.enabled,
    message: CHAT_REWARD_CONFIG.enabled ? 
      '🟢 Chat rewards đã được BẬT' : 
      '🔴 Chat rewards đã được TẮT'
  };
}

/**
 * Thay đổi tỉ lệ rơi xu
 */
export function setChatDropRate(rate) {
  if (rate < 0 || rate > 1) {
    return {
      success: false,
      message: '❌ Tỉ lệ phải từ 0.001 đến 1.0 (0.1% - 100%)'
    };
  }
  
  const oldRate = CHAT_REWARD_CONFIG.dropRate;
  CHAT_REWARD_CONFIG.dropRate = rate;
  
  return {
    success: true,
    oldRate: (oldRate * 100).toFixed(1),
    newRate: (rate * 100).toFixed(1),
    message: `📊 Đã thay đổi tỉ lệ rơi xu từ ${(oldRate * 100).toFixed(1)}% thành ${(rate * 100).toFixed(1)}%`
  };
}

/**
 * Thay đổi khoảng xu thưởng
 */
export function setChatRewardRange(min, max) {
  if (min < 1 || max < min || max > 100000) {
    return {
      success: false,
      message: '❌ Khoảng xu không hợp lệ! (Min: 1, Max: 100000, Min < Max)'
    };
  }
  
  const oldMin = CHAT_REWARD_CONFIG.minCoins;
  const oldMax = CHAT_REWARD_CONFIG.maxCoins;
  
  CHAT_REWARD_CONFIG.minCoins = min;
  CHAT_REWARD_CONFIG.maxCoins = max;
  
  return {
    success: true,
    oldRange: `${oldMin}-${oldMax}`,
    newRange: `${min}-${max}`,
    message: `💰 Đã thay đổi khoảng xu từ ${oldMin}-${oldMax} thành ${min}-${max}`
  };
}

/**
 * Thay đổi cooldown
 */
export function setChatCooldown(seconds) {
  if (seconds < 1 || seconds > 3600) {
    return {
      success: false,
      message: '❌ Cooldown phải từ 1-3600 giây (1 giây - 1 giờ)'
    };
  }
  
  const oldCooldown = CHAT_REWARD_CONFIG.cooldown;
  CHAT_REWARD_CONFIG.cooldown = seconds * 1000;
  
  return {
    success: true,
    oldCooldown: oldCooldown / 1000,
    newCooldown: seconds,
    message: `⏱️ Đã thay đổi cooldown từ ${oldCooldown / 1000}s thành ${seconds}s`
  };
}

/**
 * Lấy cấu hình hiện tại
 */
export function getChatRewardConfig() {
  return {
    enabled: CHAT_REWARD_CONFIG.enabled,
    channelId: CHAT_REWARD_CONFIG.channelId,
    dropRate: CHAT_REWARD_CONFIG.dropRate,
    dropRatePercent: (CHAT_REWARD_CONFIG.dropRate * 100).toFixed(1),
    minCoins: CHAT_REWARD_CONFIG.minCoins,
    maxCoins: CHAT_REWARD_CONFIG.maxCoins,
    cooldownSeconds: CHAT_REWARD_CONFIG.cooldown / 1000,
    activeCooldowns: userCooldowns.size
  };
}

/**
 * Xóa cooldown của một user (admin)
 */
export function clearUserCooldown(userId) {
  const hadCooldown = userCooldowns.has(userId);
  userCooldowns.delete(userId);
  
  return {
    success: true,
    hadCooldown,
    message: hadCooldown ? 
      '✅ Đã xóa cooldown của user' : 
      'ℹ️ User không có cooldown'
  };
}

/**
 * Xóa tất cả cooldowns (admin)
 */
export function clearAllCooldowns() {
  const count = userCooldowns.size;
  userCooldowns.clear();
  
  return {
    success: true,
    clearedCount: count,
    message: `🧹 Đã xóa ${count} cooldown`
  };
}
