import { useCallback, useRef, useState } from 'react';
import TopologyView from './components/TopologyView';
import DeviceDetailPanel from './components/DeviceDetailPanel';
import StatsBar from './components/StatsBar';
import { parseNetworkJSON } from './data/parseNetworkJSON';
import { sampleData } from './data/sampleData';
import './App.css';

export default function App() {
  const [graph, setGraph] = useState(() => parseNetworkJSON(sampleData));
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const controlsRef = useRef(null);

  const loadJSON = useCallback((jsonData) => {
    try {
      const parsed = parseNetworkJSON(jsonData);
      setGraph(parsed);
      setSelectedDevice(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const handleFileUpload = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          loadJSON(jsonData);
        } catch (err) {
          setError('Invalid JSON file: ' + err.message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    [loadJSON]
  );

  const handleReset = useCallback(() => {
    setGraph({ nodes: [], edges: [] });
    setSelectedDevice(null);
    setError(null);
  }, []);

  return (
    <div className="container">
      <header>
        <h1>Network Topology Visualizer</h1>
        <p>Upload JSON to visualize your network infrastructure</p>
      </header>

      <div className="controls">
        <div className="upload-section">
          <label className="upload-btn" htmlFor="fileUpload">
            Upload JSON File
          </label>
          <input
            ref={fileInputRef}
            id="fileUpload"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="sample-btn" onClick={() => loadJSON(sampleData)}>
            Load Sample Data
          </button>
          <button className="reset-btn" onClick={handleReset}>
            Clear Graph
          </button>
        </div>

        <div className="view-controls">
          <button onClick={() => controlsRef.current?.zoomIn()}>Zoom In</button>
          <button onClick={() => controlsRef.current?.zoomOut()}>Zoom Out</button>
          <button onClick={() => controlsRef.current?.fit()}>Fit to Screen</button>
          <button onClick={() => controlsRef.current?.layoutGrid()}>Grid Layout</button>
          <button onClick={() => controlsRef.current?.layoutCircle()}>Circle Layout</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <StatsBar nodes={graph.nodes} edges={graph.edges} />

      <TopologyView
        nodes={graph.nodes}
        edges={graph.edges}
        onNodeSelect={setSelectedDevice}
        controlsRef={controlsRef}
      />

      <div className="legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div>
            <span className="legend-color" style={{ background: '#4CAF50' }} /> Online
          </div>
          <div>
            <span className="legend-color" style={{ background: '#f44336' }} /> Offline
          </div>
          <div>
            <span className="legend-color" style={{ background: '#FF9800' }} /> Router
          </div>
          <div>
            <span className="legend-color" style={{ background: '#2196F3' }} /> Server
          </div>
          <div>
            <span className="legend-color" style={{ background: '#9C27B0' }} /> Workstation
          </div>
          <div>
            <span className="legend-color" style={{ background: '#607D8B' }} /> IoT/Other
          </div>
        </div>
      </div>

      <DeviceDetailPanel device={selectedDevice} />
    </div>
  );
}
