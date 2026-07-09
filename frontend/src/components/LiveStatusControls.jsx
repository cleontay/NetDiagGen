export default function LiveStatusControls({
  checking,
  backendAvailable,
  attempted,
  onCheckNow,
  autoRefresh,
  onAutoRefreshChange,
}) {
  return (
    <div className="live-status-section">
      <button className="live-status-btn" onClick={onCheckNow} disabled={checking}>
        {checking ? 'Checking...' : 'Check Live Status'}
      </button>
      <label className="auto-refresh-toggle">
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshChange(e.target.checked)}
        />
        Auto-refresh (30s)
      </label>
      {attempted && !backendAvailable && (
        <span className="live-status-warning">Status-check backend unavailable — showing reported status only.</span>
      )}
    </div>
  );
}
