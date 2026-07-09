import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TopologyView from './components/TopologyView';
import DashboardView from './components/DashboardView';
import DeviceDetailPanel from './components/DeviceDetailPanel';
import StatsBar from './components/StatsBar';
import SourceLoader from './components/SourceLoader';
import OverridesControls from './components/OverridesControls';
import LiveStatusControls from './components/LiveStatusControls';
import AlertsPanel from './components/AlertsPanel';
import OverridesChangelog from './components/OverridesChangelog';
import CompareSnapshot from './components/CompareSnapshot';
import { getDefaultIcon } from './data/nodeIcons';
import { parseNetworkJSON } from './data/parseNetworkJSON';
import { sampleData } from './data/sampleData';
import { mergeNodesWithOverrides } from './data/mergeOverrides';
import { mergeLiveStatus } from './data/mergeLiveStatus';
import { useLiveStatus } from './hooks/useLiveStatus';
import './App.css';

const AUTO_REFRESH_INTERVAL_MS = 30000;

export default function App() {
  const [graph, setGraph] = useState(() => parseNetworkJSON(sampleData));
  const [sourceLabel, setSourceLabel] = useState('Sample Data');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('topology');
  const [overrides, setOverrides] = useState({});
  const [showChangelog, setShowChangelog] = useState(false);
  const controlsRef = useRef(null);
  const {
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
  } = useLiveStatus();

  const overriddenNodes = useMemo(
    () => mergeNodesWithOverrides(graph.nodes, overrides),
    [graph.nodes, overrides]
  );
  const mergedNodes = useMemo(
    () => mergeLiveStatus(overriddenNodes, liveStatus),
    [overriddenNodes, liveStatus]
  );

  const latestDevicesRef = useRef(overriddenNodes);
  useEffect(() => {
    latestDevicesRef.current = overriddenNodes;
  }, [overriddenNodes]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => checkNow(latestDevicesRef.current), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoRefresh, checkNow]);

  const deviceNameById = useMemo(() => {
    const map = new Map();
    mergedNodes.forEach((n) => map.set(n.id, n.name));
    return map;
  }, [mergedNodes]);

  const loadJSON = useCallback((jsonData, meta = {}) => {
    try {
      const parsed = parseNetworkJSON(jsonData);
      setGraph(parsed);
      setSourceLabel(meta.label ?? null);
      setSelectedDevice(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleReset = useCallback(() => {
    setGraph({ nodes: [], edges: [] });
    setSourceLabel(null);
    setSelectedDevice(null);
    setError(null);
  }, []);

  const handleSaveOverride = useCallback((deviceId, fields) => {
    setOverrides((prev) => ({
      ...prev,
      [deviceId]: { ...prev[deviceId], ...fields, updatedAt: new Date().toISOString() },
    }));
    setSelectedDevice((prev) => (prev && prev.id === deviceId ? { ...prev, ...fields } : prev));
  }, []);

  const handleResetOverride = useCallback(
    (deviceId) => {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[deviceId];
        return next;
      });
      setSelectedDevice((prev) => {
        if (!prev || prev.id !== deviceId) return prev;
        return graph.nodes.find((n) => n.id === deviceId) ?? prev;
      });
    },
    [graph.nodes]
  );

  const handleImportOverrides = useCallback((imported) => {
    setOverrides((prev) => ({ ...prev, ...imported }));
  }, []);

  const handleBulkApply = useCallback(
    (deviceIds, { tags, remarks }) => {
      const addedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const newRemarks = remarks.trim();
      const now = new Date().toISOString();

      setOverrides((prev) => {
        const next = { ...prev };
        deviceIds.forEach((id) => {
          const existing = next[id] ?? {};
          const baseNode = graph.nodes.find((n) => n.id === id);
          const existingTags = existing.tags ?? baseNode?.tags ?? [];
          const mergedTags = addedTags.length ? [...new Set([...existingTags, ...addedTags])] : existingTags;
          next[id] = {
            ...existing,
            ...(mergedTags.length ? { tags: mergedTags } : {}),
            ...(newRemarks ? { remarks: newRemarks } : {}),
            updatedAt: now,
          };
        });
        return next;
      });
    },
    [graph.nodes]
  );

  const handleExportPng = useCallback(() => {
    const dataUrl = controlsRef.current?.exportPng();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'network-topology.png';
    a.click();
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Network Topology Visualizer</h1>
        <p>Upload JSON to visualize your network infrastructure</p>
      </header>

      <div className="controls">
        <SourceLoader onLoad={loadJSON} onError={setError} />

        <CompareSnapshot currentNodes={graph.nodes} onError={setError} />

        <OverridesControls
          overrides={overrides}
          onImport={handleImportOverrides}
          onError={setError}
          onOpenChangelog={() => setShowChangelog(true)}
        />

        <LiveStatusControls
          checking={checking}
          backendAvailable={backendAvailable}
          attempted={attempted}
          onCheckNow={() => checkNow(overriddenNodes)}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
        />

        <div className="view-controls">
          <button className="reset-btn" onClick={handleReset}>
            Clear Graph
          </button>
          {view === 'topology' && (
            <>
              <button onClick={() => controlsRef.current?.zoomIn()}>Zoom In</button>
              <button onClick={() => controlsRef.current?.zoomOut()}>Zoom Out</button>
              <button onClick={() => controlsRef.current?.fit()}>Fit to Screen</button>
              <button onClick={() => controlsRef.current?.layoutGrid()}>Grid Layout</button>
              <button onClick={() => controlsRef.current?.layoutCircle()}>Circle Layout</button>
              <button onClick={handleExportPng}>Export PNG</button>
            </>
          )}
          <button onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {sourceLabel && <div className="current-source">Showing: {sourceLabel}</div>}

      <StatsBar nodes={mergedNodes} edges={graph.edges} />

      <div className="view-tabs">
        <button className={view === 'topology' ? 'active' : ''} onClick={() => setView('topology')}>
          Topology View
        </button>
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
          Dashboard View
        </button>
      </div>

      {view === 'topology' ? (
        <TopologyView
          nodes={mergedNodes}
          edges={graph.edges}
          onNodeSelect={setSelectedDevice}
          controlsRef={controlsRef}
        />
      ) : (
        <DashboardView
          nodes={mergedNodes}
          selectedId={selectedDevice?.id}
          onSelectDevice={setSelectedDevice}
          onBulkApply={handleBulkApply}
        />
      )}

      {view === 'topology' && (
        <div className="legend">
          <h3>Legend</h3>
          <p className="legend-hint">
            Border color = status. Icon = device type (or a custom uploaded icon). Dashed boxes group
            devices by network.
          </p>
          <div className="legend-items">
            <div>
              <span className="legend-swatch" style={{ borderColor: '#28a745', background: '#e6f7e9' }} /> Online
            </div>
            <div>
              <span className="legend-swatch" style={{ borderColor: '#dc3545', background: '#fdecea' }} /> Offline
            </div>
            <div>
              <img className="legend-icon" src={getDefaultIcon('router')} alt="" /> Router
            </div>
            <div>
              <img className="legend-icon" src={getDefaultIcon('server')} alt="" /> Server
            </div>
            <div>
              <img className="legend-icon" src={getDefaultIcon('workstation')} alt="" /> Workstation
            </div>
            <div>
              <img className="legend-icon" src={getDefaultIcon('iot')} alt="" /> IoT
            </div>
            <div>
              <img className="legend-icon" src={getDefaultIcon('other')} alt="" /> Other
            </div>
          </div>
        </div>
      )}

      <DeviceDetailPanel
        device={selectedDevice}
        override={selectedDevice ? overrides[selectedDevice.id] : undefined}
        history={selectedDevice ? history.filter((h) => h.id === selectedDevice.id).slice(-15) : []}
        onSave={handleSaveOverride}
        onResetOverride={handleResetOverride}
      />

      <AlertsPanel
        alerts={alerts}
        getDeviceName={(id) => deviceNameById.get(id)}
        onDismiss={dismissAlert}
        onClearAll={clearAlerts}
      />

      <OverridesChangelog
        open={showChangelog}
        overrides={overrides}
        baseNodes={graph.nodes}
        onClose={() => setShowChangelog(false)}
      />
    </div>
  );
}
