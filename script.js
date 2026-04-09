let cy = null;

// Sample network data
const sampleData = {

nodes: [

// Notice everything is wrapped in a "data" object

{ data: { id: "router1", label: "Main Router", type: "router", status: { data: { id: "server1", label: "Web Server", type: "server", status:

{ data: { id: "server2", label: "Database", type: "server", status: "or

{ data: { id:

{ data:

{ data:

{ data: { id: "iot2", label: "Smart Thermostat", type: "iot", status:

edges: [

{ data: { source: "router1", target: "server1" } },

{

data: { source: "router1", target: "server2" } },

{ data: { source: "router1", target: "workstation1" } },

{ data: { source: "router1", target: "workstation2" }

{ data: { source: "router1", target:

{ data: { source: "router1", target: "iot2" }

{ data: { source: "server1", target: "server2" }

}

};

// Node color mapping
const getNodeColor = (type, status) => {
    if (status === "offline") return "#f44336";
    
    switch(type) {
        case "router": return "#FF9800";
        case "server": return "#2196F3";
        case "workstation": return "#9C27B0";
        case "iot": return "#607D8B";
        default: return "#4CAF50";
    }
};

// Initialize graph
function initGraph(nodes, edges) {
    if (cy) {
        cy.destroy();
    }
    
    const elements = [];
    
    // Add nodes
    nodes.forEach(node => {
        elements.push({
            data: {
                id: node.id,
                label: node.label,
                type: node.type,
                status: node.status,
                ip: node.ip,
                ...node
            },
            style: {
                'background-color': getNodeColor(node.type, node.status),
                'label': node.label,
                'width': 'mapData(label.length, 1, 20, 30, 60)',
                'height': 'mapData(label.length, 1, 20, 30, 60)',
                'font-size': '12px',
                'text-valign': 'bottom',
                'text-halign': 'center',
                'color': '#333',
                'border-width': node.status === "online" ? '3px' : '2px',
                'border-color': node.status === "online" ? '#4CAF50' : '#f44336'
            }
        });
    });
    
    // Add edges
    edges.forEach(edge => {
        elements.push({
            data: {
                id: `${edge.source}-${edge.target}`,
                source: edge.source,
                target: edge.target
            },
            style: {
                'width': 2,
                'line-color': '#999',
                'target-arrow-color': '#999',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        });
    });
    
    cy = cytoscape({
        container: document.getElementById('cy'),
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': 'data(color)',
                    'label': 'data(label)',
                    'width': 'mapData(label.length, 1, 20, 40, 80)',
                    'height': 'mapData(label.length, 1, 20, 40, 80)',
                    'font-size': '12px',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'color': '#fff',
                    'text-outline-width': 2,
                    'text-outline-color': '#333',
                    'border-width': 3,
                    'border-color': '#fff'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'opacity': 0.8
                }
            },
            {
                selector: 'node:selected',
                style: {
                    'border-width': 4,
                    'border-color': '#ffeb3b',
                    'background-opacity': 0.8
                }
            },
            {
                selector: 'edge:selected',
                style: {
                    'line-color': '#ffeb3b',
                    'target-arrow-color': '#ffeb3b',
                    'width': 4
                }
            }
        ],
        layout: {
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
            minTemp: 1.0
        },
        wheelSensitivity: 0.2,
        minZoom: 0.5,
        maxZoom: 2.5
    });
    
    // Node click handler
    cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        const data = node.data();
        
        let infoHtml = `
            <strong>${data.label}</strong><br>
            📍 ID: ${data.id}<br>
            🏷️ Type: ${data.type}<br>
            ${data.ip ? `🌐 IP: ${data.ip}<br>` : ''}
            ${data.model ? `📟 Model: ${data.model}<br>` : ''}
            ${data.os ? `💻 OS: ${data.os}<br>` : ''}
            ${data.user ? `👤 User: ${data.user}<br>` : ''}
            ✅ Status: ${data.status === 'online' ? '🟢 Online' : '🔴 Offline'}<br>
        `;
        
        document.getElementById('infoContent').innerHTML = infoHtml;
    });
    
    // Update stats
    updateStats(nodes, edges);
}

// Update statistics
function updateStats(nodes, edges) {
    const onlineCount = nodes.filter(n => n.status === "online").length;
    const offlineCount = nodes.filter(n => n.status === "offline").length;
    
    document.getElementById('nodeCount').textContent = nodes.length;
    document.getElementById('edgeCount').textContent = edges.length;
    document.getElementById('onlineCount').textContent = onlineCount;
    document.getElementById('offlineCount').textContent = offlineCount;
}

// Parse uploaded JSON
function parseNetworkJSON(jsonData) {
    // Support multiple JSON formats
    let nodes = [];
    let edges = [];
    
    if (jsonData.nodes && jsonData.edges) {
        // Standard format
        nodes = jsonData.nodes;
        edges = jsonData.edges;
    } else if (jsonData.devices && jsonData.connections) {
        // Alternative format
        nodes = jsonData.devices;
        edges = jsonData.connections;
    } else if (jsonData.hosts && jsonData.links) {
        // Nmap-like format
        nodes = jsonData.hosts;
        edges = jsonData.links;
    } else {
        throw new Error('Unsupported JSON format. Expected {nodes: [], edges: []}');
    }
    
    // Validate and normalize nodes
    nodes = nodes.map(node => ({
        id: node.id || node.name || node.host,
        label: node.label || node.name || node.id,
        type: node.type || node.device_type || "other",
        status: node.status || (node.state === "up" ? "online" : "offline"),
        ip: node.ip || node.address,
        ...node
    }));
    
    // Validate and normalize edges
    edges = edges.map(edge => ({
        source: edge.source || edge.from,
        target: edge.target || edge.to
    }));
    
    return { nodes, edges };
}

// Load graph from data
function loadGraph(data) {
    try {
        const { nodes, edges } = parseNetworkJSON(data);
        
        if (nodes.length === 0) {
            alert('No nodes found in the JSON file');
            return;
        }
        
        initGraph(nodes, edges);
    } catch (error) {
        alert('Error parsing JSON: ' + error.message);
        console.error(error);
    }
}

// File upload handler
document.getElementById('fileUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                loadGraph(jsonData);
            } catch (error) {
                alert('Invalid JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
});

// Sample data button
document.getElementById('sampleBtn').addEventListener('click', () => {
    loadGraph(sampleData);
});

// Reset button
document.getElementById('resetBtn').addEventListener('click', () => {
    if (cy) {
        cy.destroy();
        cy = null;
        document.getElementById('nodeCount').textContent = '0';
        document.getElementById('edgeCount').textContent = '0';
        document.getElementById('onlineCount').textContent = '0';
        document.getElementById('offlineCount').textContent = '0';
        document.getElementById('infoContent').innerHTML = 'Click on any node to see details';
    }
});

// View controls
document.getElementById('zoomInBtn').addEventListener('click', () => {
    if (cy) cy.zoom(cy.zoom() * 1.2);
});

document.getElementById('zoomOutBtn').addEventListener('click', () => {
    if (cy) cy.zoom(cy.zoom() * 0.8);
});

document.getElementById('fitBtn').addEventListener('click', () => {
    if (cy) cy.fit();
});

document.getElementById('layoutGridBtn').addEventListener('click', () => {
    if (cy) {
        cy.layout({ name: 'grid', rows: 3, cols: 3, fit: true }).run();
    }
});

document.getElementById('layoutCircleBtn').addEventListener('click', () => {
    if (cy) {
        cy.layout({ name: 'circle', fit: true }).run();
    }
});

// Upload button trigger
document.querySelector('.upload-btn').addEventListener('click', () => {
    document.getElementById('fileUpload').click();
});

// Initialize with sample data on page load
window.addEventListener('load', () => {
    loadGraph(sampleData);
});
