import { useEffect, useState } from 'react';

const KNOWN_FIELDS = new Set([
  'id',
  'name',
  'type',
  'status',
  'ip',
  'networkId',
  'networkName',
  'ports',
  'remarks',
  'parent',
  'isNetworkGroup',
  'liveReachable',
  'liveCheckedAt',
  'liveError',
]);

function parsePorts(input) {
  return [...new Set(
    input
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => Number.isInteger(p) && p > 0 && p <= 65535)
  )].sort((a, b) => a - b);
}

function formatExtraValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function Row({ label, children }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{children}</span>
    </div>
  );
}

export default function DeviceDetailPanel({ device, override, onSave, onResetOverride }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', ports: '', remarks: '' });

  useEffect(() => {
    setEditing(false);
    if (device) {
      setForm({
        name: device.name ?? '',
        ports: (device.ports ?? []).join(', '),
        remarks: device.remarks ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device?.id]);

  if (!device) {
    return (
      <div className="node-info">
        <h3>Device Details</h3>
        <div id="infoContent">Click on any node to see details</div>
      </div>
    );
  }

  const extraFields = Object.entries(device).filter(
    ([key, value]) => !KNOWN_FIELDS.has(key) && value !== undefined
  );

  const handleSave = () => {
    onSave(device.id, {
      name: form.name.trim(),
      ports: parsePorts(form.ports),
      remarks: form.remarks.trim(),
    });
    setEditing(false);
  };

  return (
    <div className="node-info">
      <h3>
        Device Details
        {override && <span className="edited-badge">Edited</span>}
      </h3>
      <div id="infoContent">
        {editing ? (
          <div className="edit-form">
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label>
              Open ports (comma-separated)
              <input
                type="text"
                placeholder="e.g. 22, 80, 443"
                value={form.ports}
                onChange={(e) => setForm((f) => ({ ...f, ports: e.target.value }))}
              />
            </label>
            <label>
              Remarks
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              />
            </label>
            <div className="edit-form-actions">
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="detail-title">{device.name}</div>

            <div className="detail-grid">
              <Row label="ID">{device.id}</Row>
              <Row label="Type">{device.type}</Row>
              {device.ip && <Row label="IP">{device.ip}</Row>}
              {device.networkName && <Row label="Network">{device.networkName}</Row>}
              <Row label="Status">
                <span className={`status-badge status-${device.status ?? 'unknown'}`}>
                  {device.status ?? 'unknown'}
                </span>
              </Row>
              {device.liveReachable !== undefined && (
                <Row label="Live status">
                  <span className={`status-badge status-${device.liveReachable ? 'online' : 'offline'}`}>
                    {device.liveReachable ? 'Reachable' : 'Unreachable'}
                  </span>
                  {device.liveCheckedAt && (
                    <span className="detail-hint"> checked {new Date(device.liveCheckedAt).toLocaleTimeString()}</span>
                  )}
                </Row>
              )}
              {device.liveError && <Row label="Live check error">{device.liveError}</Row>}
              {device.ports?.length > 0 && <Row label="Open ports">{device.ports.join(', ')}</Row>}
              {device.remarks && <Row label="Remarks">{device.remarks}</Row>}
              {override?.updatedAt && (
                <Row label="Last edited">{new Date(override.updatedAt).toLocaleString()}</Row>
              )}
            </div>

            {extraFields.length > 0 && (
              <>
                <hr />
                <div className="detail-grid">
                  {extraFields.map(([key, value]) => (
                    <Row key={key} label={key}>
                      {formatExtraValue(value)}
                    </Row>
                  ))}
                </div>
              </>
            )}

            <div className="edit-form-actions">
              <button className="save-btn" onClick={() => setEditing(true)}>
                Edit
              </button>
              {override && <button onClick={() => onResetOverride(device.id)}>Reset to original</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
