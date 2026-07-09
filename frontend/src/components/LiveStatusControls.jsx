export default function LiveStatusControls({ checking, backendAvailable, attempted, onCheckNow }) {
  return (
    <div className="live-status-section">
      <button className="live-status-btn" onClick={onCheckNow} disabled={checking}>
        {checking ? 'Checking...' : 'Check Live Status'}
      </button>
      {attempted && !backendAvailable && (
        <span className="live-status-warning">Status-check backend unavailable — showing reported status only.</span>
      )}
    </div>
  );
}
