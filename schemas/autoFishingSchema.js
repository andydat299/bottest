/**
 * Auto-Fishing Schema
 * Store auto-fishing session data and statistics
 */

import mongoose from 'mongoose';

const autoFishingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
    // Removed index: true to avoid duplicates
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  totalAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  fishCaught: {
    type: Number,
    required: true,
    default: 0
  },
  fishMissed: {
    type: Number,
    required: true,
    default: 0
  },
  totalXu: {
    type: Number,
    required: true,
    default: 0
  },
  durabilityUsed: {
    type: Number,
    required: true,
    default: 0
  },
  rodLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  efficiency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active'
    // Removed index: true to avoid duplicates
  },
  createdAt: {
    type: Date,
    default: Date.now
    // Removed index: true to avoid duplicates
  }
}, {
  timestamps: true
});

// ✅ Create all indexes separately to avoid duplicates
autoFishingSchema.index({ userId: 1, startTime: -1 });  // Query by user and time
autoFishingSchema.index({ status: 1, endTime: 1 });     // Background job queries
autoFishingSchema.index({ createdAt: -1 });             // Recent records
autoFishingSchema.index({ userId: 1, status: 1 });      // User active sessions

// Calculate total fishing time for a user
autoFishingSchema.statics.getTotalTime = function(userId, startDate = null) {
  const match = { userId };
  if (startDate) {
    match.startTime = { $gte: startDate };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
        totalSessions: { $sum: 1 },
        totalFishCaught: { $sum: '$fishCaught' },
        totalXuEarned: { $sum: '$totalXu' }
      }
    }
  ]);
};

// Get daily usage for a user
autoFishingSchema.statics.getDailyUsage = function(userId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        userId,
        startTime: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' },
        sessions: { $sum: 1 }
      }
    }
  ]);
};

// Get user efficiency stats
autoFishingSchema.statics.getUserStats = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ startTime: -1 })
    .limit(limit)
    .select('duration fishCaught fishMissed totalXu efficiency startTime rodLevel');
};

export const AutoFishing = mongoose.model('AutoFishing', autoFishingSchema);