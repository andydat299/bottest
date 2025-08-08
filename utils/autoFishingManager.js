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
 * Calculate fishing results for auto-fishing session using real fishing mechanics
 * @param {number} durationMinutes - Session duration in minutes
 * @param {Object} vipBenefits - VIP benefits object
 * @param {string} userId - User Discord ID for miss rate calculation
 * @returns {Object} Fishing results
 */
export async function calculateAutoFishingResults(durationMinutes, vipBenefits, userId = null) {
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

  // Get actual miss rate using the same system as manual fishing
  let actualMissRate = 15; // Default 15% miss rate
  
  try {
    if (userId) {
      // Import and use the real fishing miss rate system
      const { calculateFishMissRate } = await import('./fishMissRateManager.js');
      actualMissRate = await calculateFishMissRate(userId);
    }
    
    // Apply VIP miss rate reduction on top of calculated miss rate
    actualMissRate = Math.max(0, actualMissRate - (vipBenefits.fishingMissReduction || 0));
  } catch (error) {
    console.log('⚠️ Could not load miss rate system, using default 15%');
    // Apply VIP reduction to default rate
    actualMissRate = Math.max(0, 15 - (vipBenefits.fishingMissReduction || 0));
  }

  // Import fish types from existing system
  const { fishTypes, totalWeight } = await import('./fishTypes.js');

  // Apply VIP rare fish boost
  const rareFishBoost = (vipBenefits.rareFishBoost || 0) / 100;

  // Calculate adjusted total weight with VIP boost
  let adjustedTotalWeight = 0;
  for (const fish of fishTypes) {
    let adjustedWeight = fish.weight;
    
    // Boost rare fish (legendary and mythical) for VIP
    if (fish.rarity === 'legendary' || fish.rarity === 'mythical') {
      adjustedWeight *= (1 + rareFishBoost);
    }
    adjustedTotalWeight += adjustedWeight;
  }

  console.log(`🤖 Auto-fishing: Miss rate ${actualMissRate}%, VIP boost ${(rareFishBoost * 100)}%`);

  for (let i = 0; i < results.totalAttempts; i++) {
    // Check if this attempt hits (same logic as manual fishing)
    if (Math.random() * 100 >= actualMissRate) {
      // Successful fishing attempt
      results.fishCaught++;

      // Use weighted random system with VIP adjustments
      let randomValue = Math.random() * adjustedTotalWeight;
      let selectedFish = null;

      for (const fish of fishTypes) {
        let adjustedWeight = fish.weight;
        
        // Apply VIP boost to rare fish
        if (fish.rarity === 'legendary' || fish.rarity === 'mythical') {
          adjustedWeight *= (1 + rareFishBoost);
        }

        if (randomValue <= adjustedWeight) {
          selectedFish = fish;
          break;
        }
        randomValue -= adjustedWeight;
      }

      // Fallback to first fish if none selected
      if (!selectedFish) {
        selectedFish = fishTypes[0];
      }

      // Add to results using price from fishTypes
      results.totalXu += selectedFish.price;
      
      if (!results.fishByType[selectedFish.name]) {
        results.fishByType[selectedFish.name] = {
          count: 0,
          totalValue: 0,
          emoji: getFishEmoji(selectedFish.rarity),
          rarity: selectedFish.rarity
        };
      }
      
      results.fishByType[selectedFish.name].count++;
      results.fishByType[selectedFish.name].totalValue += selectedFish.price;
    } else {
      // Missed attempt (same as manual fishing)
      results.fishMissed++;
    }
  }

  // Calculate efficiency
  results.efficiency = results.totalAttempts > 0 ? 
    (results.fishCaught / results.totalAttempts * 100) : 0;

  console.log(`🎣 Auto-fishing results: ${results.fishCaught}/${results.totalAttempts} (${results.efficiency.toFixed(1)}%)`);

  return results;
}

/**
 * Get fish emoji based on rarity (matching fishing system)
 * @param {string} rarity - Fish rarity
 * @returns {string} Emoji
 */
function getFishEmoji(rarity) {
  const emojis = {
    common: '🐟',
    rare: '🐠', 
    legendary: '🦈',
    mythical: '🐋'
  };
  return emojis[rarity] || '🐟';
}

/**
 * Get rarity Vietnamese name
 * @param {string} rarity - Fish rarity
 * @returns {string} Vietnamese name
 */
function getRarityVietnamese(rarity) {
  const vietnamese = {
    common: 'Thường',
    rare: 'Hiếm',
    legendary: 'Huyền Thoại', 
    mythical: 'Thần Thoại'
  };
  return vietnamese[rarity] || rarity;
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
    // Get user's VIP status - import directly to avoid circular import
    const { VIP_TIERS } = await import('./vipManager.js');
    
    const vipRecord = await VIP.findOne({ userId, isActive: true });
    let vipStatus = {
      isVip: false,
      tier: 'none',
      benefits: {
        fishingMissReduction: 0,
        rareFishBoost: 0,
        dailyBonus: 0,
        casinoWinBoost: 0,
        cooldownReduction: 0,
        shopDiscount: 0
      }
    };

    if (vipRecord && (!vipRecord.expiresAt || new Date() <= vipRecord.expiresAt)) {
      vipStatus = {
        isVip: true,
        tier: vipRecord.currentTier,
        benefits: vipRecord.benefits
      };
    }
    
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

    // Get VIP benefits - direct VIP record access
    const vipRecord = await VIP.findOne({ userId, isActive: true });
    let vipBenefits = {
      fishingMissReduction: 0,
      rareFishBoost: 0
    };

    if (vipRecord && (!vipRecord.expiresAt || new Date() <= vipRecord.expiresAt)) {
      vipBenefits = vipRecord.benefits;
    }

    // Calculate fishing results with real miss rate calculation
    const results = await calculateAutoFishingResults(durationMinutes, vipBenefits, userId);

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
      vipTier: vipRecord ? vipRecord.currentTier : 'none'
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
        console.log(`🤖 Auto-completed fishing session for user ${session.userId} - ${result.results.fishCaught} fish, ${result.results.totalXu} xu`);
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
    // Get VIP status directly
    const vipRecord = await VIP.findOne({ userId, isActive: true });
    let vipTier = 'none';
    
    if (vipRecord && (!vipRecord.expiresAt || new Date() <= vipRecord.expiresAt)) {
      vipTier = vipRecord.currentTier;
    }
    
    const limits = getAutoFishingLimits(vipTier);

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
      vipTier: vipTier,
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