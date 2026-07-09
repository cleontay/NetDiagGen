import net from 'node:net';

const DEFAULT_PORTS = [80, 443, 22, 3389, 445, 8080];
const CONNECT_TIMEOUT_MS = 800;

// A device is considered reachable if any port either accepts a connection
// or actively refuses one (ECONNREFUSED) — a refusal still proves the host
// itself responded. A timeout/unreachable error means no response at all.
function probePort(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (reachable) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(reachable);
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', (err) => finish(err.code === 'ECONNREFUSED'));
    socket.connect(port, ip);
  });
}

export async function checkDeviceReachable(ip, ports) {
  const candidatePorts = ports?.length ? ports : DEFAULT_PORTS;
  const results = await Promise.all(candidatePorts.map((port) => probePort(ip, port)));
  return results.some(Boolean);
}
