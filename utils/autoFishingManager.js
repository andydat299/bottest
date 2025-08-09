/**
 * Auto-Fishing Manager with Realistic Miss Rate
 * Implements proper miss rate calculation based on rod stats
 */

import { getRodBenefits } from './rodManager.js';

// Auto-fishing session management
const activeSessions = new Map(); // userId -> session data

/**
 * Calculate miss rate based on rod stats
 */
export const calculateMissRate = (rodLevel) => {
  const rod = getRodBenefits(rodLevel);
  const baseMissRate = 25; // 25% base miss rate (same as manual fishing)
  const rodMissReduction = rod.missReduction || 0;
  
  // Calculate final miss rate with minimum 5% (even best rod can miss)
  const finalMissRate = Math.max(5, baseMissRate - rodMissReduction);
  
  return {
    baseMissRate,
    rodMissReduction,
    finalMissRate
  };
};

/**
 * Simulate fishing attempt with miss rate
 */
export const simulateFishingAttempt = (rodLevel) => {
  const rod = getRodBenefits(rodLevel);
  const missRateInfo = calculateMissRate(rodLevel);
  
  // Check if this attempt misses
  const missChance = Math.random() * 100;
  const didMiss = missChance < missRateInfo.finalMissRate;
  
  if (didMiss) {
    return {
      success: false,
      missed: true,
      missRateInfo,
      durabilityUsed: Math.floor(Math.random() * 2) + 1 // 1-2 durability for miss
    };
  }
  
  // Successful catch - calculate fish and value
  const rarityBoost = rod.rareBoost || 0;
  let rarityRoll = Math.random() * 100 + rarityBoost;
  
  let fishResult;
  if (rarityRoll > 95) {
    fishResult = {
      name: 'Cá Thần Thoại',
      emoji: '🐋',
      rarity: 'mythical',
      value: Math.floor(Math.random() * 1000) + 500
    };
  } else if (rarityRoll > 85) {
    fishResult = {
      name: 'Cá Huyền Thoại', 
      emoji: '🦈',
      rarity: 'legendary',
      value: Math.floor(Math.random() * 500) + 200
    };
  } else if (rarityRoll > 70) {
    fishResult = {
      name: 'Cá Hiếm',
      emoji: '🐠',
      rarity: 'rare',
      value: Math.floor(Math.random() * 200) + 100
    };
  } else {
    fishResult = {
      name: 'Cá Thường',
      emoji: '🐟',
      rarity: 'common',
      value: Math.floor(Math.random() * 100) + 20
    };
  }
  
  return {
    success: true,
    missed: false,
    fish: fishResult,
    missRateInfo,
    durabilityUsed: Math.floor(Math.random() * 3) + 1 // 1-3 durability for catch
  };
};

/**
 * Start auto-fishing session
 */
export const startAutoFishingSession = async (AutoFishing, VIP, userId, minutes) => {
  try {
    // Check VIP permissions with detailed logging
    console.log(`🔍 Auto-fishing VIP check for user: ${userId}`);
    
    const vip = await VIP.findOne({ userId: userId }); // Updated to use userId instead of discordId
    console.log(`📊 VIP database query result:`, vip);
    
    const limits = getAutoFishingLimits(vip);
    console.log(`🎯 Auto-fishing limits calculated:`, limits);
    
    if (!limits.enabled) {
      console.log(`❌ Auto-fishing access denied:`, {
        vipExists: !!vip,
        vipActive: vip?.isActive,
        vipTier: vip?.tier || vip?.currentTier,
        vipExpired: vip?.expiresAt ? new Date() > new Date(vip.expiresAt) : false,
        limitsEnabled: limits.enabled,
        reason: limits.reason
      });
      
      return {
        success: false,
        error: `Cần VIP Vàng hoặc cao hơn để sử dụng Auto-Fishing!\n\n**Debug Info:**\n• VIP Record: ${vip ? 'Found' : 'Not found'}\n• VIP Active: ${vip?.isActive || 'N/A'}\n• VIP Tier: ${vip?.tier || vip?.currentTier || 'N/A'}\n• VIP Expires: ${vip?.expiresAt ? new Date(vip.expiresAt).toLocaleDateString() : 'N/A'}\n• Required: gold/diamond/platinum\n• Reason: ${limits.reason || 'Unknown'}\n\nUse \`/debug-vip-autofish\` for detailed analysis.`
      };
    }
    
    // Check if already has active session
    if (activeSessions.has(userId)) {
      return {
        success: false,
        error: 'Bạn đã có phiên Auto-Fishing đang chạy!'
      };
    }
    
    // Check daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUsage = await AutoFishing.aggregate([
      {
        $match: {
          userId: userId,
          startTime: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$duration' }
        }
      }
    ]);
    
    const usedToday = todayUsage[0]?.totalMinutes || 0;
    const remainingToday = Math.max(0, limits.dailyMinutes - usedToday);
    
    if (remainingToday < minutes) {
      return {
        success: false,
        error: `Không đủ thời gian! Còn lại hôm nay: ${remainingToday} phút`
      };
    }
    
    // Start session
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + minutes * 60 * 1000);
    
    const session = {
      userId,
      startTime,
      endTime,
      duration: minutes,
      status: 'active'
    };
    
    // Create database record for background job tracking
    const dbSession = await AutoFishing.create({
      userId,
      startTime,
      endTime,
      duration: minutes,
      totalAttempts: 0,
      fishCaught: 0,
      fishMissed: 0,
      totalXu: 0,
      durabilityUsed: 0,
      rodLevel: 0, // Will be updated when session completes
      efficiency: '0',
      status: 'active'
    });
    
    // Store in memory for active tracking
    activeSessions.set(userId, { ...session, dbId: dbSession._id });
    
    return {
      success: true,
      duration: minutes,
      endTime,
      remainingToday: remainingToday - minutes
    };
    
  } catch (error) {
    console.error('❌ Start auto-fishing error:', error);
    return {
      success: false,
      error: 'Lỗi hệ thống khi bắt đầu Auto-Fishing'
    };
  }
};

/**
 * Stop auto-fishing session and calculate rewards
 */
export const stopAutoFishingSession = async (AutoFishing, User, VIP, userId) => {
  try {
    const session = activeSessions.get(userId);
    if (!session) {
      return {
        success: false,
        error: 'Không có phiên Auto-Fishing nào đang chạy!'
      };
    }
    
    // Get user data
    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return {
        success: false,
        error: 'Không tìm thấy thông tin người dùng!'
      };
    }
    
    const rodLevel = user.rodLevel || 1;
    const rod = getRodBenefits(rodLevel);
    const currentRodDurability = user.rodDurability || rod.durability;
    
    // Calculate session duration
    const now = new Date();
    const actualEndTime = Math.min(now, session.endTime);
    const actualDuration = Math.floor((actualEndTime - session.startTime) / (1000 * 60));
    
    // Simulate fishing for the entire duration
    // Assume 1 fishing attempt per 30 seconds (2 per minute)
    const totalAttempts = actualDuration * 2;
    
    let fishCaught = 0;
    let fishMissed = 0;
    let totalXu = 0;
    let durabilityUsed = 0;
    const fishByType = {};
    
    console.log(`🎣 Simulating ${totalAttempts} fishing attempts for ${actualDuration} minutes`);
    
    for (let i = 0; i < totalAttempts; i++) {
      // Check durability (stop if rod breaks)
      const currentDurability = currentRodDurability - durabilityUsed;
      if (currentDurability <= 0) {
        console.log('🔧 Rod broke during auto-fishing session');
        break;
      }
      
      const attempt = simulateFishingAttempt(rodLevel);
      durabilityUsed += attempt.durabilityUsed;
      
      if (attempt.missed) {
        fishMissed++;
      } else {
        fishCaught++;
        totalXu += attempt.fish.value;
        
        // Track fish by type
        const fishName = attempt.fish.name;
        if (!fishByType[fishName]) {
          fishByType[fishName] = {
            count: 0,
            totalValue: 0,
            emoji: attempt.fish.emoji,
            rarity: attempt.fish.rarity
          };
        }
        fishByType[fishName].count++;
        fishByType[fishName].totalValue += attempt.fish.value;
      }
    }
    
    // Calculate efficiency
    const efficiency = totalAttempts > 0 ? (fishCaught / totalAttempts) * 100 : 0;
    
    // Update user balance and rod durability
    const newBalance = (user.balance || 0) + totalXu;
    const newDurability = Math.max(0, currentRodDurability - durabilityUsed);
    
    await User.updateOne(
      { discordId: userId },
      { 
        $inc: { balance: totalXu },
        $set: { rodDurability: newDurability }
      }
    );
    
    // Update existing database record instead of creating new one
    if (session.dbId) {
      await AutoFishing.updateOne(
        { _id: session.dbId },
        {
          $set: {
            endTime: actualEndTime,
            duration: actualDuration,
            totalAttempts,
            fishCaught,
            fishMissed,
            totalXu,
            durabilityUsed,
            rodLevel,
            efficiency: efficiency.toFixed(1),
            status: 'completed'
          }
        }
      );
    } else {
      // Fallback: create new record if dbId missing
      await AutoFishing.create({
        userId,
        startTime: session.startTime,
        endTime: actualEndTime,
        duration: actualDuration,
        totalAttempts,
        fishCaught,
        fishMissed,
        totalXu,
        durabilityUsed,
        rodLevel,
        efficiency: efficiency.toFixed(1),
        status: 'completed'
      });
    }
    
    // Remove from active sessions
    activeSessions.delete(userId);
    
    return {
      success: true,
      duration: actualDuration,
      newBalance,
      results: {
        totalAttempts,
        fishCaught,
        fishMissed,
        totalXu,
        efficiency,
        fishByType,
        durabilityUsed,
        missRateInfo: calculateMissRate(rodLevel)
      }
    };
    
  } catch (error) {
    console.error('❌ Stop auto-fishing error:', error);
    return {
      success: false,
      error: 'Lỗi hệ thống khi dừng Auto-Fishing'
    };
  }
};

/**
 * Get auto-fishing status
 */
export const getAutoFishingStatus = async (AutoFishing, VIP, userId) => {
  try {
    const vip = await VIP.findOne({ userId: userId }); // Updated to use userId
    const limits = getAutoFishingLimits(vip);
    
    // Check active session
    const activeSession = activeSessions.get(userId);
    const isActive = !!activeSession;
    
    // Calculate remaining time today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayUsage = await AutoFishing.aggregate([
      {
        $match: {
          userId: userId,
          startTime: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: '$duration' }
        }
      }
    ]);
    
    const usedToday = todayUsage[0]?.totalMinutes || 0;
    const remainingTimeToday = Math.max(0, limits.dailyMinutes - usedToday);
    
    // Get total stats
    const totalStats = await AutoFishing.aggregate([
      {
        $match: { userId: userId }
      },
      {
        $group: {
          _id: null,
          fishCaught: { $sum: '$fishCaught' },
          xuEarned: { $sum: '$totalXu' }
        }
      }
    ]);
    
    return {
      isActive,
      sessionStartTime: activeSession?.startTime,
      sessionEndTime: activeSession?.endTime,
      limits,
      remainingTimeToday,
      totalStats: {
        fishCaught: totalStats[0]?.fishCaught || 0,
        xuEarned: totalStats[0]?.xuEarned || 0
      }
    };
    
  } catch (error) {
    console.error('❌ Get auto-fishing status error:', error);
    return null;
  }
};

/**
 * Get auto-fishing limits based on VIP level
 */
export const getAutoFishingLimits = (vip) => {
  // Handle both old and new VIP schema formats
  const isVipActive = vip?.isActive;
  const vipTier = vip?.tier || vip?.currentTier; // Support both formats
  
  console.log(`🔍 VIP data analysis:`, {
    hasVip: !!vip,
    isActive: isVipActive,
    tier: vipTier,
    rawVip: vip
  });
  
  if (!vip || !isVipActive) {
    return {
      enabled: false,
      name: 'Free User',
      dailyMinutes: 0,
      reason: !vip ? 'No VIP record' : 'VIP inactive'
    };
  }
  
  // Check if VIP expired
  if (vip.expiresAt && new Date() > new Date(vip.expiresAt)) {
    console.log(`⚠️ VIP expired:`, {
      expiresAt: vip.expiresAt,
      now: new Date()
    });
    
    return {
      enabled: false,
      name: 'Expired VIP',
      dailyMinutes: 0,
      reason: 'VIP expired'
    };
  }
  
  switch (vipTier) {
    case 'gold':
      return {
        enabled: true,
        name: 'VIP Vàng',
        dailyMinutes: 120, // 2 hours
        tier: 'gold'
      };
    case 'diamond':
      return {
        enabled: true,
        name: 'VIP Kim Cương',
        dailyMinutes: 300, // 5 hours
        tier: 'diamond'
      };
    case 'platinum':
      return {
        enabled: true,
        name: 'VIP Bạch Kim',
        dailyMinutes: 480, // 8 hours
        tier: 'platinum'
      };
    case 'silver':
      return {
        enabled: true,
        name: 'VIP Bạc',
        dailyMinutes: 60, // 1 hour
        tier: 'silver'
      };
    case 'bronze':
      return {
        enabled: false, // Bronze doesn't get auto-fishing
        name: 'VIP Đồng',
        dailyMinutes: 0,
        tier: 'bronze',
        reason: 'Bronze VIP không có auto-fishing'
      };
    default:
      return {
        enabled: false,
        name: 'Free User',
        dailyMinutes: 0,
        reason: `Unknown tier: ${vipTier}`
      };
  }
};