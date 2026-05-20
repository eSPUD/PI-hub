# PI-hub

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A research hub for a Principal Investigator: a single place to plan projects, track teams, watch submission deadlines, and keep a durable log of what was tried and learned.

## Who this is for

PI-hub serves the PI of **eSPUD** — an independent research collective exploring on-device AI: models small enough to run on phones, sensors, wearables, and constrained hardware. We believe meaningful intelligence shouldn't require a datacenter round-trip, and that AI ethics — data use, consent, bias, downstream impact — should be reviewed before anything leaves the lab. We publish what we learn, including what didn't work.

The app assumes one PI managing many projects, each with its own contributors, plan, setup, log, artifacts, and target venues.

## Features

- **PI profile** — name, title, pronouns, affiliation, location, contact, online profiles (ORCID, Scholar, GitHub, LinkedIn, X), bio, focus areas, expertise tags, education and selected publications.
- **Projects** — name, description, status (exploration / planning / active / paused / archived), Discord link, research plan, research setup, contributor lists, artifacts, append-only exploration log.
- **Members** — first-class team roster with avatars, role, affiliation, GitHub, expertise tags, and per-project assignment toggles. Names are unique within a project.
- **Call-for-paper deadlines** — track venues with abstract / submission / notification / conference dates, topics, location, notes. A live timeline visualizes the next 6 months with color-coded urgency (green → amber → red as the deadline approaches; gray once passed).
- **Live countdown** — the next upcoming deadline is shown as a big D : HH : MM : SS ticker, updating every second. Compact countdowns appear on every CFP card and project assignment.
- **Assessment scoring** — each project assigned to a CFP carries a status: `not started`, `in progress`, `submitted`, `accepted`, `rejected`, `late`, `abandoned`. Statuses surface as color-coded badges everywhere the assignment appears.
- **Dashboard** — greeting, breadcrumb path, status overview donut, recent activity feed, top contributors, project table with avatar stacks and log-activity progress.
- **Global search** — searches projects, descriptions, members, expertise, and CFP topics. The query lives in the URL so it survives refresh.
- **Archives** — projects, members, and CFPs are archived rather than deleted. A dedicated `/archives` page lists everything that's been put away and lets you restore any item back to the active lists. Project assignments and CFP relationships are preserved across archive/restore.
- **PDF export** — every project has an "Export PDF" button that generates a clean, well-spaced report including the plan, setup, team, target venues with status, artifacts, and the full exploration log.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Plain CSS (no UI framework)
- `@react-pdf/renderer` for PDF generation
- `js-yaml` for markdown frontmatter parsing
- **Storage: markdown files on disk** — no external database

## Storage model

Everything lives under `content/`:

```
content/
├── pi.md                  # the single PI profile
├── projects/<uuid>.md     # one file per project
├── members/<uuid>.md      # one file per team member
└── cfps/<uuid>.md         # one file per call for papers
```

Each file has YAML frontmatter (the source of truth) plus a generated, human-readable markdown body. Editing in the UI rewrites the corresponding file via the API routes under `app/api/`.

Relationships are stored on the parent: a project's `memberIds: []` references members, and its `cfpAssignments: [{cfpId, status, notes, assignedAt}]` references CFPs. Archived items carry an `archivedAt: <ISO>` field; empty means active.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deployment

The app deploys cleanly as a Next.js project on Vercel. The serverless filesystem is read-only at runtime, so:

- **Reads work fine.** Whatever is committed under `content/` shows up in production.
- **Writes don't persist on Vercel.** To update production data, edit locally, commit the markdown files in `content/`, and redeploy.

For a self-hosted node deployment, writes persist normally on the host's filesystem.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development, validation, and deployment details.

## License

[MIT](./LICENSE) © Shashank Bangalore Lakshman. Contributions welcome — by submitting a PR you agree your contribution is licensed under the same terms.
