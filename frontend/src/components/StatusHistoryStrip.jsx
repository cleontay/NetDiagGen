export default function StatusHistoryStrip({ entries }) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="history-strip">
      {entries.map((entry, i) => (
        <span
          key={`${entry.checkedAt}-${i}`}
          className={`history-dot ${entry.reachable ? 'history-dot-online' : 'history-dot-offline'}`}
          title={`${entry.reachable ? 'Reachable' : 'Unreachable'} at ${new Date(entry.checkedAt).toLocaleTimeString()}`}
        />
      ))}
    </div>
  );
}
