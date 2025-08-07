// Debug withdraw notification
export async function debugWithdrawNotification() {
  console.log('🔍 Debugging withdraw notification...');
  console.log('ADMIN_CHANNEL_ID:', process.env.ADMIN_CHANNEL_ID);
  console.log('ADMIN_ROLE_ID:', process.env.ADMIN_ROLE_ID);
  
  if (!process.env.ADMIN_CHANNEL_ID) {
    console.error('❌ ADMIN_CHANNEL_ID is not set in .env file');
    console.log('💡 Please add ADMIN_CHANNEL_ID=your_channel_id to .env');
  }
  
  return {
    adminChannelId: process.env.ADMIN_CHANNEL_ID,
    adminRoleId: process.env.ADMIN_ROLE_ID,
    configured: !!process.env.ADMIN_CHANNEL_ID
  };
}