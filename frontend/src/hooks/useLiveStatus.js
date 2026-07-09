import { useCallback, useRef, useState } from 'react';

const API_URL = import.meta.env.VITE_STATUS_API_URL || 'http://localhost:4000';
const HISTORY_LIMIT = 300;
const ALERTS_LIMIT = 30;

// Talks to the optional backend (backend/) that performs live reachability
// checks, since a browser can't TCP-connect to arbitrary hosts itself. If
// the backend isn't running, checkNow just fails quietly and the UI falls
// back to whatever status the loaded JSON already reported.
export function useLiveStatus() {
  const [liveStatus, setLiveStatus] = useState({});
  const [checking, setChecking] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [attempted, setAttempted] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const prevReachableRef = useRef({});

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

      const newAlerts = [];
      const newHistoryEntries = [];
      results.forEach((r) => {
        if (r.reachable === undefined) return;
        const prev = prevReachableRef.current[r.id];
        if (prev !== undefined && prev !== r.reachable) {
          newAlerts.push({ key: `${r.id}-${r.checkedAt}`, id: r.id, from: prev, to: r.reachable, at: r.checkedAt });
        }
        prevReachableRef.current[r.id] = r.reachable;
        newHistoryEntries.push({ id: r.id, reachable: r.reachable, checkedAt: r.checkedAt });
      });

      setLiveStatus((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          next[r.id] = r;
        });
        return next;
      });

      if (newHistoryEntries.length > 0) {
        setHistory((prev) => [...prev, ...newHistoryEntries].slice(-HISTORY_LIMIT));
      }
      if (newAlerts.length > 0) {
        setAlerts((prev) => [...newAlerts.reverse(), ...prev].slice(0, ALERTS_LIMIT));
      }
    } catch {
      setBackendAvailable(false);
    } finally {
      setChecking(false);
    }
  }, []);

  const dismissAlert = useCallback((key) => {
    setAlerts((prev) => prev.filter((a) => a.key !== key));
  }, []);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return {
    liveStatus,
    checking,
    backendAvailable,
    attempted,
    checkNow,
    history,
    alerts,
    dismissAlert,
    clearAlerts,
    autoRefresh,
    setAutoRefresh,
  };
}
