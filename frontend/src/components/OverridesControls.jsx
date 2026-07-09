import { useRef } from 'react';

export default function OverridesControls({ overrides, onImport, onError, onOpenChangelog }) {
  const fileRef = useRef(null);
  const hasOverrides = Object.keys(overrides).length > 0;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(overrides, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overrides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        onImport(JSON.parse(e.target.result));
      } catch (err) {
        onError('Invalid overrides file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="overrides-section">
      <button className="overrides-btn" onClick={handleExport} disabled={!hasOverrides}>
        Export Overrides
      </button>
      <button className="overrides-btn" onClick={onOpenChangelog} disabled={!hasOverrides}>
        View Changelog
      </button>
      <label className="overrides-btn" htmlFor="overridesUpload">
        Import Overrides
      </label>
      <input
        ref={fileRef}
        id="overridesUpload"
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
    </div>
  );
}
