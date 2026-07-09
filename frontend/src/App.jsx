import { useCallback, useMemo, useRef, useState } from 'react';
import TopologyView from './components/TopologyView';
import DashboardView from './components/DashboardView';
import DeviceDetailPanel from './components/DeviceDetailPanel';
import StatsBar from './components/StatsBar';
import SourceLoader from './components/SourceLoader';
import OverridesControls from './components/OverridesControls';
import LiveStatusControls from './components/LiveStatusControls';
import { parseNetworkJSON } from './data/parseNetworkJSON';
import { sampleData } from './data/sampleData';
import { mergeNodesWithOverrides } from './data/mergeOverrides';
import { mergeLiveStatus } from './data/mergeLiveStatus';
import { useLiveStatus } from './hooks/useLiveStatus';
import './App.css';

export default function App() {
  const [graph, setGraph] = useState(() => parseNetworkJSON(sampleData));
  const [sourceLabel, setSourceLabel] = useState('Sample Data');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('topology');
  const [overrides, setOverrides] = useState({});
  const controlsRef = useRef(null);
  const { liveStatus, checking, backendAvailable, attempted, checkNow } = useLiveStatus();

  const overriddenNodes = useMemo(
    () => mergeNodesWithOverrides(graph.nodes, overrides),
    [graph.nodes, overrides]
  );
  const mergedNodes = useMemo(
    () => mergeLiveStatus(overriddenNodes, liveStatus),
    [overriddenNodes, liveStatus]
  );

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

  return (
    <div className="container">
      <header>
        <h1>Network Topology Visualizer</h1>
        <p>Upload JSON to visualize your network infrastructure</p>
      </header>

      <div className="controls">
        <SourceLoader onLoad={loadJSON} onError={setError} />

        <OverridesControls overrides={overrides} onImport={handleImportOverrides} onError={setError} />

        <LiveStatusControls
          checking={checking}
          backendAvailable={backendAvailable}
          attempted={attempted}
          onCheckNow={() => checkNow(overriddenNodes)}
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
            </>
          )}
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
        <DashboardView nodes={mergedNodes} selectedId={selectedDevice?.id} onSelectDevice={setSelectedDevice} />
      )}

      {view === 'topology' && (
        <div className="legend">
          <h3>Legend</h3>
          <p className="legend-hint">Color = status, shape = device type. Dashed boxes group devices by network.</p>
          <div className="legend-items">
            <div>
              <span className="legend-color" style={{ background: '#4CAF50' }} /> Online
            </div>
            <div>
              <span className="legend-color" style={{ background: '#f44336' }} /> Offline
            </div>
            <div>
              <span className="legend-color legend-diamond" style={{ background: '#FF9800' }} /> Router
            </div>
            <div>
              <span className="legend-color legend-square" style={{ background: '#2196F3' }} /> Server
            </div>
            <div>
              <span className="legend-color" style={{ background: '#9C27B0' }} /> Workstation
            </div>
            <div>
              <span className="legend-color legend-triangle" style={{ background: '#607D8B' }} /> IoT/Other
            </div>
          </div>
        </div>
      )}

      <DeviceDetailPanel
        device={selectedDevice}
        override={selectedDevice ? overrides[selectedDevice.id] : undefined}
        onSave={handleSaveOverride}
        onResetOverride={handleResetOverride}
      />
    </div>
  );
}
