function listOrNone(list) {
  return list?.length ? list.join(', ') : '(none)';
}

// Compares an override's fields against the base device it was applied to,
// returning only the fields that actually changed.
export function diffOverride(base, override) {
  const changes = [];

  if (override.name && override.name !== (base?.name ?? '')) {
    changes.push({ field: 'name', from: base?.name || '(none)', to: override.name });
  }
  if (override.ports) {
    const from = listOrNone(base?.ports);
    const to = listOrNone(override.ports);
    if (from !== to) changes.push({ field: 'ports', from, to });
  }
  if (override.remarks && override.remarks !== (base?.remarks ?? '')) {
    changes.push({ field: 'remarks', from: base?.remarks || '(none)', to: override.remarks });
  }
  if (override.tags) {
    const from = listOrNone(base?.tags);
    const to = listOrNone(override.tags);
    if (from !== to) changes.push({ field: 'tags', from, to });
  }

  return changes;
}
