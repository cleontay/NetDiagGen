import { useCallback, useState } from 'react';

const API_URL = import.meta.env.VITE_STATUS_API_URL || 'http://localhost:4000';

// Talks to the optional backend (backend/) that performs live reachability
// checks, since a browser can't TCP-connect to arbitrary hosts itself. If
// the backend isn't running, checkNow just fails quietly and the UI falls
// back to whatever status the loaded JSON already reported.
export function useLiveStatus() {
  const [liveStatus, setLiveStatus] = useState({});
  const [checking, setChecking] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [attempted, setAttempted] = useState(false);

  const checkNow = useCallback(async (devices) => {
    const targets = devices.filter((d) => d.ip).map((d) => ({ id: d.id, ip: d.ip, ports: d.ports }));
    if (targets.length === 0) return;

    setChecking(true);
    setAttempted(true);
    try {
      const res = await fetch(`${API_URL}/api/status-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devices: targets }),
      });
      if (!res.ok) throw new Error(`Status check failed (${res.status})`);
      const { results } = await res.json();
      setBackendAvailable(true);
      setLiveStatus((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          next[r.id] = r;
        });
        return next;
      });
    } catch {
      setBackendAvailable(false);
    } finally {
      setChecking(false);
    }
  }, []);

  return { liveStatus, checking, backendAvailable, attempted, checkNow };
}
