import mongoose from 'mongoose';

/**
 * Guild Management System for Multi-Server Bot
 * Handles guild-specific settings and configurations
 */

// Default guild settings
const DEFAULT_GUILD_SETTINGS = {
  economy: {
    enabled: true,
    fishingMultiplier: 1.0,
    transferEnabled: true,
    marriageEnabled: true,
    withdrawEnabled: true,
    dailyRewardAmount: 1000,
    maxTransferAmount: 100000
  },
  adminChannel: null,
  prefix: '/',
  features: {
    fishing: true,
    marriage: true,
    transfer: true,
    withdraw: true,
    shop: true,
    leaderboards: true
  },
  permissions: {
    withdrawAdmins: [], // User IDs who can approve withdrawals
    economyAdmins: [], // User IDs who can manage economy
    botAdmins: [] // User IDs with full bot admin access
  },
  notifications: {
    welcomeMessage: true,
    economyUpdates: true,
    withdrawAlerts: true
  },
  limits: {
    maxFishPerHour: 60,
    maxTransfersPerDay: 10,
    minWithdrawAmount: 50000
  }
};

/**
 * Get or create guild settings
 * @param {string} guildId - Discord guild ID
 * @returns {Object} Guild settings
 */
export async function getGuildSettings(guildId) {
  try {
    const db = mongoose.connection.db;
    const guildsCollection = db.collection('guilds');
    
    let guild = await guildsCollection.findOne({ guildId: guildId });
    
    if (!guild) {
      // Create new guild with default settings
      guild = {
        guildId: guildId,
        ...DEFAULT_GUILD_SETTINGS,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await guildsCollection.insertOne(guild);
      console.log(`✅ Created new guild settings for ${guildId}`);
    }
    
    return guild;
  } catch (error) {
    console.error('Error getting guild settings:', error);
    return { guildId, ...DEFAULT_GUILD_SETTINGS };
  }
}

/**
 * Update guild settings
 * @param {string} guildId - Discord guild ID
 * @param {Object} updates - Settings to update
 * @returns {boolean} Success status
 */
export async function updateGuildSettings(guildId, updates) {
  try {
    const db = mongoose.connection.db;
    const guildsCollection = db.collection('guilds');
    
    await guildsCollection.updateOne(
      { guildId: guildId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    
    console.log(`✅ Updated guild settings for ${guildId}`);
    return true;
  } catch (error) {
    console.error('Error updating guild settings:', error);
    return false;
  }
}

/**
 * Check if feature is enabled for guild
 * @param {string} guildId - Discord guild ID
 * @param {string} feature - Feature name
 * @returns {boolean} Feature enabled status
 */
export async function isFeatureEnabled(guildId, feature) {
  try {
    const settings = await getGuildSettings(guildId);
    return settings.features?.[feature] ?? true;
  } catch (error) {
    console.error('Error checking feature status:', error);
    return true; // Fail safe - allow feature
  }
}

/**
 * Check if user has permission for action in guild
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @param {string} permission - Permission type
 * @returns {boolean} Permission status
 */
export async function hasGuildPermission(guildId, userId, permission) {
  try {
    const settings = await getGuildSettings(guildId);
    const permissionList = settings.permissions?.[permission] || [];
    return permissionList.includes(userId);
  } catch (error) {
    console.error('Error checking guild permission:', error);
    return false;
  }
}

/**
 * Get guild-specific user data
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @returns {Object} User data for specific guild
 */
export async function getGuildUser(guildId, userId) {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    let user = await usersCollection.findOne({ 
      discordId: userId,
      guildId: guildId 
    });
    
    if (!user) {
      // Create new guild-specific user
      user = {
        discordId: userId,
        guildId: guildId,
        balance: 0,
        fishCount: 0,
        lastFish: null,
        lastDaily: null,
        marriageBonus: 0,
        ringInventory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(user);
      console.log(`✅ Created new user ${userId} for guild ${guildId}`);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting guild user:', error);
    return null;
  }
}

/**
 * Update guild-specific user data
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @param {Object} updates - User data updates
 * @returns {boolean} Success status
 */
export async function updateGuildUser(guildId, userId, updates) {
  try {
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { discordId: userId, guildId: guildId },
      { 
        $set: { 
          ...updates, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error updating guild user:', error);
    return false;
  }
}

/**
 * Get admin channel for guild
 * @param {string} guildId - Discord guild ID
 * @returns {string|null} Admin channel ID
 */
export async function getGuildAdminChannel(guildId) {
  try {
    const settings = await getGuildSettings(guildId);
    return settings.adminChannel;
  } catch (error) {
    console.error('Error getting admin channel:', error);
    return null;
  }
}

/**
 * Check if user is banned in specific guild
 * @param {string} guildId - Discord guild ID
 * @param {string} userId - Discord user ID
 * @returns {Object} Ban status
 */
export async function checkGuildBan(guildId, userId) {
  try {
    const db = mongoose.connection.db;
    const bannedUsersCollection = db.collection('bannedUsers');
    
    const ban = await bannedUsersCollection.findOne({
      userId: userId,
      guildId: guildId,
      isActive: true
    });
    
    if (!ban) return { isBanned: false };
    
    // Check expiry
    if (ban.expiresAt && new Date() > new Date(ban.expiresAt)) {
      await bannedUsersCollection.updateOne(
        { _id: ban._id },
        { $set: { isActive: false, unbannedAt: new Date() } }
      );
      return { isBanned: false };
    }
    
    return {
      isBanned: true,
      reason: ban.reason,
      bannedBy: ban.bannedByUsername,
      expiresAt: ban.expiresAt
    };
  } catch (error) {
    console.error('Error checking guild ban:', error);
    return { isBanned: false };
  }
}

/**
 * Initialize guild when bot joins
 * @param {Object} guild - Discord guild object
 * @returns {Object} Guild settings
 */
export async function initializeGuild(guild) {
  console.log(`🏠 Initializing new guild: ${guild.name} (${guild.id})`);
  
  const settings = await getGuildSettings(guild.id);
  
  // Try to find a suitable admin channel
  const adminChannel = guild.channels.cache.find(
    channel => channel.name.includes('admin') || 
               channel.name.includes('mod') ||
               channel.name.includes('bot')
  );
  
  if (adminChannel) {
    await updateGuildSettings(guild.id, {
      adminChannel: adminChannel.id
    });
    console.log(`📍 Set admin channel: ${adminChannel.name}`);
  }
  
  return settings;
}

/**
 * Get economy multiplier for guild
 * @param {string} guildId - Discord guild ID
 * @returns {number} Economy multiplier
 */
export async function getGuildEconomyMultiplier(guildId) {
  try {
    const settings = await getGuildSettings(guildId);
    return settings.economy?.fishingMultiplier || 1.0;
  } catch (error) {
    console.error('Error getting economy multiplier:', error);
    return 1.0;
  }
}