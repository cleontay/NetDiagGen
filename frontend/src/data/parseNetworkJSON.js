// Normalizes the several JSON shapes we accept into a flat
// { nodes: [...], edges: [...] } structure the rest of the app works with.
//
// Accepted top-level shapes:
//   { nodes, edges }
//   { devices, connections }
//   { hosts, links }
//   { networks: [ { id, name, nodes|devices|hosts, edges|connections|links } ] }

function normalizeNode(node) {
  return {
    ...node,
    id: node.id ?? node.name ?? node.host,
    name: node.name ?? node.label ?? node.id ?? node.host,
    type: node.type ?? node.device_type ?? 'other',
    status: node.status ?? (node.state === 'up' ? 'online' : node.state === 'down' ? 'offline' : undefined),
    ip: node.ip ?? node.address,
  };
}

function normalizeEdge(edge) {
  return {
    ...edge,
    source: edge.source ?? edge.from,
    target: edge.target ?? edge.to,
  };
}

function extractRawNodes(obj) {
  return obj.nodes ?? obj.devices ?? obj.hosts ?? null;
}

function extractRawEdges(obj) {
  return obj.edges ?? obj.connections ?? obj.links ?? [];
}

function parseSingleNetwork(obj, networkMeta) {
  const rawNodes = extractRawNodes(obj);
  if (!rawNodes) {
    throw new Error(
      'Unsupported JSON format. Expected one of: {nodes,edges}, {devices,connections}, {hosts,links}, or {networks:[...]}'
    );
  }
  const rawEdges = extractRawEdges(obj);

  const nodes = rawNodes.map((n) => ({ ...normalizeNode(n), ...networkMeta }));
  const edges = rawEdges.map(normalizeEdge);

  return { nodes, edges };
}

export function parseNetworkJSON(jsonData) {
  if (!jsonData || typeof jsonData !== 'object') {
    throw new Error('Invalid JSON: expected an object');
  }

  if (Array.isArray(jsonData.networks)) {
    const nodes = [];
    const edges = [];
    jsonData.networks.forEach((net) => {
      const networkMeta = { networkId: net.id, networkName: net.name ?? net.id };
      const parsed = parseSingleNetwork(net, networkMeta);
      nodes.push(...parsed.nodes);
      edges.push(...parsed.edges);
    });
    if (nodes.length === 0) {
      throw new Error('No devices found in any network');
    }
    return { nodes, edges };
  }

  const { nodes, edges } = parseSingleNetwork(jsonData, {});
  if (nodes.length === 0) {
    throw new Error('No devices found in the JSON file');
  }
  return { nodes, edges };
}
