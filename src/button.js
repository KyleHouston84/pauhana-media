import { Gpio } from "onoff";

const button = new Gpio(17, "in", "falling", {
  debounceTimeout: 100,
});

export function onButtonPress(cb) {
  button.watch(err => {
    if (err) return;
    cb();
  });
}
