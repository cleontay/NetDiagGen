# NetDiagGen

A network diagram generator: load a JSON description of your network and get
an interactive topology map and a sortable dashboard, with editable device
metadata, live reachability checks, and exportable diagrams — all from a
JSON file, no database required.

## Table of contents

- [Summary](#summary)
- [Features](#features)
- [Core structure](#core-structure)
- [Installation](#installation)
- [Docker](#docker)
- [Usage guide](#usage-guide)
- [JSON format](#json-format)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Summary

NetDiagGen is a two-part app:

- **`frontend/`** — a React + Vite single-page app. This is the whole
  product for most use cases: load a JSON file describing your devices and
  the connections between them, and it renders an interactive topology
  diagram and a dashboard, lets you annotate devices, and exports what you
  build. Works entirely client-side — no backend or database needed for
  this part.
- **`backend/`** — a small, optional Express service with one job: check
  whether devices are actually online right now (ICMP ping + TCP port
  scan), since a browser can't do that on its own. If you don't run it,
  everything else still works — you just won't have live status.

There is intentionally no database and no login system. Your edits (device
renames, remarks, tags, custom icons) live in the browser's memory for the
session and can be saved out as a small `overrides.json` file, which you
re-import later to restore them. This keeps the tool a "drop in a JSON file
and go" experience rather than something that needs an account or server
setup.

## Features

**Loading data**
- Upload a JSON file directly
- Pick from a folder of JSON files bundled with the app (`frontend/public/sources/`)
- Point at a local folder on your machine (Chromium browsers only)
- Load the built-in sample network to try the app immediately

**Visualizing the network**
- Interactive topology diagram (pan/zoom/drag) built on Cytoscape.js
- Dashboard view: a searchable, sortable, filterable table of every device
- Toggle between the two views without losing your selection
- Devices are grouped into dashed boxes automatically when the source JSON
  defines more than one network/segment
- Each device shows an icon for its type (router/server/workstation/IoT/
  other) with a colored border/background for status (green = online,
  red = offline, gray = unknown)

**Editing devices**
- Rename a device, add open ports, write freeform remarks, and tag it —
  all from a detail panel that opens when you click a device
- Upload a custom icon per device (overrides the default type icon)
- Bulk-edit: select multiple rows in the dashboard and tag/annotate them
  all at once
- Every edit is tracked with a timestamp; a changelog view lists exactly
  what changed and when
- "Reset to original" undoes an edit back to what the source JSON said

**Live status checking** (requires the optional backend)
- On-demand or auto-refreshing (every 30s) reachability checks
- Combines a real ICMP ping with a TCP port scan for a robust "is it
  actually up" signal, distinct from whatever status the JSON reported
- Reports which specific ports are open, not just "reachable"
- Pop-up alerts when a device flips online↔offline
- A small per-device history strip showing the last 15 checks

**Sharing and comparing**
- Export the topology as a PNG image
- Print / Save as PDF via the browser's native print dialog
- Export/import your edits as `overrides.json` to carry them between sessions
- Compare two JSON snapshots to see what devices were added, removed, or
  changed since the last one

## Core structure

```
NetDiagGen/
├── frontend/                    React + Vite app (the main product)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── sources/              Bundled JSON files pickable from the UI
│   │       ├── manifest.json          lists the files below
│   │       ├── sample-network.json
│   │       └── sample-multi-network.json
│   └── src/
│       ├── main.jsx               React entry point
│       ├── App.jsx                top-level layout, state, and wiring
│       ├── App.css / index.css    all styling
│       ├── components/            UI pieces (one file per feature)
│       │   ├── TopologyView.jsx        the Cytoscape diagram
│       │   ├── DashboardView.jsx       the sortable/filterable table
│       │   ├── DeviceDetailPanel.jsx   view/edit a single device
│       │   ├── SourceLoader.jsx        upload / sources / local folder
│       │   ├── OverridesControls.jsx   export/import edits, changelog button
│       │   ├── OverridesChangelog.jsx  modal listing every edit made
│       │   ├── LiveStatusControls.jsx  check-now / auto-refresh toggle
│       │   ├── AlertsPanel.jsx         floating panel for status flips
│       │   ├── StatusHistoryStrip.jsx  per-device check history dots
│       │   ├── CompareSnapshot.jsx     diff two JSON snapshots
│       │   └── StatsBar.jsx            node/edge/online/offline counts
│       ├── data/                  pure helper functions, no React
│       │   ├── parseNetworkJSON.js     normalizes the accepted JSON shapes
│       │   ├── mergeOverrides.js       layers edits onto base device data
│       │   ├── mergeLiveStatus.js      layers live-check results on top
│       │   ├── diffOverride.js         computes a before/after for the changelog
│       │   ├── diffSnapshots.js        computes added/removed/changed between two loads
│       │   ├── nodeIcons.js            type → default icon, custom icon override
│       │   ├── nodeColors.js           status → color
│       │   └── sampleData.js           the built-in demo network
│       ├── hooks/
│       │   ├── useLiveStatus.js        talks to the backend, tracks history/alerts
│       │   ├── useSourceManifest.js    fetches public/sources/manifest.json
│       │   └── useLocalFolder.js       wraps the File System Access API
│       └── assets/icons/          the default per-type SVG pictograms
│   ├── Dockerfile                 multi-stage build: compile with Node, serve with nginx
│   └── nginx.conf                 static file + SPA-fallback serving config
│
├── backend/                      Optional Express service (live status only)
│   ├── src/
│   │   ├── index.js                Express app, the /api/status-check route
│   │   ├── pingCheck.js            shells out to the system `ping` command
│   │   ├── statusCheck.js          TCP port scan (open/closed/filtered)
│   │   ├── isPrivateIp.js          restricts checks to private IP ranges
│   │   └── concurrency.js          small helper to bound parallel checks
│   └── Dockerfile                 Node + iputils (for real ICMP ping)
│
├── docker-compose.yml            builds/runs both containers together
└── .github/workflows/            GitHub Pages deploy workflow (frontend only)
```

**How data flows through the app:** whatever JSON you load becomes
`graph.nodes`/`graph.edges` in `App.jsx`. Your edits are stored separately
as `overrides` (keyed by device id) and layered on top by
`mergeOverrides.js`; live-check results are layered on top of *that* by
`mergeLiveStatus.js`. The result (`mergedNodes`) is what both the topology
and dashboard views actually render — the original loaded JSON is never
mutated, which is what makes "Reset to original" and the changelog possible.

## Installation

**Prerequisites:** [Node.js](https://nodejs.org) `^20.19.0` or `>=22.12.0`
(required by the Vite 8 toolchain the frontend uses — this project was
built and tested on Node 22.22) and npm, which comes bundled with it. No
database, no Docker, no accounts required. Check your version with:

```bash
node --version
```

### 1. Get the code

```bash
git clone <this-repo-url>
cd NetDiagGen
```

### 2. Run the app (frontend only — this is enough to use NetDiagGen)

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). You'll see the
app already loaded with sample data — you're done. Everything except live
status checking works right now.

### 3. (Optional) Run the backend for live status checks

Open a **second terminal**, leave the frontend running in the first one:

```bash
cd backend
npm install
npm start
```

This starts on `http://localhost:4000` by default. The frontend
automatically looks for it there — no configuration needed for local use.
Go back to the app and click **"Check Live Status"**; if you don't run this
step, that button will just show a small "backend unavailable" notice and
everything else keeps working normally.

That's the whole install. There's nothing to build, migrate, or seed —
`npm run dev` and (optionally) `npm start` is the entire setup.

## Docker

Prefer containers? Both services have Dockerfiles, and a `docker-compose.yml`
at the repo root wires them together. **Prerequisite:** Docker with the
Compose plugin ([Docker Desktop](https://www.docker.com/products/docker-desktop/)
on Mac/Windows, or `docker` + `docker-compose-plugin` on Linux).

```bash
docker compose up --build
```

That builds and starts both containers:

- Frontend at **http://localhost:8080**
- Backend at **http://localhost:4000**

Stop with `Ctrl+C`, or `docker compose down` to remove the containers. Add
`-d` to run in the background.

A few things worth knowing:

- The frontend is a multi-stage build (compiled with Node, then served as
  static files by nginx) — the image you run doesn't contain Node at all.
- The backend image installs `iputils` so the real ICMP ping check works
  out of the box, and deliberately runs as root (no `USER` directive) so it
  has the raw-socket permission ICMP needs without extra flags. If you
  harden it later with a non-root user, either add
  `cap_add: ["NET_RAW"]` to the `backend` service in `docker-compose.yml`,
  or accept that ICMP checks will report "not available" and reachability
  will fall back to the TCP scan (the app already handles that gracefully).
- `VITE_STATUS_API_URL` is baked into the frontend at **build** time (a
  Vite/browser constraint, not a Docker one — see [Configuration](#configuration)).
  The default (`http://localhost:4000`) is correct for running both
  containers locally. If you deploy these containers to a remote host,
  override it before building:

  ```bash
  VITE_STATUS_API_URL=https://your-domain.example.com:4000 docker compose up --build
  ```

  or create a `.env` file next to `docker-compose.yml` with
  `VITE_STATUS_API_URL=https://your-domain.example.com:4000` in it — Compose
  reads that automatically.
- Only running the frontend container is fine too — comment out or remove
  the `backend` service if you don't want live status checks; nothing else
  depends on it.

To build and run just one service by hand instead of Compose:

```bash
docker build -t netdiaggen-frontend ./frontend
docker run -p 8080:80 netdiaggen-frontend

docker build -t netdiaggen-backend ./backend
docker run -p 4000:4000 netdiaggen-backend
```

### Pre-built images

A GitHub Actions workflow (`.github/workflows/docker-build.yml`) builds both
images and publishes them to GitHub Container Registry automatically — on
every push to `main` that touches `frontend/` or `backend/`, on published
GitHub releases (tagged with the release version), and on demand via the
Actions tab ("Run workflow"). No image building required on your end:

```bash
docker pull ghcr.io/cleontay/netdiaggen-frontend:latest
docker run -p 8080:80 ghcr.io/cleontay/netdiaggen-frontend:latest

docker pull ghcr.io/cleontay/netdiaggen-backend:latest
docker run -p 4000:4000 ghcr.io/cleontay/netdiaggen-backend:latest
```

(Or reference those images directly in `docker-compose.yml` in place of the
`build:` keys if you'd rather always run the published version.) If
`docker pull` fails with a permission/authorization error, the package is
still set to private — open the package's page under the repo's "Packages"
sidebar and change its visibility to public, or `docker login ghcr.io`
first with a personal access token that has `read:packages` scope.

## Usage guide

**1. Load a network.** On first load you already see the sample network.
To load your own: click **Upload JSON File** and pick a file, or use the
**Sources folder** dropdown if your team has bundled files into
`frontend/public/sources/`, or click **Choose Local Folder** (Chrome/Edge
only) to browse a folder on disk without uploading anything.

**2. Explore it.** Use the **Topology View** / **Dashboard View** tabs at
the top of the graph area to switch how you look at the same data. In the
topology view you can zoom, drag nodes around, and switch between grid and
circle layouts. In the dashboard, use the search box and the status/type/
tag dropdowns to narrow down the list, and click any column header to sort.

**3. Click a device** (a node in the diagram, or a row in the dashboard) to
open its detail panel at the bottom of the page. Click **Edit** there to
rename it, list its open ports, add remarks, tag it, or upload a custom
icon. Click **Save**. An "Edited" badge appears anywhere that device shows
up, and **Reset to original** is available if you want to undo it.

**4. Bulk-edit** by switching to the dashboard, ticking the checkboxes next
to several rows, and using the bar that appears above the table to add tags
or set remarks on all of them at once.

**5. Check what's actually online.** Click **Check Live Status** (requires
the backend running — see Installation step 3). Tick **Auto-refresh (30s)**
to keep it current automatically. If a device's status flips while you're
watching, a small alert pops up in the bottom-right corner.

**6. Save your work.** Your edits aren't written back into the original
JSON file — click **Export Overrides** to download them as `overrides.json`.
Next time you load the same network, click **Import Overrides** and pick
that file to bring all your edits back.

**7. Share or archive.** Use **Export PNG** to save the current diagram as
an image, or **Print / Save as PDF** to use your browser's print dialog.

**8. Compare two scans.** If you have two JSON exports of the same network
taken at different times, load the first one normally, then click
**Compare Snapshot** and pick the second file to see exactly what changed.

## JSON format

NetDiagGen accepts several shapes so it can work with output from different
tools — pick whichever matches what you already have:

```json
{ "nodes": [...], "edges": [...] }
{ "devices": [...], "connections": [...] }
{ "hosts": [...], "links": [...] }
```

Or, for a network made of multiple segments (each gets its own dashed box
in the topology view):

```json
{
  "networks": [
    { "id": "office-lan", "name": "Office LAN", "nodes": [...], "edges": [...] }
  ]
}
```

A minimal device (node) looks like this — `id` is the only strictly
required field, everything else is optional:

```json
{
  "id": "router1",
  "name": "Main Router",
  "type": "router",
  "status": "online",
  "ip": "192.168.1.1"
}
```

- `type` drives the icon (`router`, `server`, `workstation`, `iot`; anything
  else gets a generic icon)
- `status` drives the color (`online` / `offline`; anything else shows as
  "unknown")
- `ip` is what's used for live status checks
- **any other field you include** (`os`, `model`, `owner`, whatever) is kept
  and shown automatically in the device detail panel — you don't need to
  register custom fields anywhere

An edge/connection just needs `source` and `target` matching two device
ids:

```json
{ "source": "router1", "target": "server1" }
```

See `frontend/public/sources/sample-network.json` and
`sample-multi-network.json` for complete working examples.

## Configuration

The only setting most people need is where the frontend looks for the
backend. By default it's `http://localhost:4000`. To point it elsewhere
(e.g. a deployed backend), set an environment variable before building the
frontend:

```bash
VITE_STATUS_API_URL=https://your-backend.example.com npm run build
```

The backend itself reads `PORT` (defaults to `4000`) if you need it to
listen elsewhere.

## Deployment

**Frontend** builds to plain static files:

```bash
cd frontend
npm run build   # outputs to frontend/dist
```

Host `frontend/dist` anywhere that serves static files. A GitHub Actions
workflow (`.github/workflows/deploy-frontend.yml`) is included to publish
it to GitHub Pages automatically on every push to `main` — it only takes
effect once Pages is enabled for this repo (repo Settings → Pages → Source:
"GitHub Actions"); nothing publishes until you turn that on. For Netlify or
Vercel instead, point them at the `frontend/` directory with build command
`npm run build` and publish directory `dist`.

**Backend** is a plain Node process — deploy it anywhere that runs Node
(Render, Fly.io, a small VPS, etc.), then point your deployed frontend at
it via `VITE_STATUS_API_URL` (see Configuration above). If it's ever
unreachable, the frontend just shows a small warning and keeps working off
whatever status the loaded JSON reported.

**Containers:** see [Docker](#docker) above — both services also build as
Docker images (`frontend/Dockerfile`, `backend/Dockerfile`), which is the
easiest path if your host (a VPS, Cloud Run, ECS, etc.) runs containers
rather than bare Node processes.

## Troubleshooting

- **"Check Live Status" shows a warning / does nothing** — the backend
  isn't running or isn't reachable at the configured URL. Start it with
  `cd backend && npm start`, or check `VITE_STATUS_API_URL` if you're
  running it somewhere other than `localhost:4000`.
- **ICMP ping always shows "Not available"** — the `ping` command isn't
  installed on the machine running the backend (common in minimal
  containers). Install `iputils-ping` (Debian/Ubuntu) or your platform's
  equivalent. Reachability still works via the TCP scan in the meantime.
- **"Choose Local Folder" button is missing** — that feature (the File
  System Access API) only exists in Chromium-based browsers (Chrome, Edge).
  Use "Upload JSON File" instead in Firefox/Safari.
- **My edits disappeared** — edits live in the browser tab's memory only
  and are not saved automatically. Use **Export Overrides** before closing
  the tab or loading a different network, and **Import Overrides** to bring
  them back.
- **Status check says "only private IP ranges can be checked"** — this is
  intentional: the backend refuses to probe public IP addresses so it can't
  be used to scan the internet. Only RFC1918/loopback/link-local addresses
  (e.g. `192.168.x.x`, `10.x.x.x`, `127.0.0.1`) are checked.

## License

MIT — see [LICENSE](LICENSE).
