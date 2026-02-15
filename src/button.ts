import { Gpio } from "onoff";

// GPIO is only available on Linux (Raspberry Pi)
const isLinux = process.platform === "linux";
let button: Gpio | null = null;

if (isLinux) {
  try {
    // GPIO4 (pin 516) with pull-up resistor (configured in /boot/config.txt)
    // Edge: "falling" - trigger when button pressed (HIGH→LOW)
    button = new Gpio(516, "in", "falling", {
      debounceTimeout: 100,
    });
    console.log("🔘 GPIO button initialized on pin 516 (GPIO4)");

    // Log initial state for debugging
    const initialValue = button.readSync();
    console.log(`🔘 Initial button state: ${initialValue} (${initialValue === 1 ? 'not pressed' : 'pressed'})`);
  } catch (err) {
    console.error("❌ Failed to initialize GPIO button:", err);
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

    // Log all button events for debugging
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
