const TYPE_COLORS = {
  router: '#FF9800',
  server: '#2196F3',
  workstation: '#9C27B0',
  iot: '#607D8B',
};

export function getNodeColor(type, status) {
  if (status === 'offline') return '#f44336';
  return TYPE_COLORS[type] ?? '#4CAF50';
}
