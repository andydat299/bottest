import mongoose from 'mongoose';

console.log('💒 SETTING UP MARRIAGE & RING SHOP SYSTEM...\n');

async function setupMarriageSystem() {
  try {
    // Connect to database
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to database...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bottest');
    }

    console.log('✅ Connected to database');

    const db = mongoose.connection.db;

    // Create collections
    console.log('📦 Setting up marriage system collections...');
    
    const marriagesCollection = db.collection('marriages');
    const proposalsCollection = db.collection('proposals');
    const usersCollection = db.collection('users');
    
    // Create indexes for marriages
    await marriagesCollection.createIndex({ partner1: 1 });
    await marriagesCollection.createIndex({ partner2: 1 });
    await marriagesCollection.createIndex({ status: 1 });
    await marriagesCollection.createIndex({ marriedAt: -1 });
    await marriagesCollection.createIndex({ partner1: 1, partner2: 1 });

    // Create indexes for proposals
    await proposalsCollection.createIndex({ proposerId: 1 });
    await proposalsCollection.createIndex({ partnerId: 1 });
    await proposalsCollection.createIndex({ status: 1 });
    await proposalsCollection.createIndex({ expiresAt: 1 });
    await proposalsCollection.createIndex({ createdAt: -1 });

    console.log('✅ Created marriage collections with indexes');

    // Update users collection for marriage features
    console.log('👥 Adding marriage fields to users...');
    
    await usersCollection.updateMany(
      { ringInventory: { $exists: false } },
      { $set: { ringInventory: [] } }
    );

    await usersCollection.updateMany(
      { marriageBonus: { $exists: false } },
      { $set: { marriageBonus: 0 } }
    );

    console.log('✅ Updated users collection with marriage fields');

    console.log('\n💍 RING SHOP CONFIGURATION:');
    console.log('============================');

    const ringData = {
      silver_ring: { name: '💍 Nhẫn Bạc', price: 50000, bonus: 5, days: 30, rarity: 'Common' },
      gold_ring: { name: '💎 Nhẫn Vàng', price: 150000, bonus: 10, days: 60, rarity: 'Rare' },
      diamond_ring: { name: '💖 Nhẫn Kim Cương', price: 500000, bonus: 20, days: 180, rarity: 'Epic' },
      legendary_ring: { name: '🌟 Nhẫn Huyền Thoại', price: 1500000, bonus: 50, days: 365, rarity: 'Legendary' }
    };

    console.log('\n💍 Available Rings:');
    for (const [key, ring] of Object.entries(ringData)) {
      console.log(`${ring.name}:`);
      console.log(`   💰 Price: ${ring.price.toLocaleString()} xu`);
      console.log(`   💖 Marriage Bonus: +${ring.bonus}% xu`);
      console.log(`   ⏰ Duration: ${ring.days} days`);
      console.log(`   🏷️ Rarity: ${ring.rarity}`);
      console.log('');
    }

    console.log('💒 MARRIAGE SYSTEM FEATURES:');
    console.log('=============================');

    console.log('\n🎯 Core Features:');
    console.log('• 💍 Ring Shop with 4 ring types');
    console.log('• 💒 Marriage proposals with rings');
    console.log('• 💕 Marriage bonuses for activities');
    console.log('• 📊 Marriage status and history');
    console.log('• 🎉 Anniversary celebrations');
    console.log('• 🏆 Couple leaderboards');
    console.log('• 💔 Divorce system');

    console.log('\n🛡️ Security & Limits:');
    console.log('• Max 5 rings per user');
    console.log('• Ring expiration system');
    console.log('• Proposal timeout (24 hours)');
    console.log('• Marriage validation checks');
    console.log('• Atomic transactions');

    console.log('\n📋 Available Commands:');
    console.log('======================');

    console.log('\n💍 Ring Shop Commands:');
    console.log('/ring-shop view          # Xem cửa hàng nhẫn');
    console.log('/ring-shop buy           # Mua nhẫn cưới');
    console.log('/ring-shop inventory     # Xem nhẫn trong túi');

    console.log('\n💒 Marriage Commands:');
    console.log('/marry propose @user     # Cầu hôn người khác');
    console.log('/marry status           # Xem tình trạng hôn nhân');
    console.log('/marry divorce          # Ly hôn');
    console.log('/marry anniversary      # Xem kỷ niệm');
    console.log('/marry leaderboard      # Bảng xếp hạng cặp đôi');

    console.log('\n💡 Usage Examples:');
    console.log('==================');

    console.log('\n📤 Complete Marriage Flow:');
    console.log('1. /ring-shop buy ring_type:diamond_ring');
    console.log('2. /ring-shop inventory  # Get ring ID');
    console.log('3. /marry propose @partner ring_id:ring_12345');
    console.log('4. Partner clicks "💒 Đồng Ý" button');
    console.log('5. Marriage created with bonus!');

    console.log('\n💖 Marriage Benefits:');
    console.log('========================');

    console.log('\n📈 Bonus System:');
    console.log('• Silver Ring: +5% xu from all activities');
    console.log('• Gold Ring: +10% xu from all activities');
    console.log('• Diamond Ring: +20% xu from all activities');
    console.log('• Legendary Ring: +50% xu from all activities');

    console.log('\n🎮 Activity Integration:');
    console.log('• Fishing: Bonus xu when married');
    console.log('• Daily rewards: Marriage multiplier');
    console.log('• Work commands: Extra income');
    console.log('• Other game activities: Improved rewards');

    console.log('\n📊 Social Features:');
    console.log('===================');

    console.log('\n🏆 Leaderboards:');
    console.log('• Longest married couples');
    console.log('• Marriage success rates');
    console.log('• Anniversary milestones');
    console.log('• Most expensive rings used');

    console.log('\n🎉 Celebrations:');
    console.log('• 1 week milestone: 📅 Tuần trăng mật');
    console.log('• 1 month milestone: 🗓️ Tháng hạnh phúc');
    console.log('• 100 days milestone: 💯 Trăm ngày yêu');
    console.log('• 1 year milestone: 🎂 Kỷ niệm một năm');
    console.log('• 1000 days milestone: 🏆 Nghìn ngày bên nhau');

    // Sample data for testing
    console.log('\n🧪 Creating sample data...');

    // Create sample rings in user inventory
    const sampleUser = await usersCollection.findOne({ discordId: { $exists: true } });
    
    if (sampleUser && sampleUser.ringInventory.length === 0) {
      const sampleRing = {
        id: `ring_${Date.now()}`,
        type: 'silver_ring',
        name: '💍 Nhẫn Bạc',
        emoji: '💍',
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isUsed: false,
        marriageBonus: 5
      };

      await usersCollection.updateOne(
        { _id: sampleUser._id },
        { $push: { ringInventory: sampleRing } }
      );

      console.log('✅ Added sample ring to first user for testing');
    }

    console.log('\n🎯 DEPLOYMENT CHECKLIST:');
    console.log('========================');
    console.log('1. ✅ Database collections created');
    console.log('2. ✅ Indexes optimized');
    console.log('3. ✅ User fields updated');
    console.log('4. ✅ Sample data ready');
    console.log('5. 🔄 Deploy commands: npm run deploy');
    console.log('6. 🔄 Update interactionCreate.js for buttons');
    console.log('7. 🔄 Test ring shop: /ring-shop view');
    console.log('8. 🔄 Test marriage: /marry propose');

    console.log('\n⚠️ IMPORTANT INTEGRATION NOTES:');
    console.log('===============================');

    console.log('\n🔧 Button Handler Integration:');
    console.log('Add to your interactionCreate.js:');
    console.log(`
// Import
import { handleMarriageButtons } from '../handlers/marriageHandlers.js';

// In button handling section:
if (interaction.customId.startsWith('proposal_') || 
    interaction.customId.startsWith('divorce_')) {
  await handleMarriageButtons(interaction);
  return;
}
`);

    console.log('\n💰 Marriage Bonus Integration:');
    console.log('Update your activity commands (fish, daily, work) to include:');
    console.log(`
// Get marriage bonus
const user = await usersCollection.findOne({ discordId: interaction.user.id });
const marriageBonus = user?.marriageBonus || 0;

// Apply bonus to rewards
const baseReward = 1000;
const bonusReward = Math.floor(baseReward * (marriageBonus / 100));
const totalReward = baseReward + bonusReward;

// Show bonus in embed
if (marriageBonus > 0) {
  embed.addFields({
    name: '💕 Marriage Bonus',
    value: \`+\${bonusReward.toLocaleString()} xu (+\${marriageBonus}%)\`,
    inline: true
  });
}
`);

  } catch (error) {
    console.error('❌ Error setting up marriage system:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📴 Disconnected from database');
    }
  }
}

// Run setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMarriageSystem().then(() => {
    console.log('\n✅ Marriage & Ring Shop system setup completed!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. npm run deploy');
    console.log('2. Update interactionCreate.js with marriage handlers');
    console.log('3. Integrate marriage bonuses in activity commands');
    console.log('4. Test /ring-shop view');
    console.log('5. Test /marry propose workflow');
    console.log('6. Monitor user adoption!');
    console.log('\n💒 Ready to create digital love stories! 💕');
  });
}