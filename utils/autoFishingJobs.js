/**
 * Background Jobs for Auto-Fishing System
 */

import cron from 'node-cron';

let autoFishingJobRunning = false;

/**
 * Initialize background jobs for auto-fishing
 * @param {Object} models - Database models
 */
export function initializeAutoFishingJobs(models) {
  const { AutoFishing, User, VIP } = models;

  // Run every 5 minutes to check for expired sessions
  cron.schedule('*/5 * * * *', async () => {
    if (autoFishingJobRunning) return;
    
    try {
      autoFishingJobRunning = true;
      
      const { processExpiredAutoFishingSessions } = await import('./autoFishingManager.js');
      const completedSessions = await processExpiredAutoFishingSessions(AutoFishing, User, VIP);
      
      if (completedSessions > 0) {
        console.log(`🤖 Auto-completed ${completedSessions} fishing sessions`);
      }
    } catch (error) {
      console.error('❌ Auto-fishing background job error:', error);
    } finally {
      autoFishingJobRunning = false;
    }
  });

  // Reset daily limits at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const { getAutoFishingLimits } = await import('./autoFishingManager.js');
      
      // Get all VIP users
      const vipUsers = await VIP.find({ isActive: true });
      let resetCount = 0;

      for (const vipUser of vipUsers) {
        const limits = getAutoFishingLimits(vipUser.currentTier);
        
        if (limits.enabled) {
          await AutoFishing.updateOne(
            { userId: vipUser.userId },
            { 
              $set: { 
                remainingTimeToday: limits.dailyMinutes,
                lastResetDate: new Date()
              }
            },
            { upsert: true }
          );
          resetCount++;
        }
      }

      console.log(`🕛 Reset auto-fishing limits for ${resetCount} VIP users`);
    } catch (error) {
      console.error('❌ Auto-fishing daily reset error:', error);
    }
  });

  console.log('🤖 Auto-fishing background jobs initialized');
}

/**
 * Process single auto-fishing session manually
 * @param {Object} models - Database models
 * @param {string} userId - User ID to process
 * @returns {Object} Process result
 */
export async function processUserAutoFishing(models, userId) {
  const { AutoFishing, User, VIP } = models;
  
  try {
    const { stopAutoFishingSession } = await import('./autoFishingManager.js');
    const result = await stopAutoFishingSession(AutoFishing, User, VIP, userId);
    
    return result;
  } catch (error) {
    console.error(`❌ Process user auto-fishing error for ${userId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get auto-fishing statistics
 * @param {Object} AutoFishing - AutoFishing model
 * @returns {Object} Statistics
 */
export async function getAutoFishingStats(AutoFishing) {
  try {
    const stats = await AutoFishing.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeSessions: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } 
          },
          totalFishCaught: { $sum: '$totalFishCaught' },
          totalXuEarned: { $sum: '$totalXuEarned' }
        }
      }
    ]);

    return stats[0] || {
      totalUsers: 0,
      activeSessions: 0,
      totalFishCaught: 0,
      totalXuEarned: 0
    };
  } catch (error) {
    console.error('❌ Get auto-fishing stats error:', error);
    return {
      totalUsers: 0,
      activeSessions: 0,
      totalFishCaught: 0,
      totalXuEarned: 0
    };
  }
}