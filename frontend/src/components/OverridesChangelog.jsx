import { diffOverride } from '../data/diffOverride';

export default function OverridesChangelog({ open, overrides, baseNodes, onClose }) {
  if (!open) return null;

  const entries = Object.entries(overrides)
    .map(([id, override]) => {
      const base = baseNodes.find((n) => n.id === id);
      return {
        id,
        name: override.name || base?.name || id,
        updatedAt: override.updatedAt,
        changes: diffOverride(base, override),
      };
    })
    .filter((e) => e.changes.length > 0)
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Overrides Changelog</h3>
          <button onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          {entries.length === 0 ? (
            <p>No edits yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="changelog-entry">
                <div className="changelog-entry-header">
                  <strong>{entry.name}</strong>
                  <span className="detail-hint"> {entry.id}</span>
                  {entry.updatedAt && (
                    <span className="detail-hint"> — {new Date(entry.updatedAt).toLocaleString()}</span>
                  )}
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
  );
}
