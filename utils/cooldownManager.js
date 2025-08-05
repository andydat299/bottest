// Map để lưu trữ cooldown của từng user
const fishingCooldowns = new Map();

/**
 * Kiểm tra xem user có đang trong cooldown không
 * @param {string} userId - Discord user ID
 * @returns {object} - { isOnCooldown: boolean, remainingTime: number }
 */
export function checkFishingCooldown(userId) {
  if (!fishingCooldowns.has(userId)) {
    return { isOnCooldown: false, remainingTime: 0 };
  }

  const cooldownEnd = fishingCooldowns.get(userId);
  const now = Date.now();
  
  if (now >= cooldownEnd) {
    fishingCooldowns.delete(userId);
    return { isOnCooldown: false, remainingTime: 0 };
  }

  const remainingTime = Math.ceil((cooldownEnd - now) / 1000);
  return { isOnCooldown: true, remainingTime };
}

/**
 * Đặt cooldown cho user
 * @param {string} userId - Discord user ID
 * @param {number} seconds - Số giây cooldown (mặc định 15s)
 */
export function setFishingCooldown(userId, seconds = 15) {
  const cooldownEnd = Date.now() + (seconds * 1000);
  fishingCooldowns.set(userId, cooldownEnd);
}

/**
 * Xóa cooldown của user (khi hoàn thành câu cá)
 * @param {string} userId - Discord user ID
 */
export function clearFishingCooldown(userId) {
  fishingCooldowns.delete(userId);
}

/**
 * Lấy tất cả cooldowns hiện tại (để debug)
 * @returns {Map} - Map của tất cả cooldowns
 */
export function getAllCooldowns() {
  return fishingCooldowns;
}

/**
 * Format thời gian còn lại thành chuỗi dễ đọc
 * @param {number} seconds - Số giây
 * @returns {string} - Chuỗi thời gian
 */
export function formatCooldownTime(seconds) {
  if (seconds < 60) {
    return `${seconds} giây`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} phút`;
  }
  
  return `${minutes} phút ${remainingSeconds} giây`;
}
