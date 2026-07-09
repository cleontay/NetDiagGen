import { useState } from 'react';
import { parseNetworkJSON } from '../data/parseNetworkJSON';
import { diffSnapshots } from '../data/diffSnapshots';

export default function CompareSnapshot({ currentNodes, onError }) {
  const [result, setResult] = useState(null);
  const [otherLabel, setOtherLabel] = useState('');

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const { nodes } = parseNetworkJSON(jsonData);
        setResult(diffSnapshots(currentNodes, nodes));
        setOtherLabel(file.name);
      } catch (err) {
        onError('Error comparing snapshot: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="compare-section">
      <label className="overrides-btn" htmlFor="compareUpload">
        Compare Snapshot
      </label>
      <input id="compareUpload" type="file" accept=".json" style={{ display: 'none' }} onChange={handleFile} />

      {result && (
        <div className="modal-overlay" onClick={() => setResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Compare with {otherLabel}</h3>
              <button onClick={() => setResult(null)}>Close</button>
            </div>
            <div className="modal-body">
              <h4>Added ({result.added.length})</h4>
              {result.added.length === 0 ? (
                <p className="detail-hint">None</p>
              ) : (
                <ul className="changelog-diff-list">
                  {result.added.map((n) => (
                    <li key={n.id}>
                      <span className="tag-chip tag-chip-added">new</span> {n.name} ({n.id})
                    </li>
                  ))}
                </ul>
              )}

              <h4>Removed ({result.removed.length})</h4>
              {result.removed.length === 0 ? (
                <p className="detail-hint">None</p>
              ) : (
                <ul className="changelog-diff-list">
                  {result.removed.map((n) => (
                    <li key={n.id}>
                      <span className="tag-chip tag-chip-removed">removed</span> {n.name} ({n.id})
                    </li>
                  ))}
                </ul>
              )}

              <h4>Changed ({result.changed.length})</h4>
              {result.changed.length === 0 ? (
                <p className="detail-hint">None</p>
              ) : (
                result.changed.map((entry) => (
                  <div key={entry.id} className="changelog-entry">
                    <div className="changelog-entry-header">
                      <strong>{entry.name}</strong> <span className="detail-hint">{entry.id}</span>
                    </div>
                    <ul className="changelog-diff-list">
                      {entry.changes.map((c) => (
                        <li key={c.field}>
                          <strong>{c.field}:</strong> {c.from} → {c.to}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
