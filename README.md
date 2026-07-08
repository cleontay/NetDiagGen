# NetDiagGen

Network diagram visualizer from JSON.

## Structure

- `frontend/` — React + Vite app. Visualizes network topology and device
  status from uploaded or bundled JSON, with editable device metadata
  (name, ports, remarks) and a dashboard/topology toggle.
- `backend/` — (added in a later phase) minimal service for live
  device status checks, since browsers can't probe arbitrary hosts directly.

## Development

```bash
cd frontend
npm install
npm run dev
```

## JSON format

The app accepts several shapes:

```json
{ "nodes": [...], "edges": [...] }
{ "devices": [...], "connections": [...] }
{ "hosts": [...], "links": [...] }
{ "networks": [ { "id": "...", "name": "...", "nodes": [...], "edges": [...] } ] }
```

Each node supports arbitrary extra fields beyond `id`/`name`/`type`/`status`/`ip`
— anything else present is shown in the device detail panel.
