import mongoose from 'mongoose';

/**
 * Check if user is banned from using the bot
 * @param {string} userId - Discord user ID
 * @returns {Object} - Ban status and details
 */
export async function checkUserBan(userId) {
  try {
    const db = mongoose.connection.db;
    const bannedUsersCollection = db.collection('bannedUsers');

    // Find active ban
    const activeBan = await bannedUsersCollection.findOne({ 
      userId: userId, 
      isActive: true 
    });

    if (!activeBan) {
      return { isBanned: false };
    }

    // Check if ban has expired
    if (activeBan.expiresAt && new Date() > new Date(activeBan.expiresAt)) {
      // Auto-unban expired bans
      await bannedUsersCollection.updateOne(
        { _id: activeBan._id },
        { 
          $set: { 
            isActive: false,
            unbannedAt: new Date(),
            unbannedBy: 'system',
            unbannedByUsername: 'Auto-Unban (Expired)'
          }
        }
      );

      console.log(`Auto-unbanned expired ban for user ${userId}`);
      return { isBanned: false };
    }

    return {
      isBanned: true,
      reason: activeBan.reason,
      bannedAt: activeBan.bannedAt,
      bannedBy: activeBan.bannedByUsername,
      expiresAt: activeBan.expiresAt,
      duration: activeBan.duration
    };

  } catch (error) {
    console.error('Error checking user ban:', error);
    return { isBanned: false }; // Fail safe - allow user if error
  }
}

/**
 * Middleware to check ban status before command execution
 * @param {CommandInteraction} interaction 
 * @returns {boolean} - true if user can proceed, false if banned
 */
export async function banCheckMiddleware(interaction) {
  const banStatus = await checkUserBan(interaction.user.id);
  
  if (!banStatus.isBanned) {
    return true; // User is not banned, proceed
  }

  // User is banned, send ban message
  const timeLeft = banStatus.expiresAt ? 
    getTimeLeftText(banStatus.expiresAt) : 
    'Vĩnh viễn';

  const banMessage = [
    '🚫 **Bạn đã bị cấm sử dụng bot!**',
    '',
    `📝 **Lý do:** ${banStatus.reason}`,
    `👮 **Ban bởi:** ${banStatus.bannedBy}`,
    `📅 **Ngày ban:** ${new Date(banStatus.bannedAt).toLocaleDateString()}`,
    `⏰ **Thời gian:** ${timeLeft}`,
    '',
    '💡 **Liên hệ admin để biết thêm chi tiết.**'
  ].join('\n');

  try {
    await interaction.reply({
      content: banMessage,
      ephemeral: true
    });
  } catch (replyError) {
    // If reply fails, try followUp
    try {
      await interaction.followUp({
        content: banMessage,
        ephemeral: true
      });
    } catch (followUpError) {
      console.error('Failed to send ban message:', followUpError);
    }
  }

  return false; // Block command execution
}

/**
 * Check if user is admin (exempt from bans for admin commands)
 * @param {CommandInteraction} interaction 
 * @returns {boolean}
 */
export function isUserAdmin(interaction) {
  return interaction.member?.permissions?.has('Administrator') || false;
}

/**
 * Enhanced middleware that exempts admins from ban checks for admin commands
 * @param {CommandInteraction} interaction 
 * @returns {boolean}
 */
export async function enhancedBanCheck(interaction) {
  // Admin commands bypass ban check
  const adminCommands = [
    'ban-user', 'admin-panel', 'check-user', 'reset-balance', 
    'test-withdraw-notification', 'admin-stats'
  ];
  
  if (adminCommands.includes(interaction.commandName) && isUserAdmin(interaction)) {
    return true; // Admins can use admin commands even if theoretically banned
  }
  
  // Regular ban check for all other commands
  return await banCheckMiddleware(interaction);
}

/**
 * Auto-cleanup expired bans (run this periodically)
 */
export async function cleanupExpiredBans() {
  try {
    const db = mongoose.connection.db;
    const bannedUsersCollection = db.collection('bannedUsers');

    const result = await bannedUsersCollection.updateMany(
      {
        isActive: true,
        expiresAt: { $lt: new Date() }
      },
      {
        $set: {
          isActive: false,
          unbannedAt: new Date(),
          unbannedBy: 'system',
          unbannedByUsername: 'Auto-Unban (Expired)'
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Auto-unbanned ${result.modifiedCount} expired bans`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('Error cleaning up expired bans:', error);
    return 0;
  }
}

// Helper functions
function getTimeLeftText(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry - now;
  
  if (diff <= 0) return 'Đã hết hạn';
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
  if (minutes > 0) return `Còn ${minutes} phút`;
  return 'Dưới 1 phút';
}

// Export ban statuses for easy checking
export const BAN_STATUS = {
  NOT_BANNED: 'not_banned',
  TEMPORARILY_BANNED: 'temp_banned', 
  PERMANENTLY_BANNED: 'perm_banned',
  EXPIRED: 'expired'
};

/**
 * Get detailed ban status with categorization
 * @param {string} userId 
 * @returns {Object}
 */
export async function getDetailedBanStatus(userId) {
  const banInfo = await checkUserBan(userId);
  
  if (!banInfo.isBanned) {
    return { status: BAN_STATUS.NOT_BANNED, ...banInfo };
  }
  
  if (banInfo.expiresAt) {
    if (new Date() > new Date(banInfo.expiresAt)) {
      return { status: BAN_STATUS.EXPIRED, ...banInfo };
    }
    return { status: BAN_STATUS.TEMPORARILY_BANNED, ...banInfo };
  }
  
  return { status: BAN_STATUS.PERMANENTLY_BANNED, ...banInfo };
}