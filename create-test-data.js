import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './schemas/userSchema.js';
import { GlobalStats } from './schemas/globalStatsSchema.js';

console.log('🎯 Creating test data for MongoDB...\n');

try {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected successfully!');
  
  // Create test user
  console.log('\n👤 Creating test user...');
  const testUser = new User({
    discordId: 'test123456789',
    balance: 1000,
    fish: new Map([
      ['Cá Chép', 5],
      ['Cá Rô', 3],
      ['Cá Trắm', 2]
    ]),
    rodLevel: 2
  });
  
  await testUser.save();
  console.log('✅ Test user created!');
  
  // Create global stats
  console.log('\n📊 Creating global stats...');
  const globalStats = new GlobalStats({
    statsId: 'global',
    totalFishCaught: new Map([
      ['Cá Chép', 50],
      ['Cá Rô', 30],
      ['Cá Trắm', 20]
    ]),
    totalPlayers: 1,
    lastUpdated: new Date()
  });
  
  await globalStats.save();
  console.log('✅ Global stats created!');
  
  // Verify data
  console.log('\n🔍 Verifying created data...');
  const userCount = await User.countDocuments();
  const statsCount = await GlobalStats.countDocuments();
  
  console.log(`📊 Users in database: ${userCount}`);
  console.log(`📈 Global stats records: ${statsCount}`);
  
  // List all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`\n📋 Collections now available (${collections.length}):`);
  collections.forEach(col => console.log(`  - ${col.name}`));
  
  console.log('\n✅ Test data created successfully!');
  console.log('💡 Now check MongoDB Compass - you should see:');
  console.log('   - Database: fishbot');
  console.log('   - Collections: users, globalstats');
  
} catch (error) {
  console.error('❌ Error creating test data:', error);
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}
