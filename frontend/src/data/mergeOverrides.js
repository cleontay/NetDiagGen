// Layers user edits (device name, open ports, remarks, tags) on top of the
// base device data from the loaded JSON. Overrides are kept separately so
// they can be exported/imported independently of whatever source is loaded.
export function mergeNodesWithOverrides(nodes, overrides) {
  return nodes.map((node) => {
    const override = overrides[node.id];
    if (!override) return node;
    return {
      ...node,
      ...(override.name ? { name: override.name } : {}),
      ...(override.ports ? { ports: override.ports } : {}),
      ...(override.remarks ? { remarks: override.remarks } : {}),
      ...(override.tags?.length ? { tags: override.tags } : {}),
    };
  });
}
