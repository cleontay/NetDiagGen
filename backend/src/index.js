import express from 'express';
import cors from 'cors';
import { isPrivateIPv4 } from './isPrivateIp.js';
import { checkDeviceReachable } from './statusCheck.js';
import { mapWithConcurrency } from './concurrency.js';

const MAX_DEVICES_PER_REQUEST = 100;
const MIN_REQUEST_INTERVAL_MS = 1000;
const CHECK_CONCURRENCY = 10;

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

let lastRequestAt = 0;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/status-check', async (req, res) => {
  const now = Date.now();
  if (now - lastRequestAt < MIN_REQUEST_INTERVAL_MS) {
    return res.status(429).json({ error: 'Too many requests, slow down.' });
  }
  lastRequestAt = now;

  const devices = req.body?.devices;
  if (!Array.isArray(devices)) {
    return res.status(400).json({ error: 'Expected { devices: [{ id, ip }] }' });
  }
  if (devices.length > MAX_DEVICES_PER_REQUEST) {
    return res.status(400).json({ error: `Too many devices; max ${MAX_DEVICES_PER_REQUEST} per request.` });
  }

  const results = await mapWithConcurrency(devices, CHECK_CONCURRENCY, async (device) => {
    if (!device?.id || !device?.ip) {
      return { id: device?.id, error: 'missing id or ip' };
    }
    if (!isPrivateIPv4(device.ip)) {
      return { id: device.id, error: 'only private IP ranges can be checked' };
    }
    const reachable = await checkDeviceReachable(device.ip, device.ports);
    return { id: device.id, reachable, checkedAt: new Date().toISOString() };
  });

  res.json({ results });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`NetDiagGen status-check backend listening on :${port}`);
});
