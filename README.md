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

Liveness combines two signals: a real ICMP ping (shells out to the system
`ping` command) and a TCP port scan. If `ping` isn't installed on the
backend's host (common on minimal/containerized environments), the ICMP
result reports as "not available" rather than "down", and reachability
falls back to the TCP scan alone — install `iputils-ping` (Debian/Ubuntu)
or equivalent if you want the ICMP signal.

## Deployment

**Frontend** builds to static files and can be hosted anywhere
(`frontend/dist` after `npm run build`). A GitHub Actions workflow
(`.github/workflows/deploy-frontend.yml`) is included to publish it to
GitHub Pages on every push to `main` that touches `frontend/`. It only
takes effect once Pages is enabled for this repo (Settings → Pages →
Source: "GitHub Actions") — nothing is published automatically until
that's turned on. If you deploy the backend somewhere and want the
GitHub Pages build to use it, set a repository variable
`STATUS_API_URL` (Settings → Secrets and variables → Actions → Variables)
to its URL before the workflow runs.

For Netlify/Vercel instead: point them at `frontend/`, build command
`npm run build`, publish directory `dist`. They serve from the root, so
no base-path configuration is needed (that's GitHub Pages-specific).

**Backend** (only needed for live status checks) is a plain Node/Express
process — deploy it anywhere that runs Node (Render, Fly.io, a small VPS,
etc.) and point the frontend at it via `VITE_STATUS_API_URL` at build
time. If it's not deployed or not reachable, the frontend degrades
gracefully to showing only the status reported in the loaded JSON.

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

## Icons

Devices are shown with a default pictogram per type (router/server/
workstation/iot/other). Any device can be given a custom icon from its edit
form — upload an image (max 200KB) and it's stored as a data URI in that
device's override, so it travels with `overrides.json` like any other edit.
Remove it to fall back to the default type icon.
