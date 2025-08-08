/**
 * Auto-Fishing System Utilities
 */

/**
 * Get auto-fishing limits based on VIP tier
 * @param {string} vipTier - VIP tier (bronze, silver, gold, diamond)
 * @returns {Object} Auto-fishing configuration
 */
export function getAutoFishingLimits(vipTier) {
  const limits = {
    none: { enabled: false, dailyMinutes: 0, name: 'Không có' },
    bronze: { enabled: false, dailyMinutes: 0, name: 'VIP Đồng' },
    silver: { enabled: false, dailyMinutes: 0, name: 'VIP Bạc' },
    gold: { enabled: true, dailyMinutes: 120, name: 'VIP Vàng' }, // 2 hours
    diamond: { enabled: true, dailyMinutes: 1440, name: 'VIP Kim Cương' } // 24 hours
  };
  
  return limits[vipTier] || limits.none;
}

/**
 * Calculate fishing results for auto-fishing session
 * @param {number} durationMinutes - Session duration in minutes
 * @param {Object} vipBenefits - VIP benefits object
 * @param {Object} settings - Auto-fishing settings
 * @returns {Object} Fishing results
 */
export function calculateAutoFishingResults(durationMinutes, vipBenefits, settings = {}) {
  const results = {
    totalAttempts: 0,
    fishCaught: 0,
    fishMissed: 0,
    totalXu: 0,
    fishByType: {},
    efficiency: 0
  };

  // Base fishing rate: 1 attempt per 30 seconds
  const baseAttemptInterval = 30; // seconds
  const totalSeconds = durationMinutes * 60;
  results.totalAttempts = Math.floor(totalSeconds / baseAttemptInterval);

  // Apply VIP miss rate reduction
  const baseMissRate = 15; // 15% base miss rate
  const actualMissRate = Math.max(0, baseMissRate - (vipBenefits.fishingMissReduction || 0));

  // Fish types with probabilities
  const fishTypes = [
    { name: 'Cá Nhỏ', value: 50, probability: 0.5, emoji: '🐟' },
    { name: 'Cá Vừa', value: 100, probability: 0.3, emoji: '🐠' },
    { name: 'Cá Lớn', value: 200, probability: 0.15, emoji: '🐡' },
    { name: 'Cá Hiếm', value: 500, probability: 0.04, emoji: '🦈' },
    { name: 'Cá Huyền Thoại', value: 1000, probability: 0.01, emoji: '🐋' }
  ];

  // Apply VIP rare fish boost
  const rareFishBoost = (vipBenefits.rareFishBoost || 0) / 100;

  for (let i = 0; i < results.totalAttempts; i++) {
    // Check if this attempt hits
    if (Math.random() * 100 >= actualMissRate) {
      // Successful fishing attempt
      results.fishCaught++;

      // Determine fish type
      let fishCaught = null;
      const rand = Math.random();
      let cumulativeProbability = 0;

      for (const fish of fishTypes) {
        let adjustedProbability = fish.probability;
        
        // Boost rare fish (epic and legendary)
        if (fish.value >= 500) {
          adjustedProbability *= (1 + rareFishBoost);
        }

        cumulativeProbability += adjustedProbability;
        
        if (rand <= cumulativeProbability) {
          fishCaught = fish;
          break;
        }
      }

      // Fallback to common fish
      if (!fishCaught) {
        fishCaught = fishTypes[0];
      }

      // Add to results
      results.totalXu += fishCaught.value;
      
      if (!results.fishByType[fishCaught.name]) {
        results.fishByType[fishCaught.name] = {
          count: 0,
          totalValue: 0,
          emoji: fishCaught.emoji
        };
      }
      
      results.fishByType[fishCaught.name].count++;
      results.fishByType[fishCaught.name].totalValue += fishCaught.value;
    } else {
      // Missed attempt
      results.fishMissed++;
    }
  }

  // Calculate efficiency
  results.efficiency = results.totalAttempts > 0 ? 
    (results.fishCaught / results.totalAttempts * 100) : 0;

  return results;
}

/**
 * Start auto-fishing session for user
 * @param {Object} AutoFishing - AutoFishing model
 * @param {Object} VIP - VIP model  
 * @param {string} userId - User Discord ID
 * @param {number} durationMinutes - Session duration
 * @returns {Object} Session start result
 */
export async function startAutoFishingSession(AutoFishing, VIP, userId, durationMinutes) {
  try {
    // Get user's VIP status
    const { getUserVipStatus } = await import('./vipManager.js');
    const vipStatus = await getUserVipStatus(VIP, userId);
    
    if (!vipStatus.isVip) {
      return {
        success: false,
        error: 'Cần có VIP Gold hoặc cao hơn để sử dụng Auto-Fishing!'
      };
    }

    // Check auto-fishing permissions
    const limits = getAutoFishingLimits(vipStatus.tier);
    if (!limits.enabled) {
      return {
        success: false,
        error: `${limits.name} không có quyền Auto-Fishing. Cần VIP Vàng trở lên!`
      };
    }

    // Get or create auto-fishing record
    let autoFishing = await AutoFishing.findOne({ userId });
    if (!autoFishing) {
      autoFishing = new AutoFishing({
        userId,
        username: 'Unknown',
        remainingTimeToday: limits.dailyMinutes
      });
    }

    // Reset daily limit if needed
    const today = new Date();
    const lastReset = new Date(autoFishing.lastResetDate);
    
    if (today.toDateString() !== lastReset.toDateString()) {
      autoFishing.remainingTimeToday = limits.dailyMinutes;
      autoFishing.lastResetDate = today;
    }

    // Check if user already has active session
    if (autoFishing.isActive) {
      return {
        success: false,
        error: 'Bạn đã có phiên Auto-Fishing đang chạy!'
      };
    }

    // Check remaining time
    if (autoFishing.remainingTimeToday <= 0) {
      return {
        success: false,
        error: 'Bạn đã hết thời gian Auto-Fishing hôm nay!'
      };
    }

    // Limit duration to remaining time
    const actualDuration = Math.min(durationMinutes, autoFishing.remainingTimeToday);

    // Start session
    const now = new Date();
    autoFishing.isActive = true;
    autoFishing.sessionStartTime = now;
    autoFishing.sessionEndTime = new Date(now.getTime() + actualDuration * 60 * 1000);
    autoFishing.remainingTimeToday -= actualDuration;

    await autoFishing.save();

    return {
      success: true,
      sessionId: autoFishing._id,
      duration: actualDuration,
      endTime: autoFishing.sessionEndTime,
      remainingToday: autoFishing.remainingTimeToday
    };

  } catch (error) {
    console.error('❌ Start auto-fishing error:', error);
    return {
      success: false,
      error: 'Có lỗi khi bắt đầu Auto-Fishing!'
    };
  }
}

/**
 * Stop auto-fishing session and calculate rewards
 * @param {Object} AutoFishing - AutoFishing model
 * @param {Object} User - User model
 * @param {Object} VIP - VIP model
 * @param {string} userId - User Discord ID
 * @returns {Object} Session results
 */
export async function stopAutoFishingSession(AutoFishing, User, VIP, userId) {
  try {
    const autoFishing = await AutoFishing.findOne({ userId, isActive: true });
    if (!autoFishing) {
      return {
        success: false,
        error: 'Không có phiên Auto-Fishing nào đang chạy!'
      };
    }

    // Calculate session duration
    const now = new Date();
    const actualEndTime = now < autoFishing.sessionEndTime ? now : autoFishing.sessionEndTime;
    const durationMs = actualEndTime - autoFishing.sessionStartTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    // Get VIP benefits
    const { getUserVipStatus } = await import('./vipManager.js');
    const vipStatus = await getUserVipStatus(VIP, userId);

    // Calculate fishing results
    const results = calculateAutoFishingResults(durationMinutes, vipStatus.benefits);

    // Update user balance
    const user = await User.findOne({ discordId: userId });
    if (user) {
      user.balance += results.totalXu;
      await user.save();
    }

    // Update auto-fishing record
    autoFishing.isActive = false;
    autoFishing.totalFishCaught += results.fishCaught;
    autoFishing.totalXuEarned += results.totalXu;
    
    // Add to history
    autoFishing.history.push({
      date: now,
      duration: durationMinutes,
      fishCaught: results.fishCaught,
      xuEarned: results.totalXu,
      vipTier: vipStatus.tier
    });

    await autoFishing.save();

    return {
      success: true,
      duration: durationMinutes,
      results: results,
      newBalance: user ? user.balance : 0
    };

  } catch (error) {
    console.error('❌ Stop auto-fishing error:', error);
    return {
      success: false,
      error: 'Có lỗi khi dừng Auto-Fishing!'
    };
  }
}

/**
 * Check active auto-fishing sessions and auto-complete expired ones
 * @param {Object} AutoFishing - AutoFishing model
 * @param {Object} User - User model
 * @param {Object} VIP - VIP model
 * @returns {number} Number of sessions completed
 */
export async function processExpiredAutoFishingSessions(AutoFishing, User, VIP) {
  try {
    const now = new Date();
    const expiredSessions = await AutoFishing.find({
      isActive: true,
      sessionEndTime: { $lte: now }
    });

    let completedSessions = 0;

    for (const session of expiredSessions) {
      const result = await stopAutoFishingSession(AutoFishing, User, VIP, session.userId);
      if (result.success) {
        completedSessions++;
        console.log(`🤖 Auto-completed fishing session for user ${session.userId}`);
      }
    }

    return completedSessions;
  } catch (error) {
    console.error('❌ Process expired auto-fishing sessions error:', error);
    return 0;
  }
}

/**
 * Get auto-fishing status for user
 * @param {Object} AutoFishing - AutoFishing model
 * @param {Object} VIP - VIP model
 * @param {string} userId - User Discord ID
 * @returns {Object} Auto-fishing status
 */
export async function getAutoFishingStatus(AutoFishing, VIP, userId) {
  try {
    const { getUserVipStatus } = await import('./vipManager.js');
    const vipStatus = await getUserVipStatus(VIP, userId);
    const limits = getAutoFishingLimits(vipStatus.tier);

    let autoFishing = await AutoFishing.findOne({ userId });
    if (!autoFishing) {
      autoFishing = new AutoFishing({
        userId,
        username: 'Unknown',
        remainingTimeToday: limits.dailyMinutes
      });
      await autoFishing.save();
    }

    // Reset daily limit if needed
    const today = new Date();
    const lastReset = new Date(autoFishing.lastResetDate);
    
    if (today.toDateString() !== lastReset.toDateString()) {
      autoFishing.remainingTimeToday = limits.dailyMinutes;
      autoFishing.lastResetDate = today;
      await autoFishing.save();
    }

    return {
      vipTier: vipStatus.tier,
      limits: limits,
      isActive: autoFishing.isActive,
      sessionStartTime: autoFishing.sessionStartTime,
      sessionEndTime: autoFishing.sessionEndTime,
      remainingTimeToday: autoFishing.remainingTimeToday,
      totalStats: {
        fishCaught: autoFishing.totalFishCaught,
        xuEarned: autoFishing.totalXuEarned
      }
    };
  } catch (error) {
    console.error('❌ Get auto-fishing status error:', error);
    return null;
  }
}