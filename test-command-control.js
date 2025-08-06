// Test command control functionality
import { disableCommand, enableCommand, isCommandDisabled, getCommandStatus } from './utils/commandControl.js';

console.log('🧪 Testing Command Control System...\n');

// Test disable command
console.log('1. Testing disable sell command:');
const disableResult = disableCommand('sell');
console.log(disableResult);

// Test check if disabled
console.log('\n2. Checking if sell is disabled:');
console.log('Is sell disabled?', isCommandDisabled('sell'));

// Test command status
console.log('\n3. Command status:');
console.log(getCommandStatus());

// Test enable command
console.log('\n4. Testing enable sell command:');
const enableResult = enableCommand('sell');
console.log(enableResult);

console.log('\n5. Final check - is sell disabled?', isCommandDisabled('sell'));

console.log('\n✅ Command Control System test completed!');
