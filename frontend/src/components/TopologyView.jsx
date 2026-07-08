import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { getNodeColor } from '../data/nodeColors';

function toElements(nodes, edges) {
  const elements = nodes.map((node) => ({
    data: { ...node },
  }));

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
      'background-color': (el) => getNodeColor(el.data('type'), el.data('status')),
      label: 'data(name)',
      width: 'mapData(name.length, 1, 20, 40, 80)',
      height: 'mapData(name.length, 1, 20, 40, 80)',
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
      onNodeSelect?.(evt.target.data());
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
    cy.elements().remove();
    cy.add(toElements(nodes, edges));
    cy.layout(layout).run();
  }, [nodes, edges]);

  return <div ref={containerRef} className="graph-container" />;
}
