/**
 * Auto-Fishing Background Jobs
 * Handle expired sessions and cleanup
 */

import { stopAutoFishingSession, getAutoFishingStatus } from './autoFishingManager.js';

let jobRunning = false;

/**
 * Process expired auto-fishing sessions
 * Automatically stop sessions that have reached their end time
 */
export const processExpiredAutoFishingSessions = async () => {
  if (jobRunning) {
    console.log('⏭️ Auto-fishing job already running, skipping...');
    return;
  }

  jobRunning = true;
  console.log('🔄 Processing expired auto-fishing sessions...');

  try {
    const { AutoFishing } = await import('../schemas/autoFishingSchema.js');
    const { User } = await import('../schemas/userSchema.js');
    const { VIP } = await import('../schemas/vipSchema.js');

    // Find all active sessions that have expired
    const now = new Date();
    const expiredSessions = await AutoFishing.find({
      endTime: { $lte: now },
      status: { $ne: 'completed' } // Only process if not already completed
    });

    console.log(`📊 Found ${expiredSessions.length} expired sessions to process`);

    let processedCount = 0;
    let errorCount = 0;

    for (const session of expiredSessions) {
      try {
        console.log(`⚡ Processing expired session for user: ${session.userId}`);
        
        // Stop the session and calculate rewards
        const result = await stopAutoFishingSession(AutoFishing, User, VIP, session.userId);
        
        if (result.success) {
          // Mark the session as completed
          await AutoFishing.updateOne(
            { _id: session._id },
            { status: 'completed' }
          );
          
          processedCount++;
          console.log(`✅ Completed session for user: ${session.userId}`);
          console.log(`   Duration: ${result.duration} minutes`);
          console.log(`   Fish caught: ${result.results.fishCaught}`);
          console.log(`   Xu earned: ${result.results.totalXu}`);
        } else {
          console.log(`⚠️ Failed to process session for user: ${session.userId} - ${result.error}`);
          errorCount++;
        }
        
      } catch (sessionError) {
        console.error(`❌ Error processing session ${session._id}:`, sessionError);
        errorCount++;
      }
    }

    console.log(`📊 Auto-fishing job completed:`);
    console.log(`   ✅ Processed: ${processedCount} sessions`);
    console.log(`   ❌ Errors: ${errorCount} sessions`);
    console.log(`   ⏰ Total time: ${Date.now() - now.getTime()}ms`);

  } catch (error) {
    console.error('❌ Auto-fishing background job error:', error);
  } finally {
    jobRunning = false;
  }
};

/**
 * Cleanup old auto-fishing records
 * Remove records older than 30 days to keep database clean
 */
export const cleanupOldAutoFishingRecords = async () => {
  try {
    const { AutoFishing } = await import('../schemas/autoFishingSchema.js');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await AutoFishing.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old auto-fishing records`);
    }
    
  } catch (error) {
    console.error('❌ Cleanup old records error:', error);
  }
};

/**
 * Start auto-fishing background jobs
 * Set up intervals for processing expired sessions and cleanup
 */
export const startAutoFishingJobs = () => {
  console.log('🚀 Starting auto-fishing background jobs...');
  
  // Process expired sessions every 30 seconds
  setInterval(async () => {
    await processExpiredAutoFishingSessions();
  }, 30 * 1000); // 30 seconds
  
  // Cleanup old records once per day
  setInterval(async () => {
    await cleanupOldAutoFishingRecords();
  }, 24 * 60 * 60 * 1000); // 24 hours
  
  console.log('✅ Auto-fishing background jobs started');
  console.log('   ⚡ Expired sessions: Every 30 seconds');
  console.log('   🧹 Cleanup old records: Every 24 hours');
};

/**
 * Stop auto-fishing background jobs (for graceful shutdown)
 */
export const stopAutoFishingJobs = () => {
  console.log('⏹️ Stopping auto-fishing background jobs...');
  // Note: setInterval handles would need to be stored to properly clear them
  // For now, this is just a placeholder for graceful shutdown
};

/**
 * Get job status and statistics
 */
export const getAutoFishingJobStatus = async () => {
  try {
    const { AutoFishing } = await import('../schemas/autoFishingSchema.js');
    
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    // Count active sessions
    const activeSessions = await AutoFishing.countDocuments({
      endTime: { $gt: now },
      status: { $ne: 'completed' }
    });
    
    // Count expired sessions waiting for processing
    const expiredSessions = await AutoFishing.countDocuments({
      endTime: { $lte: now },
      status: { $ne: 'completed' }
    });
    
    // Count sessions processed today
    const processedToday = await AutoFishing.countDocuments({
      createdAt: { $gte: todayStart },
      status: 'completed'
    });
    
    return {
      jobRunning,
      activeSessions,
      expiredSessions,
      processedToday,
      lastCheck: now
    };
    
  } catch (error) {
    console.error('❌ Get job status error:', error);
    return {
      jobRunning,
      error: error.message
    };
  }
};