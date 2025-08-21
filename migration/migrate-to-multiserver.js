import mongoose from 'mongoose';

console.log('🔄 MIGRATING DATABASE TO MULTI-SERVER STRUCTURE...\n');

async function migrateToMultiServer() {
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to database...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bottest');
    }

    console.log('✅ Connected to database\n');

    const db = mongoose.connection.db;

    // STEP 1: Create new collections
    console.log('📦 STEP 1: Creating new collections...');
    
    const guildsCollection = db.collection('guilds');
    const usersCollection = db.collection('users');
    const marriagesCollection = db.collection('marriages');
    const transfersCollection = db.collection('transfers');
    const bannedUsersCollection = db.collection('bannedUsers');
    const proposalsCollection = db.collection('proposals');

    // Create indexes for new guild-based structure
    await guildsCollection.createIndex({ guildId: 1 }, { unique: true });
    await usersCollection.createIndex({ discordId: 1, guildId: 1 }, { unique: true });
    await marriagesCollection.createIndex({ guildId: 1 });
    await transfersCollection.createIndex({ guildId: 1 });
    await bannedUsersCollection.createIndex({ guildId: 1, userId: 1 });
    await proposalsCollection.createIndex({ guildId: 1 });

    console.log('✅ Created indexes for multi-server structure');

    // STEP 2: Migrate existing users
    console.log('\n👥 STEP 2: Migrating existing users...');
    
    // Get all existing users without guildId
    const existingUsers = await usersCollection.find({ guildId: { $exists: false } }).toArray();
    console.log(`📊 Found ${existingUsers.length} users to migrate`);

    // Default guild ID for existing data (use your main server ID)
    const DEFAULT_GUILD_ID = process.env.DEFAULT_GUILD_ID || 'DEFAULT_GUILD';
    
    for (const user of existingUsers) {
      // Create guild-specific version
      const migratedUser = {
        ...user,
        guildId: DEFAULT_GUILD_ID,
        _id: undefined // Let MongoDB create new ID
      };

      try {
        await usersCollection.insertOne(migratedUser);
        console.log(`✅ Migrated user: ${user.discordId}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ User ${user.discordId} already exists for guild ${DEFAULT_GUILD_ID}`);
        } else {
          console.error(`❌ Error migrating user ${user.discordId}:`, error);
        }
      }
    }

    // STEP 3: Migrate marriages
    console.log('\n💒 STEP 3: Migrating marriages...');
    
    const existingMarriages = await marriagesCollection.find({ guildId: { $exists: false } }).toArray();
    console.log(`📊 Found ${existingMarriages.length} marriages to migrate`);

    for (const marriage of existingMarriages) {
      await marriagesCollection.updateOne(
        { _id: marriage._id },
        { $set: { guildId: DEFAULT_GUILD_ID } }
      );
    }
    console.log('✅ Migrated marriages');

    // STEP 4: Migrate transfers
    console.log('\n💸 STEP 4: Migrating transfers...');
    
    const existingTransfers = await transfersCollection.find({ guildId: { $exists: false } }).toArray();
    console.log(`📊 Found ${existingTransfers.length} transfers to migrate`);

    for (const transfer of existingTransfers) {
      await transfersCollection.updateOne(
        { _id: transfer._id },
        { $set: { guildId: DEFAULT_GUILD_ID } }
      );
    }
    console.log('✅ Migrated transfers');

    // STEP 5: Migrate bans
    console.log('\n🔨 STEP 5: Migrating bans...');
    
    const existingBans = await bannedUsersCollection.find({ guildId: { $exists: false } }).toArray();
    console.log(`📊 Found ${existingBans.length} bans to migrate`);

    for (const ban of existingBans) {
      await bannedUsersCollection.updateOne(
        { _id: ban._id },
        { $set: { guildId: DEFAULT_GUILD_ID } }
      );
    }
    console.log('✅ Migrated bans');

    // STEP 6: Migrate proposals
    console.log('\n💍 STEP 6: Migrating proposals...');
    
    const existingProposals = await proposalsCollection.find({ guildId: { $exists: false } }).toArray();
    console.log(`📊 Found ${existingProposals.length} proposals to migrate`);

    for (const proposal of existingProposals) {
      await proposalsCollection.updateOne(
        { _id: proposal._id },
        { $set: { guildId: DEFAULT_GUILD_ID } }
      );
    }
    console.log('✅ Migrated proposals');

    // STEP 7: Create default guild settings
    console.log('\n🏠 STEP 7: Creating default guild settings...');
    
    const defaultGuild = {
      guildId: DEFAULT_GUILD_ID,
      economy: {
        enabled: true,
        fishingMultiplier: 1.0,
        transferEnabled: true,
        marriageEnabled: true,
        withdrawEnabled: true,
        dailyRewardAmount: 1000,
        maxTransferAmount: 100000
      },
      adminChannel: process.env.ADMIN_CHANNEL_ID || null,
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
        withdrawAdmins: [],
        economyAdmins: [],
        botAdmins: []
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
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await guildsCollection.insertOne(defaultGuild);
      console.log('✅ Created default guild settings');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️ Default guild settings already exist');
      } else {
        console.error('❌ Error creating default guild:', error);
      }
    }

    // STEP 8: Update bot event handlers
    console.log('\n🔧 STEP 8: Migration summary...');
    
    const migrationStats = {
      users: existingUsers.length,
      marriages: existingMarriages.length,
      transfers: existingTransfers.length,
      bans: existingBans.length,
      proposals: existingProposals.length,
      defaultGuildId: DEFAULT_GUILD_ID
    };

    console.log('📊 Migration Statistics:');
    console.log(`• Users migrated: ${migrationStats.users}`);
    console.log(`• Marriages migrated: ${migrationStats.marriages}`);
    console.log(`• Transfers migrated: ${migrationStats.transfers}`);
    console.log(`• Bans migrated: ${migrationStats.bans}`);
    console.log(`• Proposals migrated: ${migrationStats.proposals}`);
    console.log(`• Default Guild ID: ${migrationStats.defaultGuildId}`);

    console.log('\n⚠️ IMPORTANT NEXT STEPS:');
    console.log('========================');
    console.log('1. Update all command files to use guildId');
    console.log('2. Add guild manager to interactionCreate.js');
    console.log('3. Test guild-setup command');
    console.log('4. Update bot invite with proper permissions');
    console.log('5. Add guild join/leave event handlers');

    console.log('\n📋 REQUIRED COMMAND UPDATES:');
    console.log('============================');
    
    const commandsToUpdate = [
      'fish.js - Use getGuildUser() instead of direct user lookup',
      'balance.js - Use guildId in user queries',
      'transfer.js - Add guild restriction checks',
      'marry.js - Use guild-specific marriage queries',
      'withdraw.js - Use getGuildAdminChannel()',
      'ban-user.js - Use guild-specific ban queries',
      'ring-shop.js - Use guild-specific user data'
    ];

    commandsToUpdate.forEach(cmd => console.log(`• ${cmd}`));

    console.log('\n🔄 EXAMPLE CODE UPDATES:');
    console.log('========================');

    console.log('\nOLD (single-server):');
    console.log(`
const user = await usersCollection.findOne({ discordId: interaction.user.id });
`);

    console.log('\nNEW (multi-server):');
    console.log(`
import { getGuildUser } from '../utils/guildManager.js';
const user = await getGuildUser(interaction.guildId, interaction.user.id);
`);

    return migrationStats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📴 Disconnected from database');
    }
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToMultiServer().then((stats) => {
    console.log('\n✅ DATABASE MIGRATION COMPLETED!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Set DEFAULT_GUILD_ID in environment variables');
    console.log('2. Update all command files with guild support');
    console.log('3. Add guild event handlers to bot');
    console.log('4. Test multi-server functionality');
    console.log('5. Deploy updated bot to multiple servers');
    console.log('\n🌍 Bot is now ready for multi-server deployment!');
  }).catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
}

export default migrateToMultiServer;