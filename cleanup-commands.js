import 'dotenv/config';
import { REST, Routes } from 'discord.js';

console.log('🧹 Cleaning up duplicate commands...');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

try {
  console.log('🗑️ Deleting all guild commands...');
  if (guildId) {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: [] },
    );
    console.log('✅ Guild commands cleared');
  }
  
  console.log('🗑️ Deleting all global commands...');
  await rest.put(
    Routes.applicationCommands(clientId),
    { body: [] },
  );
  console.log('✅ Global commands cleared');
  
  console.log('\n🎉 All commands deleted!');
  console.log('💡 Now restart your bot to redeploy only one set of commands');
  console.log('⏰ It may take up to 1 hour for global commands to disappear completely');
  
} catch (error) {
  console.error('❌ Cleanup failed:', error);
}
