import { Gpio } from "onoff";

const button = new Gpio(516, "in", "both", {
  debounceTimeout: 100,
});

export function onButtonPress(cb) {
  button.watch((err) => {
    console.log("BUTTON WATCH", err);
    if (err) return;
    cb();
  });
}
