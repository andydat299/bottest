// Test script để kiểm tra syntax của các commands
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing command files syntax...');

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
console.log(`Found ${commandFiles.length} command files to test:`, commandFiles);

let successCount = 0;
let errorCount = 0;

for (const file of commandFiles) {
  try {
    console.log(`Testing ${file}...`);
    const commandModule = await import(`./commands/${file}`);
    const command = commandModule.default || commandModule;
    
    if (command && command.data && command.data.name) {
      console.log(`✅ ${file} - OK (${command.data.name})`);
      successCount++;
    } else {
      console.log(`⚠️ ${file} - Missing data or data.name`);
      errorCount++;
    }
  } catch (error) {
    console.log(`❌ ${file} - Error:`, error.message);
    errorCount++;
  }
}

console.log(`\n📊 Results:`);
console.log(`✅ Success: ${successCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📁 Total: ${commandFiles.length}`);

if (errorCount === 0) {
  console.log('\n🎉 All commands syntax OK!');
} else {
  console.log('\n⚠️ Some commands have issues, please fix them.');
}
