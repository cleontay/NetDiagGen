// Layers the backend's live reachability results onto devices, kept
// distinct from the `status` field the source JSON may already report.
export function mergeLiveStatus(nodes, liveStatus) {
  return nodes.map((node) => {
    const live = liveStatus[node.id];
    if (!live) return node;
    return {
      ...node,
      liveReachable: live.reachable,
      liveAlive: live.alive,
      liveCheckedAt: live.checkedAt,
      liveError: live.error,
      liveOpenPorts: live.openPorts,
    };
  });
}
