import 'dotenv/config';
import mongoose from 'mongoose';

console.log('🔍 Detailed MongoDB Connection Check...\n');

const mongoUri = process.env.MONGO_URI;
console.log('📡 MongoDB URI:', mongoUri);

if (!mongoUri) {
  console.error('❌ MONGO_URI not found');
  process.exit(1);
}

// Parse the connection string
const uriParts = mongoUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]*)/);
if (uriParts) {
  console.log('🔧 Connection Details:');
  console.log(`  - Username: ${uriParts[1]}`);
  console.log(`  - Password: ${uriParts[2] ? '[HIDDEN]' : 'Not found'}`);
  console.log(`  - Cluster: ${uriParts[3]}`);
  console.log(`  - Database: ${uriParts[4] || 'No database specified'}`);
}

console.log('\n🔌 Attempting connection...');

try {
  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
  });
  
  console.log('✅ Successfully connected to MongoDB!');
  console.log(`📊 Database name: ${connection.connection.name}`);
  console.log(`🖥️ Host: ${connection.connection.host}:${connection.connection.port}`);
  
  // Check collections
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log(`\n📋 Collections (${collections.length}):`);
  if (collections.length === 0) {
    console.log('  ❌ No collections found - This is why you don\'t see data in Compass!');
    console.log('  💡 Try using the bot commands to create some data first.');
  } else {
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count} documents`);
    }
  }
  
  // Try to create a test document
  console.log('\n🧪 Creating test data...');
  const testCollection = db.collection('test');
  await testCollection.insertOne({ 
    message: 'Test from bot', 
    timestamp: new Date(),
    purpose: 'Verify MongoDB connection works'
  });
  console.log('✅ Test document created successfully!');
  
  // Clean up test data
  await testCollection.deleteOne({ message: 'Test from bot' });
  console.log('🧹 Test document cleaned up');
  
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Check if your IP is whitelisted in MongoDB Atlas Network Access');
  console.log('2. Verify username and password are correct');
  console.log('3. Make sure the cluster is not paused');
  console.log('4. Try connecting from MongoDB Compass directly with the same URI');
  
} finally {
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}
