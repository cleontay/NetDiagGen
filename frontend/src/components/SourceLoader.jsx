import { useRef, useState } from 'react';
import { useSourceManifest } from '../hooks/useSourceManifest';
import { useLocalFolder } from '../hooks/useLocalFolder';
import { sampleData } from '../data/sampleData';

export default function SourceLoader({ onLoad, onError }) {
  const manifestSources = useSourceManifest();
  const localFolder = useLocalFolder();
  const fileInputRef = useRef(null);
  const [localFileChoice, setLocalFileChoice] = useState('');

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        onLoad(JSON.parse(e.target.result), { label: file.name });
      } catch (err) {
        onError('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleManifestPick = async (event) => {
    const file = event.target.value;
    if (!file) return;
    const source = manifestSources.find((s) => s.file === file);
    try {
      const res = await fetch(`/sources/${file}`);
      if (!res.ok) throw new Error(`Could not fetch ${file} (${res.status})`);
      onLoad(await res.json(), { label: source?.label ?? file });
    } catch (err) {
      onError('Error loading source: ' + err.message);
    }
    event.target.value = '';
  };

  const handleLocalPick = async (event) => {
    const name = event.target.value;
    setLocalFileChoice(name);
    if (!name) return;
    const entry = localFolder.files.find((f) => f.name === name);
    if (!entry) return;
    try {
      onLoad(await localFolder.readFile(entry), { label: entry.name });
    } catch (err) {
      onError('Error reading local file: ' + err.message);
    }
  };

  return (
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
        onChange={handleUpload}
      />

      <button className="sample-btn" onClick={() => onLoad(sampleData, { label: 'Sample Data' })}>
        Load Sample Data
      </button>

      {manifestSources.length > 0 && (
        <select className="source-select" defaultValue="" onChange={handleManifestPick} aria-label="Bundled sources">
          <option value="" disabled>
            Sources folder...
          </option>
          {manifestSources.map((s) => (
            <option key={s.file} value={s.file}>
              {s.label ?? s.file}
            </option>
          ))}
        </select>
      )}

      {localFolder.isSupported && (
        <>
          <button className="folder-btn" onClick={localFolder.pickFolder}>
            Choose Local Folder
          </button>
          {localFolder.files.length > 0 && (
            <select
              className="source-select"
              value={localFileChoice}
              onChange={handleLocalPick}
              aria-label={`Files in ${localFolder.folderName}`}
            >
              <option value="" disabled>
                {localFolder.folderName}/...
              </option>
              {localFolder.files.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </div>
  );
}
