import "./api.js";
import { onButtonPress } from "./button.js";
import { summonStorm } from "./stormController.js";

onButtonPress(async () => {
  await summonStorm();
});

console.log("🍹 Pau Hana Storm System ready");