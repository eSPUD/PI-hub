# Contributing to PI-hub

A short guide to setting up, validating, and deploying PI-hub.

## Prerequisites

- **Node.js 20+** (tested with 22). On macOS, you may have multiple node installs — verify with `node --version`.
- **npm** (bundled with Node).

If a Homebrew node install is broken (missing dylibs), prefer the `/usr/local/bin` install or use a version manager like `nvm`/`fnm`.

## Local development

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The dev server hot-reloads on file changes.

Data is read/written under `content/` (gitignored content lives next to checked-in seed data). If `content/` is empty, the app starts with a default PI shell and no projects.

## Project layout

```
app/
├── layout.tsx                  # shell + StoreProvider
├── page.tsx                    # dashboard
├── pi/page.tsx                 # PI profile editor
├── projects/                   # list, new, detail
├── members/                    # list, new, detail
├── cfps/                       # list, new, detail (deadlines)
├── archives/page.tsx           # restore archived items
└── api/                        # REST routes that read/write content/*.md
    ├── store/route.ts          # combined store snapshot
    ├── pi/route.ts
    ├── projects/[id]/route.ts
    ├── projects/[id]/report/route.ts   # PDF export
    ├── members/[id]/route.ts
    └── cfps/[id]/route.ts
components/
├── Nav.tsx                     # sidebar with SVG icons
├── Topbar.tsx                  # greeting, breadcrumb, search, add buttons
└── Bits.tsx                    # shared UI bits: avatars, badges, countdown
lib/
├── types.ts                    # PI, Project, Member, CallForPaper, etc.
├── store.tsx                   # client store + mutations via fetch
├── fs-store.ts                 # server-only filesystem read/write
└── report.tsx                  # @react-pdf/renderer Document
content/                        # data lives here (markdown files)
public/                         # static assets (logo.png)
```

## Conventions

- **Server-only modules** under `lib/fs-store.ts` and `lib/report.tsx` may use Node APIs (`fs`, `path`). Never import them from a client component.
- **Client mutations** go through `useStore()` (`lib/store.tsx`). Mutations are optimistic on the client and persisted by calling the matching API route.
- **Markdown round-trip:** YAML frontmatter is the source of truth. The body is regenerated on every write — never expect to round-trip arbitrary body edits.
- **Archive, don't delete.** UI exposes "Archive" (sets `archivedAt`). The DELETE API endpoints exist but are not exercised by the UI. The `/archives` page restores items by clearing `archivedAt`.

## Validation

Before pushing changes, run:

```bash
npm run lint        # ESLint via next lint
npm run build       # full type-check + production build
```

`npm run build` is the most thorough check — it catches TS errors that `next dev` swallows, and confirms the route tree compiles.

Also worth verifying manually:

- Open `/`, `/projects`, `/members`, `/cfps`, `/archives`, `/pi`, plus a project / member / CFP detail page.
- Create one of each entity, assign relationships, archive, restore.
- Click **Export PDF** on a project and open the file — verify there's no overlapping text and pagination is clean.
- Check the topbar breadcrumb resolves UUIDs to friendly names.

## Deployment to Vercel

1. Push the repo to GitHub.
2. Import the repo on https://vercel.com — accept the default Next.js settings; no env vars required.
3. Set the production branch (typically `main`).
4. Deploy.

The Next.js framework preset on Vercel handles the build. The `@react-pdf/renderer` PDF endpoint runs as a Node serverless function (`export const runtime = "nodejs"` is already set in `app/api/projects/[id]/report/route.ts`).

### About the read-only filesystem

Vercel's serverless functions cannot persist writes to the project filesystem. That means:

- **Reads work** for whatever you committed under `content/` at deploy time.
- **Writes via the UI** appear to succeed but do not persist across requests / cold starts.

To update production data: edit locally, commit the `content/*.md` files, push, and let Vercel redeploy. For a writable production deployment, self-host (Render, Fly, a VM) with a persistent filesystem mounted at `content/`.

## Adding a new entity

When adding a new top-level entity (similar to Project / Member / CFP):

1. Define the type in `lib/types.ts` and add it to the `Store` shape.
2. Add `coerce`, `read`, `readAll`, `write`, `delete`, and a `render…Body` helper to `lib/fs-store.ts`. Include the entity directory in `ensureDirs()`. Make sure `readStore()` returns it.
3. Add `app/api/<entity>/route.ts` (GET, POST) and `app/api/<entity>/[id]/route.ts` (GET, PATCH, DELETE).
4. Extend the client `useStore()` in `lib/store.tsx` with add / update / archive (= update with `archivedAt`) functions.
5. Build pages under `app/<entity>/`: list, new, detail.
6. Add a sidebar entry in `components/Nav.tsx` (include an SVG icon in the `Icon` component switch).
7. Filter archived items out of the list pages; surface them on `/archives` with a Restore button.

## Reporting bugs / requesting features

Open an issue with:

- What you expected
- What happened instead
- Steps to reproduce (which page, which entity, which click)
- Browser + Node version

For visual issues, a screenshot saves a thousand words.
