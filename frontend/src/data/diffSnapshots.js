// Compares two loaded snapshots of the same network (e.g. two scans taken
// at different times) by device id: devices present only in the second
// snapshot, devices missing from it, and devices whose status/ip changed.
export function diffSnapshots(baseNodes, otherNodes) {
  const baseById = new Map(baseNodes.map((n) => [n.id, n]));
  const otherById = new Map(otherNodes.map((n) => [n.id, n]));

  const added = otherNodes.filter((n) => !baseById.has(n.id));
  const removed = baseNodes.filter((n) => !otherById.has(n.id));

  const changed = [];
  baseNodes.forEach((base) => {
    const other = otherById.get(base.id);
    if (!other) return;

    const changes = [];
    if ((base.status ?? null) !== (other.status ?? null)) {
      changes.push({ field: 'status', from: base.status ?? '(none)', to: other.status ?? '(none)' });
    }
    if ((base.ip ?? null) !== (other.ip ?? null)) {
      changes.push({ field: 'ip', from: base.ip ?? '(none)', to: other.ip ?? '(none)' });
    }
    if (changes.length > 0) {
      changed.push({ id: base.id, name: base.name, changes });
    }
  });

  return { added, removed, changed };
}
