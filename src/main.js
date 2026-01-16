import "./api.js";
import { onButtonPress } from "./button.js";
import { triggerEvent } from "./effectController.js";
import { scheduleRandomEvent } from "./randomEventScheduler.js";

onButtonPress(async () => {
  await triggerEvent("STORM");
});

scheduleRandomEvent();

console.log("🍹 Pau Hana Event System ready");
