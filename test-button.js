#!/usr/bin/env node

/**
 * GPIO Button Test Script
 * Tests GPIO4 (pin 516) with button connected to ground
 *
 * Run on Pi: node test-button.js
 */

import { Gpio } from 'onoff';

console.log('🔘 GPIO Button Test Script');
console.log('Testing GPIO4 (pin 516) with pull-up resistor');
console.log('Button should connect GPIO4 to GND when pressed\n');

let button;

try {
  // Initialize GPIO4 with pull-up resistor
  // - Pin 516 (GPIO4)
  // - Direction: 'in' (input)
  // - Edge: 'falling' (trigger on button press, HIGH→LOW)
  // - Options:
  //   - debounceTimeout: prevent bouncing
  //   - activeLow: false (we'll read 0 when pressed, 1 when released)
  //   - reconfigureDirection: false (safer, don't reconfigure if already in use)
  button = new Gpio(516, 'in', 'falling', {
    debounceTimeout: 100,
    activeLow: false,
    reconfigureDirection: false,
  });

  console.log('✅ GPIO initialized successfully');

  // Read initial state
  const initialValue = button.readSync();
  console.log(`Initial GPIO state: ${initialValue} (${initialValue === 1 ? 'HIGH - not pressed' : 'LOW - pressed'})`);
  console.log('\n📋 Waiting for button presses... (Press Ctrl+C to exit)\n');

  // Watch for button presses
  button.watch((err, value) => {
    if (err) {
      console.error('❌ Watch error:', err);
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Button event detected!`);
    console.log(`  - GPIO value: ${value}`);
    console.log(`  - State: ${value === 0 ? '🔴 PRESSED (LOW)' : '🟢 RELEASED (HIGH)'}`);

    if (value === 0) {
      console.log('  - ✨ Button press confirmed!\n');
    }
  });

} catch (err) {
  console.error('\n❌ Failed to initialize GPIO:', err);
  console.error('\nPossible issues:');
  console.error('  1. Not running on Raspberry Pi / Linux');
  console.error('  2. GPIO already in use by another process');
  console.error('  3. Permission denied (try: sudo usermod -a -G gpio $USER)');
  console.error('  4. onoff library not installed (npm install onoff)');
  process.exit(1);
}

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n🛑 Cleaning up and exiting...');
  if (button) {
    button.unexport();
  }
  process.exit(0);
});

// Keep process alive
console.log('Process running (PID:', process.pid, ')\n');
