import { execFile } from 'node:child_process';

const PING_TIMEOUT_S = 1;

// Shells out to the system `ping` command for a real ICMP echo check.
// Returns true (replied), false (sent but no reply/timed out), or null if
// `ping` isn't installed on this host at all — callers should treat null as
// "no ICMP signal available" rather than "device is down".
export function pingHost(ip) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const args = isWindows
      ? ['-n', '1', '-w', String(PING_TIMEOUT_S * 1000), ip]
      : ['-c', '1', '-W', String(PING_TIMEOUT_S), ip];

    execFile('ping', args, { timeout: (PING_TIMEOUT_S + 1) * 1000 }, (err) => {
      if (!err) {
        resolve(true);
        return;
      }
      if (err.code === 'ENOENT') {
        resolve(null);
        return;
      }
      resolve(false);
    });
  });
}
