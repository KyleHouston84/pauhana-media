import { Gpio } from "onoff";

const button = new Gpio(529, "in", "falling", {
  debounceTimeout: 100,
});

export function onButtonPress(cb) {
  button.watch(err => {
    if (err) return;
    cb();
  });
}
