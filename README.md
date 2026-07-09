# NetDiagGen

Network diagram visualizer from JSON.

## Structure

- `frontend/` — React + Vite app. Visualizes network topology and device
  status from uploaded or bundled JSON, with editable device metadata
  (name, ports, remarks) and a dashboard/topology toggle.
- `backend/` — minimal Express service with a single `/api/status-check`
  endpoint that performs live reachability checks, since browsers can't
  probe arbitrary hosts directly. Optional — the frontend works without it,
  just without live status.

## Development

```bash
cd frontend
npm install
npm run dev
```

To enable live status checks, also run the backend:

```bash
cd backend
npm install
npm start
```

The frontend looks for the backend at `http://localhost:4000` by default;
override with `VITE_STATUS_API_URL` if it runs elsewhere. Status checks are
restricted to private IP ranges (RFC1918, loopback, link-local) — the
backend refuses to probe public addresses.

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
