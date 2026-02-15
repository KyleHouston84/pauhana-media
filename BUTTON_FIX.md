# GPIO Button Fix for Pau Hana Media

## Problem

Button connected directly to GND doesn't trigger watch function in `/src/button.ts`.

## Root Cause

1. **Missing pull-up resistor** - GPIO needs internal pull-up when button connects to ground
2. **Wrong edge detection** - Using "both" instead of "falling"
3. **Incomplete watch callback** - Missing `value` parameter
4. **Note**: The onoff library doesn't support the `activeLow` or `reconfigureDirection` options in the constructor - these were incorrectly suggested

## Button Wiring
```
GPIO4 (Physical Pin 7) ----[Button]---- GND
                      |
                 (internal pull-up)
```

When button pressed: GPIO4 → GND (LOW/0)
When button released: GPIO4 → 3.3V via pull-up (HIGH/1)

## The Fix

Unfortunately, the `onoff` library doesn't provide a way to enable the internal pull-up resistor directly in JavaScript. You have two options:

### Option 1: Enable Pull-up via Device Tree (Recommended)

Add to `/boot/config.txt` on the Pi:
```
# Enable pull-up on GPIO4
gpio=4=pu
```

Then reboot:
```bash
sudo reboot
```

### Option 2: Use raspi-gpio Command

Enable pull-up before starting the service:
```bash
# Enable pull-up on GPIO4
raspi-gpio set 4 pu

# Or add to your systemd service
```

## Updated button.ts Code

```typescript
import { Gpio } from "onoff";

// GPIO is only available on Linux (Raspberry Pi)
const isLinux = process.platform === "linux";
let button: Gpio | null = null;

if (isLinux) {
  try {
    // GPIO4 (pin 516 in character device numbering)
    // Edge: "falling" - trigger when button pressed (HIGH→LOW)
    // Note: Pull-up must be configured via device tree or raspi-gpio
    button = new Gpio(516, "in", "falling", {
      debounceTimeout: 100,
    });
    console.log("🔘 GPIO button initialized on pin 516 (GPIO4)");

    // Log initial state
    const initialValue = button.readSync();
    console.log(`🔘 Initial button state: ${initialValue} (${initialValue === 1 ? 'not pressed' : 'pressed'})`);
  } catch (err) {
    console.error("❌ Failed to initialize GPIO button:", err);
    console.error("Possible fixes:");
    console.error("  1. Enable pull-up: Add 'gpio=4=pu' to /boot/config.txt");
    console.error("  2. Run: sudo usermod -a -G gpio $USER");
    console.error("  3. Check if GPIO is already in use");
  }
} else {
  console.log("⚠️  GPIO button disabled (not running on Linux/Raspberry Pi)");
}

export function onButtonPress(cb: () => void): void {
  if (!button) {
    console.log("⚠️  GPIO button not available");
    return;
  }

  button.watch((err, value) => {
    if (err) {
      console.error("❌ GPIO watch error:", err);
      return;
    }

    // Log all events for debugging
    console.log(`🔘 Button event: value=${value} (${value === 0 ? 'pressed' : 'released'})`);

    // Only trigger callback on button press (falling edge, value = 0)
    if (value === 0) {
      console.log("⚡ Button press detected - triggering storm!");
      cb();
    }
  });

  console.log("👀 GPIO watch registered - button monitoring active");
}

// Cleanup function for graceful shutdown
export function cleanupButton(): void {
  if (button) {
    console.log("🛑 Cleaning up GPIO button...");
    button.unexport();
    button = null;
  }
}
```

## Testing Steps

### 1. Deploy test script to Pi:
```bash
scp test-button.js kyle@pauhana-pi.local:~/pauhana-media/
```

### 2. Stop the main service:
```bash
ssh kyle@pauhana-pi.local 'sudo systemctl stop pauhana.service'
```

### 3. Enable pull-up resistor (choose one):

**Option A: Device Tree (permanent, survives reboots)**
```bash
ssh kyle@pauhana-pi.local
sudo nano /boot/config.txt
# Add this line at the end:
gpio=4=pu
# Save and exit, then:
sudo reboot
```

**Option B: Runtime command (temporary, lost on reboot)**
```bash
ssh kyle@pauhana-pi.local 'sudo raspi-gpio set 4 pu'
```

### 4. Run test script:
```bash
ssh kyle@pauhana-pi.local 'cd pauhana-media && node test-button.js'
```

Expected output:
```
🔘 GPIO Button Test Script
Testing GPIO4 (pin 516) with pull-up resistor
Button should connect GPIO4 to GND when pressed

✅ GPIO initialized successfully
Initial GPIO state: 1 (HIGH - not pressed)

📋 Waiting for button presses... (Press Ctrl+C to exit)

[timestamp] Button event detected!
  - GPIO value: 0
  - State: 🔴 PRESSED (LOW)
  - ✨ Button press confirmed!
```

### 5. If test works, update button.ts and deploy:
```bash
# Update src/button.ts with the fixed code above
# Then deploy:
npm run deploy
```

## Troubleshooting

### "Cannot access /sys/class/gpio/..."
- Permission issue. Run: `sudo usermod -a -G gpio kyle && sudo reboot`

### Button press triggers twice
- Edge detection set to "both" instead of "falling"
- Fix: Use `"falling"` as the third parameter to `new Gpio()`

### Always reads LOW (0)
- No pull-up resistor enabled
- Fix: Add `gpio=4=pu` to `/boot/config.txt` and reboot

### Always reads HIGH (1)
- Button not properly connected to ground
- Check wiring: Button should connect GPIO4 → GND when pressed

### "Resource busy" error
- GPIO already in use by another process
- Stop other processes: `sudo systemctl stop pauhana.service`
- Check what's using it: `sudo fuser /sys/class/gpio/gpio4/value`
