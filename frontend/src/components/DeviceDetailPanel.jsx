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

export default function DeviceDetailPanel({ device, hasOverride, onSave, onResetOverride }) {
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
        {hasOverride && <span className="edited-badge">Edited</span>}
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
            <strong>{device.name}</strong>
            <br />
            ID: {device.id}
            <br />
            Type: {device.type}
            <br />
            {device.ip && (
              <>
                IP: {device.ip}
                <br />
              </>
            )}
            {device.networkName && (
              <>
                Network: {device.networkName}
                <br />
              </>
            )}
            Status: {device.status === 'online' ? 'Online' : device.status === 'offline' ? 'Offline' : 'Unknown'}
            <br />
            {device.liveReachable !== undefined && (
              <>
                Live status: {device.liveReachable ? 'Reachable' : 'Unreachable'}
                {device.liveCheckedAt && ` (checked ${new Date(device.liveCheckedAt).toLocaleTimeString()})`}
                <br />
              </>
            )}
            {device.liveError && (
              <>
                Live check error: {device.liveError}
                <br />
              </>
            )}
            {device.ports?.length > 0 && (
              <>
                Open ports: {device.ports.join(', ')}
                <br />
              </>
            )}
            {device.remarks && (
              <>
                Remarks: {device.remarks}
                <br />
              </>
            )}
            {extraFields.length > 0 && (
              <>
                <hr />
                {extraFields.map(([key, value]) => (
                  <div key={key}>
                    {key}: {String(value)}
                  </div>
                ))}
              </>
            )}
            <div className="edit-form-actions">
              <button className="save-btn" onClick={() => setEditing(true)}>
                Edit
              </button>
              {hasOverride && <button onClick={() => onResetOverride(device.id)}>Reset to original</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
