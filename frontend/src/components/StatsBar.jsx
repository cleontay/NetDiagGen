export default function StatsBar({ nodes, edges }) {
  const onlineCount = nodes.filter((n) => n.status === 'online').length;
  const offlineCount = nodes.filter((n) => n.status === 'offline').length;

  return (
    <div className="stats-bar">
      <span>
        Nodes: <strong>{nodes.length}</strong>
      </span>
      <span>
        Edges: <strong>{edges.length}</strong>
      </span>
      <span>
        Online: <strong>{onlineCount}</strong>
      </span>
      <span>
        Offline: <strong>{offlineCount}</strong>
      </span>
    </div>
  );
}
