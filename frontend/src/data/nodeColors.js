const STATUS_COLORS = {
  online: { bg: '#e6f7e9', border: '#28a745' },
  offline: { bg: '#fdecea', border: '#dc3545' },
};

// Node background/border now encode status (matching the status-badge
// palette used elsewhere); device type is conveyed by the icon instead.
export function getStatusColors(status) {
  return STATUS_COLORS[status] ?? { bg: '#eee', border: '#999' };
}
