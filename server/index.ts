import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeChanges } from '../src/diff';
import { accessTeamIds, canEditTeam, userCapabilities } from '../src/permissions';
import type { AccessSnapshot } from '../src/types';
import { db } from './db';

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// Prototype stand-in for real authentication: the client sends the user id
// from the "view as" switcher. Replace with a session or token check.
function actingUser(req: Request) {
  const user = db.users.find((u) => u.id === req.header('X-User-Id'));
  if (!user) throw new HttpError(401, 'Your session has expired. Sign in again.');
  return user;
}

function findAccess(modelId: string) {
  const access = db.access[modelId];
  if (!access) throw new HttpError(404, 'This model doesn’t exist or was deleted.');
  return access;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// TODO for a real build: reads should also check that the caller can view the model.
app.get('/api/users', (_req, res) => {
  res.json(db.users);
});

app.get('/api/models/:id', (req, res) => {
  const model = db.models.find((m) => m.id === req.params.id);
  if (!model) throw new HttpError(404, 'This model doesn’t exist or was deleted.');
  res.json(model);
});

app.get('/api/models/:id/access', (req, res) => {
  const snapshot: AccessSnapshot = { access: findAccess(req.params.id), teams: db.teams };
  res.json(snapshot);
});

app.get('/api/models/:id/access/log', (req, res) => {
  findAccess(req.params.id);
  res.json(db.log.filter((e) => e.modelId === req.params.id).reverse());
});

// Saves the whole access snapshot at once. Every permission is re-checked here
// rather than trusting the client.
app.put('/api/models/:id/access', (req, res) => {
  const modelId = req.params.id;
  const actor = actingUser(req);
  const current: AccessSnapshot = { access: findAccess(modelId), teams: db.teams };
  const next = req.body as AccessSnapshot;

  if (!next?.access || !Array.isArray(next.access.direct) || !Array.isArray(next.teams)) {
    throw new HttpError(400, 'The request is missing access settings.');
  }
  if (next.access.version !== current.access.version) {
    throw new HttpError(409, 'Someone else changed access to this model while you were editing. Reload to see their changes.');
  }

  const caps = userCapabilities(actor, accessTeamIds(current.access), current.teams);
  const directChanged = !same([...next.access.direct].sort(), [...current.access.direct].sort());
  if (directChanged && !caps.has('manageAccess')) {
    throw new HttpError(403, 'You don’t have permission to change which teams can open this model.');
  }
  for (const id of next.access.direct) {
    if (!current.teams.some((t) => t.id === id)) throw new HttpError(400, 'One of the teams you added no longer exists.');
  }

  for (const t of next.teams) {
    const cur = current.teams.find((x) => x.id === t.id);
    if (!cur) throw new HttpError(400, `The team ${t.name} no longer exists.`);
    if (same(cur, t)) continue;
    if (!canEditTeam(actor, cur)) throw new HttpError(403, `You can’t change ranks or members in ${cur.name}.`);
    if (cur.firmWide && t.members.length !== db.users.length) {
      throw new HttpError(400, `Everyone at the firm has to stay in ${cur.name}.`);
    }
  }

  const changes = describeChanges(current, next, db.users);
  db.teams = next.teams;
  db.access[modelId] = {
    modelId,
    inherited: current.access.inherited, // folder ownership isn't editable here
    direct: next.access.direct,
    version: current.access.version + 1,
  };
  if (changes.length) {
    db.log.push({ id: `log-${db.log.length + 1}`, modelId, at: new Date().toISOString(), userId: actor.id, changes });
  }

  const saved: AccessSnapshot = { access: db.access[modelId], teams: db.teams };
  res.json(saved);
});

app.use('/api', () => {
  throw new HttpError(404, 'No such endpoint.');
});

// In production, Express also serves the frontend that `vite build` produced.
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  const status = (err as { status?: number }).status;
  if (status && status < 500) {
    res.status(status).json({ error: 'The request couldn’t be read.' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server. Try again.' });
});

const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
