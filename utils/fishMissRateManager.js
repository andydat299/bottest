/**
 * Utility để quản lý custom fish miss rate
 */

/**
 * Lấy tỷ lệ hụt cá thực tế cho user (custom hoặc default)
 * @param {Object} user - User object từ database
 * @param {number} defaultMissRate - Tỷ lệ hụt mặc định của game
 * @returns {number} - Tỷ lệ hụt thực tế (0-100)
 */
export function getActualMissRate(user, defaultMissRate = 15) {
  // Kiểm tra có custom miss rate không
  if (!user || !user.customFishMissRate || !user.customFishMissRate.isActive) {
    return defaultMissRate;
  }

  const customRate = user.customFishMissRate;
  
  // Kiểm tra hết hạn
  if (customRate.expiresAt && new Date() > customRate.expiresAt) {
    // Custom rate đã hết hạn, return default
    console.log(`⏰ Custom miss rate expired for user ${user.username}`);
    return defaultMissRate;
  }

  // Return custom rate
  console.log(`🎯 Using custom miss rate ${customRate.rate}% for user ${user.username}`);
  return customRate.rate;
}

/**
 * Kiểm tra user có bị miss cá không dựa trên custom rate
 * @param {Object} user - User object từ database  
 * @param {number} defaultMissRate - Tỷ lệ hụt mặc định
 * @returns {boolean} - true nếu hụt cá
 */
export function checkFishMiss(user, defaultMissRate = 15) {
  const actualMissRate = getActualMissRate(user, defaultMissRate);
  const randomValue = Math.random() * 100;
  
  const willMiss = randomValue < actualMissRate;
  
  console.log(`🎣 Fish miss check for ${user?.username || 'unknown'}:`);
  console.log(`   - Miss rate: ${actualMissRate}%`);
  console.log(`   - Random: ${randomValue.toFixed(2)}`);
  console.log(`   - Result: ${willMiss ? 'MISS' : 'HIT'}`);
  
  return willMiss;
}

/**
 * Lấy thông tin về custom miss rate của user
 * @param {Object} user - User object từ database
 * @returns {Object|null} - Thông tin custom rate hoặc null
 */
export function getCustomMissRateInfo(user) {
  if (!user || !user.customFishMissRate || !user.customFishMissRate.isActive) {
    return null;
  }

  const customRate = user.customFishMissRate;
  
  // Kiểm tra hết hạn
  if (customRate.expiresAt && new Date() > customRate.expiresAt) {
    return {
      ...customRate.toObject(),
      isExpired: true,
      status: 'expired'
    };
  }

  return {
    ...customRate.toObject(),
    isExpired: false,
    status: 'active'
  };
}

/**
 * Auto-cleanup expired custom miss rates
 * @param {Object} User - User model
 * @returns {number} - Số records đã cleanup
 */
export async function cleanupExpiredMissRates(User) {
  try {
    const now = new Date();
    
    // Tìm users có custom miss rate đã hết hạn
    const expiredUsers = await User.find({
      'customFishMissRate.expiresAt': { $lt: now },
      'customFishMissRate.isActive': true
    });

    let cleanedCount = 0;
    
    for (const user of expiredUsers) {
      user.customFishMissRate = undefined;
      await user.save();
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired custom miss rates`);
    }

    return cleanedCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired miss rates:', error);
    return 0;
  }
}

/**
 * Lấy emoji trạng thái miss rate
 * @param {number} missRate - Tỷ lệ hụt (0-100)
 * @returns {string} - Emoji tương ứng
 */
export function getMissRateEmoji(missRate) {
  if (missRate === 0) return '✨'; // Không bao giờ hụt
  if (missRate === 100) return '💀'; // Luôn hụt
  if (missRate <= 5) return '🍀'; // Rất may mắn
  if (missRate <= 15) return '😊'; // May mắn
  if (missRate <= 30) return '😐'; // Bình thường
  if (missRate <= 50) return '😕'; // Hơi xui
  if (missRate <= 80) return '😞'; // Xui
  if (missRate < 100) return '😈'; // Rất xui
  return '🎲'; // Default
}

/**
 * Lấy mô tả trạng thái miss rate
 * @param {number} missRate - Tỷ lệ hụt (0-100)
 * @returns {string} - Mô tả trạng thái
 */
export function getMissRateDescription(missRate) {
  if (missRate === 0) return 'Không bao giờ hụt';
  if (missRate === 100) return 'Luôn luôn hụt';
  if (missRate <= 5) return 'Cực kỳ may mắn';
  if (missRate <= 15) return 'Rất may mắn';
  if (missRate <= 30) return 'May mắn';
  if (missRate <= 50) return 'Bình thường';
  if (missRate <= 80) return 'Hơi xui xẻo';
  if (missRate < 100) return 'Rất xui xẻo';
  return 'Tùy chỉnh';
}