## Brief

This repository contains a simple single-page React application built with Vite (client-only). AI agents should treat `client/` as the primary workspace: scripts, config, and source live there.

## Big picture

- Single client app: `client/` — Vite + React (JSX). No server or API code present.
- Entry point: `client/src/main.jsx` mounts `<App />` into the DOM node with id `root` (see `client/index.html`).
- Build & dev handled by Vite via `client/package.json` scripts.

## Where to run commands

- All npm/yarn commands must be executed from the `client/` directory because there is no top-level package.json.

Example (PowerShell):

```powershell
cd client;
npm install;
npm run dev
```

Key scripts (from `client/package.json`):

- `dev` → `vite` (start dev server with HMR)
- `build` → `vite build`
- `preview` → `vite preview`
- `lint` → `eslint .`

## Important files & patterns (examples)

- `client/package.json` — scripts and dependency surface. Prefer updating this file when adding packages.
- `client/vite.config.js` — Vite config; React plugin is enabled (`@vitejs/plugin-react`).
- `client/src/main.jsx` — app bootstrap (createRoot.render).
- `client/src/App.jsx` — example component and HMR testing area.
- `client/eslint.config.js` — project lint rules (note `no-unused-vars` override and `globalIgnores(['dist'])`).

Notes for code changes

- The project uses ESM imports (`type: "module"` in package.json). Use `import`/`export` style.
- Static asset resolution: files referenced at root (e.g. `/vite.svg`) come from the Vite public root — preserve absolute paths when moving assets.
- JSX files use `.jsx` extension; keep file extensions consistent with imports (e.g. `App.jsx`).

Dev & debugging tips

- Hot module replacement is provided by Vite — small edits in `src/` should reflect instantly with `npm run dev`.
- To lint locally: from `client/` run `npm run lint` — ESLint configuration lives in `client/eslint.config.js`.

What not to assume

- There is no server/API scaffold. If a change requires backend behavior, propose adding a `server/` subfolder or a root-level package.json and document the required APIs.

When merging or adding tests

- There are no existing test frameworks configured; if adding tests, also add corresponding devDependencies and a top-level test script in `client/package.json`.

If you need more context

- Read `client/README.md` and `client/vite.config.js` for template rationale.

Return to me with any unclear areas (e.g., intended deployment target, CI, or adding a backend), and I'll iterate on these instructions.

#reference website: `https://firstindianews.com`
