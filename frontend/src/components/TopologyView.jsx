import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { getNodeColor } from '../data/nodeColors';
import { getNodeShape } from '../data/nodeShapes';

function toElements(nodes, edges) {
  const elements = [];

  // Nest devices under a compound "network group" node when the source data
  // defines more than one network, so segments are visually distinguishable.
  const networkIds = [...new Set(nodes.map((n) => n.networkId).filter(Boolean))];
  const useGroups = networkIds.length > 1;

  if (useGroups) {
    networkIds.forEach((networkId) => {
      const sample = nodes.find((n) => n.networkId === networkId);
      elements.push({
        data: { id: `network:${networkId}`, name: sample?.networkName ?? networkId, isNetworkGroup: true },
      });
    });
  }

  nodes.forEach((node) => {
    elements.push({
      data: {
        ...node,
        ...(useGroups && node.networkId ? { parent: `network:${node.networkId}` } : {}),
      },
    });
  });

  edges.forEach((edge) => {
    elements.push({
      data: {
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
      },
    });
  });

  return elements;
}

const style = [
  {
    selector: 'node',
    style: {
      label: 'data(name)',
      'font-size': '12px',
      'text-valign': 'center',
      'text-halign': 'center',
      color: '#fff',
      'text-outline-width': 2,
      'text-outline-color': '#333',
      'border-width': 3,
      'border-color': '#fff',
    },
  },
  {
    // Leaf device nodes: colored/shaped by type+status. Compound network
    // group nodes (below) are excluded so they can auto-size to their children.
    selector: 'node:childless',
    style: {
      'background-color': (el) => getNodeColor(el.data('type'), el.data('status')),
      shape: (el) => getNodeShape(el.data('type')),
      width: 'mapData(name.length, 1, 20, 40, 80)',
      height: 'mapData(name.length, 1, 20, 40, 80)',
    },
  },
  {
    selector: 'node:parent',
    style: {
      'background-color': '#eef1fa',
      'background-opacity': 0.6,
      'border-width': 2,
      'border-style': 'dashed',
      'border-color': '#667eea',
      shape: 'round-rectangle',
      padding: '24px',
      'text-valign': 'top',
      'text-halign': 'center',
      'font-size': '14px',
      'font-weight': 'bold',
      color: '#333',
      'text-outline-width': 0,
    },
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#ccc',
      'target-arrow-color': '#ccc',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      opacity: 0.8,
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#ffeb3b',
      'background-opacity': 0.8,
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#ffeb3b',
      'target-arrow-color': '#ffeb3b',
      width: 4,
    },
  },
];

const layout = {
  name: 'cose',
  idealEdgeLength: 100,
  nodeOverlap: 20,
  refresh: 20,
  fit: true,
  padding: 30,
  randomize: false,
  componentSpacing: 100,
  nodeRepulsion: 400000,
  edgeElasticity: 100,
  nestingFactor: 5,
  gravity: 80,
  numIter: 1000,
  initialTemp: 200,
  coolingFactor: 0.95,
  minTemp: 1.0,
};

export default function TopologyView({ nodes, edges, onNodeSelect, controlsRef }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    const cy = cytoscape({
      container: containerRef.current,
      style,
      wheelSensitivity: 0.2,
      minZoom: 0.5,
      maxZoom: 2.5,
    });
    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      const data = evt.target.data();
      if (data.isNetworkGroup) return;
      onNodeSelect?.(data);
    });

    if (controlsRef) {
      controlsRef.current = {
        zoomIn: () => cy.zoom(cy.zoom() * 1.2),
        zoomOut: () => cy.zoom(cy.zoom() * 0.8),
        fit: () => cy.fit(),
        layoutGrid: () => cy.layout({ name: 'grid', fit: true }).run(),
        layoutCircle: () => cy.layout({ name: 'circle', fit: true }).run(),
      };
    }

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // If the same set of devices is still present (e.g. an edit changed a
    // name/ports/remarks), update data in place instead of rebuilding the
    // graph, so the layout/zoom/pan isn't disrupted by every edit.
    const newIds = new Set(nodes.map((n) => n.id));
    const existingIds = new Set(
      cy
        .nodes()
        .filter((n) => !n.data('isNetworkGroup'))
        .map((n) => n.id())
    );
    const sameStructure = newIds.size === existingIds.size && [...newIds].every((id) => existingIds.has(id));

    if (sameStructure) {
      cy.batch(() => {
        nodes.forEach((n) => cy.getElementById(n.id).data(n));
      });
      return;
    }

    cy.elements().remove();
    cy.add(toElements(nodes, edges));
    cy.layout(layout).run();
  }, [nodes, edges]);

  return <div ref={containerRef} className="graph-container" />;
}
