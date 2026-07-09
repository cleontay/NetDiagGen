import { useMemo, useState } from 'react';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'ip', label: 'IP' },
];

export default function DashboardView({ nodes, selectedId, onSelectDevice }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const hasNetworks = nodes.some((n) => n.networkName);
  const hasLiveStatus = nodes.some((n) => n.liveReachable !== undefined);
  const columnCount = COLUMNS.length + (hasNetworks ? 1 : 0) + (hasLiveStatus ? 1 : 0);
  const types = useMemo(() => [...new Set(nodes.map((n) => n.type).filter(Boolean))].sort(), [nodes]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let filtered = nodes.filter((n) => {
      if (statusFilter !== 'all' && (n.status ?? 'unknown') !== statusFilter) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (!term) return true;
      return [n.name, n.ip, n.id, n.networkName].some((v) => v && String(v).toLowerCase().includes(term));
    });

    filtered = [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [nodes, search, statusFilter, typeFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search name, IP, network..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="dashboard-search"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="unknown">Unknown</option>
        </select>
        {types.length > 0 && (
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        <span className="dashboard-count">
          {rows.length} of {nodes.length} devices
        </span>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} onClick={() => toggleSort(col.key)}>
                  {col.label}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
              {hasNetworks && <th>Network</th>}
              {hasLiveStatus && <th>Live</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr
                key={n.id}
                className={n.id === selectedId ? 'selected' : ''}
                onClick={() => onSelectDevice(n)}
              >
                <td>{n.name}</td>
                <td>{n.type}</td>
                <td>
                  <span className={`status-badge status-${n.status ?? 'unknown'}`}>{n.status ?? 'unknown'}</span>
                </td>
                <td>{n.ip ?? '—'}</td>
                {hasNetworks && <td>{n.networkName ?? '—'}</td>}
                {hasLiveStatus && (
                  <td>
                    {n.liveReachable === undefined ? (
                      '—'
                    ) : (
                      <span className={`status-badge status-${n.liveReachable ? 'online' : 'offline'}`}>
                        {n.liveReachable ? 'Reachable' : 'Unreachable'}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="dashboard-empty">
                  No devices match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
