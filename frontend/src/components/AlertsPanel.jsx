function describe(alert, name) {
  const label = name ?? alert.id;
  const time = new Date(alert.at).toLocaleTimeString();
  return alert.to
    ? `${label} came back ONLINE at ${time}`
    : `${label} went OFFLINE at ${time}`;
}

export default function AlertsPanel({ alerts, getDeviceName, onDismiss, onClearAll }) {
  if (alerts.length === 0) return null;

  return (
    <div className="alerts-panel">
      <div className="alerts-panel-header">
        <span>Status alerts</span>
        <button onClick={onClearAll}>Clear all</button>
      </div>
      <ul className="alerts-list">
        {alerts.map((alert) => (
          <li key={alert.key} className={alert.to ? 'alert-online' : 'alert-offline'}>
            <span>{describe(alert, getDeviceName(alert.id))}</span>
            <button className="alert-dismiss" onClick={() => onDismiss(alert.key)} aria-label="Dismiss">
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
