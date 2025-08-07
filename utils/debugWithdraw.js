// Debug withdraw notification
export async function debugWithdrawNotification() {
  console.log('🔍 Debugging withdraw notification...');
  console.log('🌍 All Environment Variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
  console.log('- ADMIN_CHANNEL_ID:', process.env.ADMIN_CHANNEL_ID);
  console.log('- ADMIN_ROLE_ID:', process.env.ADMIN_ROLE_ID);
  console.log('- DISCORD_TOKEN exists:', !!process.env.DISCORD_TOKEN);
  console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
  
  // Check tất cả env variables có chứa "ADMIN"
  const adminVars = Object.keys(process.env).filter(key => key.includes('ADMIN'));
  console.log('🔑 Admin-related variables found:', adminVars);
  
  if (!process.env.ADMIN_CHANNEL_ID) {
    console.error('❌ ADMIN_CHANNEL_ID is not set');
    console.log('💡 Check Railway Variables tab');
  }
  
  if (!process.env.ADMIN_ROLE_ID) {
    console.error('❌ ADMIN_ROLE_ID is not set'); 
    console.log('💡 Check Railway Variables tab');
  }
  
  return {
    adminChannelId: process.env.ADMIN_CHANNEL_ID,
    adminRoleId: process.env.ADMIN_ROLE_ID,
    configured: !!process.env.ADMIN_CHANNEL_ID,
    allAdminVars: adminVars,
    railwayEnv: process.env.RAILWAY_ENVIRONMENT,
    nodeEnv: process.env.NODE_ENV,
    discordTokenExists: !!process.env.DISCORD_TOKEN,
    mongoUriExists: !!process.env.MONGO_URI
  };
}