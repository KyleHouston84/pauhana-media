import "./api.js";
import { onButtonPress } from "./button.js";
import { triggerEvent } from "./effectController.js";

onButtonPress(async () => {
  await triggerEvent("STORM");
});

console.log("🍹 Pau Hana Storm System ready");
