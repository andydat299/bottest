/**
 * Fishing Penalty System - Hệ thống phạt xu khi hụt cá
 */
import { logMoneyDeducted } from './logger.js';

// Admin controls
let penaltySystemEnabled = true;
let dailyLossLimit = 5000; // Giới hạn 5k xu/ngày
let penaltyMultiplier = 1.0; // Hệ số điều chỉnh phạt

// Lý do rớt xu ngẫu nhiên
const PENALTY_REASONS = [
  'Cần câu bị hỏng',
  'Mồi câu trôi mất',
  'Thuê thuyền',
  'Dụng cụ hư hại',
  'Cước phí câu cá',
  'Trang bị bảo trì',
  'Phí sử dụng bến cảng',
  'Mất hook câu cá'
];

/**
 * Tính toán số xu bị phạt khi hụt cá
 */
export function calculateFishingPenalty(user, locationId, rodLevel) {
  if (!penaltySystemEnabled) return 0;
  
  // Kiểm tra daily limit
  const today = new Date().toISOString().split('T')[0];
  if (!user.dailyLossStats) {
    user.dailyLossStats = {};
  }
  
  if (!user.dailyLossStats[today]) {
    user.dailyLossStats[today] = {
      totalLost: 0,
      lossCount: 0
    };
  }
  
  const todayStats = user.dailyLossStats[today];
  
  // Nếu đã đạt giới hạn hôm nay
  if (todayStats.totalLost >= dailyLossLimit) {
    return 0;
  }
  
  // Tính base penalty
  let basePenalty = 8 + Math.floor(Math.random() * 12); // 8-19 xu
  
  // Location modifier
  const locationPenalty = getLocationPenalty(locationId);
  basePenalty += locationPenalty;
  
  // Rod level modifier
  const rodPenalty = getRodLevelPenalty(rodLevel);
  basePenalty += rodPenalty;
  
  // Apply multiplier
  basePenalty = Math.floor(basePenalty * penaltyMultiplier);
  
  // Progressive scaling - giảm dần khi gần giới hạn
  const remainingBudget = dailyLossLimit - todayStats.totalLost;
  if (remainingBudget < 1000) {
    // Giảm 50% khi còn dưới 1000 xu
    basePenalty = Math.floor(basePenalty * 0.5);
  } else if (remainingBudget < 2000) {
    // Giảm 25% khi còn dưới 2000 xu
    basePenalty = Math.floor(basePenalty * 0.75);
  }
  
  // Protection cho newbie
  if (user.balance < 50) {
    basePenalty = Math.min(basePenalty, 2);
  }
  
  // Đảm bảo không vượt quá giới hạn hàng ngày
  basePenalty = Math.min(basePenalty, remainingBudget);
  
  // Minimum và maximum
  basePenalty = Math.max(basePenalty, 1);
  basePenalty = Math.min(basePenalty, 50);
  
  return basePenalty;
}

/**
 * Lấy penalty dựa trên location
 */
function getLocationPenalty(locationId) {
  const locationPenalties = {
    'lake': 0,
    'river': 3,
    'ocean': 8,
    'deep_sea': 15,
    'ice_lake': 12,
    'volcanic_lake': 18,
    'mystical_pond': 22
  };
  
  return locationPenalties[locationId] || 0;
}

/**
 * Lấy penalty dựa trên rod level
 */
function getRodLevelPenalty(rodLevel) {
  if (rodLevel <= 3) return 0;
  if (rodLevel <= 6) return 3;
  if (rodLevel <= 9) return 6;
  return 10;
}

/**
 * Áp dụng penalty và cập nhật user stats
 */
export async function applyFishingPenalty(user, penalty, locationId) {
  if (penalty <= 0) return null;
  
  // Trừ xu
  user.balance = Math.max(0, user.balance - penalty);
  
  // Cập nhật daily stats
  const today = new Date().toISOString().split('T')[0];
  if (!user.dailyLossStats) {
    user.dailyLossStats = {};
  }
  
  if (!user.dailyLossStats[today]) {
    user.dailyLossStats[today] = {
      totalLost: 0,
      lossCount: 0
    };
  }
  
  user.dailyLossStats[today].totalLost += penalty;
  user.dailyLossStats[today].lossCount += 1;
  
  // Cập nhật overall stats
  if (!user.fishingStats.totalMoneyLostToMisses) {
    user.fishingStats.totalMoneyLostToMisses = 0;
  }
  if (!user.fishingStats.biggestSingleLoss) {
    user.fishingStats.biggestSingleLoss = 0;
  }
  
  user.fishingStats.totalMoneyLostToMisses += penalty;
  user.fishingStats.biggestSingleLoss = Math.max(
    user.fishingStats.biggestSingleLoss, 
    penalty
  );
  
  // Random reason
  const reason = PENALTY_REASONS[Math.floor(Math.random() * PENALTY_REASONS.length)];
  
  // Log money deducted
  await logMoneyDeducted(user, penalty, 'fishing-penalty', {
    reason: reason,
    locationId: locationId
  });
  
  // Tính remaining budget
  const remainingBudget = dailyLossLimit - user.dailyLossStats[today].totalLost;
  
  return {
    penalty,
    reason,
    newBalance: user.balance,
    todayLost: user.dailyLossStats[today].totalLost,
    remainingBudget: Math.max(0, remainingBudget),
    isNearLimit: remainingBudget < 1000,
    isAtLimit: remainingBudget <= 0
  };
}

/**
 * Lấy thống kê daily loss của user
 */
export function getDailyLossStats(user) {
  const today = new Date().toISOString().split('T')[0];
  if (!user.dailyLossStats || !user.dailyLossStats[today]) {
    return {
      totalLost: 0,
      lossCount: 0,
      remainingBudget: dailyLossLimit,
      percentUsed: 0
    };
  }
  
  const todayStats = user.dailyLossStats[today];
  const remainingBudget = Math.max(0, dailyLossLimit - todayStats.totalLost);
  const percentUsed = Math.floor((todayStats.totalLost / dailyLossLimit) * 100);
  
  return {
    totalLost: todayStats.totalLost,
    lossCount: todayStats.lossCount,
    remainingBudget,
    percentUsed,
    isNearLimit: remainingBudget < 1000,
    isAtLimit: remainingBudget <= 0
  };
}

// ============== ADMIN CONTROLS ==============

/**
 * Bật/tắt hệ thống penalty
 */
export function enablePenaltySystem() {
  penaltySystemEnabled = true;
  return '✅ Đã BẬT hệ thống phạt xu khi hụt cá!';
}

export function disablePenaltySystem() {
  penaltySystemEnabled = false;
  return '❌ Đã TẮT hệ thống phạt xu khi hụt cá!';
}

/**
 * Điều chỉnh giới hạn hàng ngày
 */
export function setDailyLossLimit(newLimit) {
  if (newLimit < 100 || newLimit > 50000) {
    return '❌ Giới hạn phải từ 100 đến 50,000 xu!';
  }
  
  dailyLossLimit = newLimit;
  return `⚙️ Đã đặt giới hạn hàng ngày: ${newLimit.toLocaleString()} xu!`;
}

/**
 * Điều chỉnh hệ số phạt
 */
export function setPenaltyMultiplier(multiplier) {
  if (multiplier < 0.1 || multiplier > 5.0) {
    return '❌ Hệ số phạt phải từ 0.1 đến 5.0!';
  }
  
  penaltyMultiplier = multiplier;
  return `⚙️ Đã đặt hệ số phạt: ${multiplier}x!`;
}

/**
 * Lấy trạng thái hệ thống penalty
 */
export function getPenaltySystemStatus() {
  return {
    enabled: penaltySystemEnabled,
    dailyLimit: dailyLossLimit,
    multiplier: penaltyMultiplier,
    status: penaltySystemEnabled ? '🟢 ONLINE' : '🔴 OFFLINE'
  };
}
