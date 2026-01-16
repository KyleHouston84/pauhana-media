import { Gpio } from "onoff";

const button = new Gpio(529, "in", "falling", {
  debounceTimeout: 100,
});

console.log('BUTTON', button)

export function onButtonPress(cb) {
  button.watch(err => {
    console.log('BUTTON WATCH', err);
    if (err) return;
    cb();
  });
}
