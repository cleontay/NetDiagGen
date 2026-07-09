import net from 'node:net';

const DEFAULT_PORTS = [80, 443, 22, 3389, 445, 8080];
const CONNECT_TIMEOUT_MS = 800;

// Classifies a single port: 'open' (connection accepted), 'closed' (actively
// refused — the host is up, just not listening there), or 'filtered' (no
// response at all within the timeout, i.e. we can't tell).
function probePort(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (state) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ port, state });
    };

    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.once('connect', () => finish('open'));
    socket.once('timeout', () => finish('filtered'));
    socket.once('error', (err) => finish(err.code === 'ECONNREFUSED' ? 'closed' : 'filtered'));
    socket.connect(port, ip);
  });
}

// A device is considered reachable if any port is open or actively closed
// (refused) — a refusal still proves the host itself responded. Only "all
// filtered" means no response was seen at all.
export async function scanDevice(ip, ports) {
  const candidatePorts = ports?.length ? ports : DEFAULT_PORTS;
  const results = await Promise.all(candidatePorts.map((port) => probePort(ip, port)));
  const openPorts = results.filter((r) => r.state === 'open').map((r) => r.port);
  const reachable = results.some((r) => r.state !== 'filtered');
  return { reachable, openPorts };
}
