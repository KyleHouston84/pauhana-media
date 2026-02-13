import { exec } from "child_process";

export function getLogs(lines: number = 100): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `journalctl -u pauhana -n ${lines} --no-pager`,
      { maxBuffer: 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(stderr || err.message);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}
