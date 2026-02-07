import "./api.js";
import { onButtonPress } from "./button.js";
import { triggerEvent } from "./effectController.js";
import { scheduleRandomEvent } from "./randomEventScheduler.js";
import { pauhanaWLED } from "./wled.js";

onButtonPress(async () => {
  await triggerEvent("STORM");
});

pauhanaWLED.discover();

scheduleRandomEvent();

console.log("🍹 Pau Hana Event System ready");
