import 'dotenv/config';
import { REST, Routes } from 'discord.js';

console.log('🧹 Cleaning duplicate commands on Railway...');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

try {
  // Xóa guild commands trước
  if (guildId) {
    console.log('🗑️ Clearing guild commands...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] }
    );
    console.log('✅ Guild commands cleared');
  }
  
  // Xóa global commands
  console.log('🗑️ Clearing global commands...');
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [] }
  );
  console.log('✅ Global commands cleared');
  
  console.log('\n🎉 Cleanup completed!');
  console.log('💡 Now redeploy your bot on Railway');
  
} catch (error) {
  console.error('❌ Cleanup failed:', error);
}
