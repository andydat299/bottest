// Đã được thay thế bằng instant-cleanup.js
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧹 Starting cleanup of empty files...');

// Directories to scan
const dirsToScan = [
  'commands',
  'events', 
  'utils',
  'schemas',
  'config'
];

// Files to ignore (even if empty)
const ignoreFiles = [
  '.gitkeep',
  '.env.example',
  'README.md'
];

let totalScanned = 0;
let emptyFilesFound = 0;
let filesDeleted = 0;

function isFileEmpty(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8').trim();
    
    // Check if completely empty
    if (content.length === 0) {
      return true;
    }
    
    // Check if only contains comments or whitespace
    const lines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('/*') && 
             !trimmed.startsWith('*') &&
             !trimmed.startsWith('*/');
    });
    
    return lines.length === 0;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dirPath) {
  try {
    console.log(`📂 Scanning: ${dirPath}`);
    
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = join(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isFile()) {
        totalScanned++;
        
        // Skip ignored files
        if (ignoreFiles.includes(item)) {
          console.log(`⏭️  Skipping: ${item} (ignored)`);
          continue;
        }
        
        // Skip non-JS files unless specified
        if (!item.endsWith('.js') && !item.endsWith('.json') && !item.endsWith('.md')) {
          continue;
        }
        
        console.log(`🔍 Checking: ${itemPath}`);
        
        if (isFileEmpty(itemPath)) {
          emptyFilesFound++;
          console.log(`📄 Empty file found: ${itemPath}`);
          
          try {
            unlinkSync(itemPath);
            filesDeleted++;
            console.log(`🗑️  Deleted: ${itemPath}`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete ${itemPath}:`, deleteError.message);
          }
        } else {
          console.log(`✅ Has content: ${item}`);
        }
      } else if (stat.isDirectory() && !item.startsWith('.')) {
        // Recursively scan subdirectories
        scanDirectory(itemPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning ${dirPath}:`, error.message);
  }
}

// Scan root directory for JS files
console.log('📂 Scanning root directory...');
try {
  const rootItems = readdirSync(__dirname);
  
  for (const item of rootItems) {
    if (item.endsWith('.js') && !ignoreFiles.includes(item)) {
      const itemPath = join(__dirname, item);
      const stat = statSync(itemPath);
      
      if (stat.isFile()) {
        totalScanned++;
        console.log(`🔍 Checking root file: ${itemPath}`);
        
        if (isFileEmpty(itemPath)) {
          emptyFilesFound++;
          console.log(`📄 Empty root file found: ${itemPath}`);
          
          try {
            unlinkSync(itemPath);
            filesDeleted++;
            console.log(`🗑️  Deleted: ${itemPath}`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete ${itemPath}:`, deleteError.message);
          }
        } else {
          console.log(`✅ Root file has content: ${item}`);
        }
      }
    }
  }
} catch (error) {
  console.error('❌ Error scanning root directory:', error.message);
}

// Scan specified directories
for (const dir of dirsToScan) {
  const dirPath = join(__dirname, dir);
  
  try {
    if (statSync(dirPath).isDirectory()) {
      scanDirectory(dirPath);
    }
  } catch (error) {
    console.log(`⏭️  Directory not found: ${dir}`);
  }
}

// Summary
console.log('\n📊 Cleanup Summary:');
console.log(`🔍 Total files scanned: ${totalScanned}`);
console.log(`📄 Empty files found: ${emptyFilesFound}`);
console.log(`🗑️  Files deleted: ${filesDeleted}`);

if (filesDeleted > 0) {
  console.log(`\n✅ Cleanup completed! Deleted ${filesDeleted} empty files.`);
} else {
  console.log('\n✨ No empty files found. Project is clean!');
}

// List remaining files for verification
console.log('\n📋 Remaining files by directory:');

for (const dir of dirsToScan) {
  const dirPath = join(__dirname, dir);
  
  try {
    if (statSync(dirPath).isDirectory()) {
      const files = readdirSync(dirPath).filter(f => f.endsWith('.js'));
      console.log(`📂 ${dir}: ${files.length} files`);
      
      if (files.length <= 5) {
        files.forEach(f => console.log(`   - ${f}`));
      } else {
        files.slice(0, 3).forEach(f => console.log(`   - ${f}`));
        console.log(`   ... and ${files.length - 3} more`);
      }
    }
  } catch (error) {
    console.log(`📂 ${dir}: directory not found`);
  }
}