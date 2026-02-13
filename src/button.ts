import { Gpio } from "onoff";

// GPIO is only available on Linux (Raspberry Pi)
const isLinux = process.platform === "linux";
let button: Gpio | null = null;

if (isLinux) {
  try {
    button = new Gpio(516, "in", "both", {
      debounceTimeout: 100,
    });
    console.log("🔘 GPIO button initialized");
  } catch (err) {
    console.warn("Failed to initialize GPIO button:", err);
  }
} else {
  console.log("⚠️  GPIO button disabled (not running on Linux/Raspberry Pi)");
}

export function onButtonPress(cb: () => void): void {
  if (!button) {
    console.log("GPIO button not available");
    return;
  }

  button.watch((err) => {
    console.log("BUTTON WATCH", err);
    if (err) return;
    cb();
  });
}
