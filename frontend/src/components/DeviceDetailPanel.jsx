import { useEffect, useState } from 'react';
import StatusHistoryStrip from './StatusHistoryStrip';
import { getNodeIcon } from '../data/nodeIcons';

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
  'tags',
  'icon',
  'parent',
  'isNetworkGroup',
  'liveReachable',
  'liveAlive',
  'liveCheckedAt',
  'liveError',
  'liveOpenPorts',
]);

const MAX_ICON_BYTES = 200 * 1024;

function parsePorts(input) {
  return [...new Set(
    input
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => Number.isInteger(p) && p > 0 && p <= 65535)
  )].sort((a, b) => a - b);
}

function parseTags(input) {
  return [...new Set(
    input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  )];
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

export default function DeviceDetailPanel({ device, override, history, onSave, onResetOverride }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', ports: '', remarks: '', tags: '', icon: '' });
  const [iconError, setIconError] = useState(null);

  useEffect(() => {
    setEditing(false);
    setIconError(null);
    if (device) {
      setForm({
        name: device.name ?? '',
        ports: (device.ports ?? []).join(', '),
        remarks: device.remarks ?? '',
        tags: (device.tags ?? []).join(', '),
        icon: device.icon ?? '',
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
      tags: parseTags(form.tags),
      icon: form.icon,
    });
    setEditing(false);
  };

  const handleIconFile = (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setIconError(null);

    if (!file.type.startsWith('image/')) {
      setIconError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_ICON_BYTES) {
      setIconError(`Image too large (max ${Math.round(MAX_ICON_BYTES / 1024)}KB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setForm((f) => ({ ...f, icon: e.target.result }));
    reader.onerror = () => setIconError('Could not read that file.');
    reader.readAsDataURL(file);
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
            <div className="icon-upload-row">
              <img
                className="icon-preview"
                src={form.icon || getNodeIcon(device)}
                alt=""
                width={48}
                height={48}
              />
              <div className="icon-upload-controls">
                <label className="overrides-btn" htmlFor="iconUpload">
                  Upload Icon
                </label>
                <input
                  id="iconUpload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleIconFile}
                />
                {form.icon && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, icon: '' }))}>
                    Remove
                  </button>
                )}
                {iconError && <div className="icon-error">{iconError}</div>}
              </div>
            </div>
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label>
              Open ports (declared, comma-separated)
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
            <label>
              Tags (comma-separated)
              <input
                type="text"
                placeholder="e.g. critical, guest-network"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
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
            <div className="detail-title">
              <img className="icon-preview" src={getNodeIcon(device)} alt="" width={32} height={32} />
              {device.name}
            </div>

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
              {device.liveAlive !== undefined && (
                <Row label="ICMP ping">
                  {device.liveAlive === null ? (
                    <span className="status-badge status-unknown">Not available</span>
                  ) : (
                    <span className={`status-badge status-${device.liveAlive ? 'online' : 'offline'}`}>
                      {device.liveAlive ? 'Alive' : 'No reply'}
                    </span>
                  )}
                </Row>
              )}
              {device.liveError && <Row label="Live check error">{device.liveError}</Row>}
              {device.liveOpenPorts?.length > 0 && (
                <Row label="Open ports (live scan)">{device.liveOpenPorts.join(', ')}</Row>
              )}
              {device.ports?.length > 0 && <Row label="Open ports (declared)">{device.ports.join(', ')}</Row>}
              {device.remarks && <Row label="Remarks">{device.remarks}</Row>}
              {device.tags?.length > 0 && (
                <Row label="Tags">
                  {device.tags.map((tag) => (
                    <span className="tag-chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </Row>
              )}
              {override?.updatedAt && (
                <Row label="Last edited">{new Date(override.updatedAt).toLocaleString()}</Row>
              )}
              {history?.length > 0 && (
                <Row label="Recent checks">
                  <StatusHistoryStrip entries={history} />
                </Row>
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
