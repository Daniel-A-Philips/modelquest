# ModelQuest – model access prototype

Preact + TypeScript frontend with a small Express API for changing which teams can access a model and what rank each person has.

```
npm install
npm run dev     # Vite on http://localhost:5173, Express API on :3001
npm run build   # typecheck client + server, build the frontend into dist/
npm start       # Express serves the API and dist/ on http://localhost:3001
```

## How the pieces fit

- **Vite** is the frontend build tool. In development it serves `src/` with instant reload and forwards `/api/*` to Express.
  `npm run build` bundles the frontend into `dist/`.
- **Express** (`server/index.ts`) is the API. In production (`npm start`) it also serves `dist/`, so it's the only process.
- `src/types.ts`, `src/permissions.ts` and `src/diff.ts` are shared: the client uses them to preview changes, and the server
  uses the same code to enforce them.

## Layout

| File | Purpose |
| --- | --- |
| `server/index.ts` | Express routes and server-side permission checks |
| `server/db.ts` | In-memory seed data (resets on restart) |
| `src/api.ts` | Client `fetch` wrapper for the API |
| `src/permissions.ts` | Rank table (provisional, edit here), effective-rank and capability logic |
| `src/diff.ts` | Plain-language change list, shared by the save bar and audit log |
| `src/App.tsx` | Screen state: saved snapshot vs. draft, viewer, tabs |
| `src/components/` | Team cards, rank picker, people table, activity log, save bar |

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/users` | |
| GET | `/api/models/:id` | |
| GET | `/api/models/:id/access` | Model access plus the firm's teams |
| GET | `/api/models/:id/access/log` | Newest first |
| PUT | `/api/models/:id/access` | Body is the whole snapshot; `X-User-Id` header names the acting user |

## Prototype shortcuts

- `X-User-Id` stands in for real authentication; reads aren't permission-checked yet.
- Data is in memory, so restarting the server resets it.
- Ranks belong to the team, so editing a team's ranks here edits the team everywhere.
- Teams can be added to a single model; teams inherited from the folder can't be removed here.
- Firm administrators can always manage access.
- The dashed "Prototype: view as" control is for demoing permission states.
