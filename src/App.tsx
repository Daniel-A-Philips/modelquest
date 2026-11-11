import { useEffect, useMemo, useState } from 'preact/hooks';
import { api } from './api';
import { describeChanges } from './diff';
import {
  accessTeamIds,
  canEditTeam,
  canManageModelAccess,
  teamManagers,
  userCapabilities,
} from './permissions';
import type { AccessLogEntry, AccessSnapshot, Model, Team, User } from './types';
import { ActivityLog } from './components/ActivityLog';
import { AddTeam } from './components/AddTeam';
import { ChangeBar } from './components/ChangeBar';
import { EffectiveAccess } from './components/EffectiveAccess';
import { RankTable } from './components/RankTable';
import { TeamCard } from './components/TeamCard';

const MODEL_ID = 'm-uslcc';
const MODEL_TYPE_LABEL = { 'security-weight': 'Security-weight model', 'asset-class': 'Asset-class model' } as const;

type Tab = 'teams' | 'people' | 'activity';
const TABS: { id: Tab; label: string }[] = [
  { id: 'teams', label: 'Teams' },
  { id: 'people', label: 'People' },
  { id: 'activity', label: 'Activity' },
];

export function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [model, setModel] = useState<Model | null>(null);
  const [saved, setSaved] = useState<AccessSnapshot | null>(null);
  const [draft, setDraft] = useState<AccessSnapshot | null>(null);
  const [log, setLog] = useState<AccessLogEntry[]>([]);
  const [viewerId, setViewerId] = useState('u-sarah');
  const [tab, setTab] = useState<Tab>('teams');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listUsers(), api.getModel(MODEL_ID), api.getAccess(MODEL_ID), api.getLog(MODEL_ID)])
      .then(([u, m, a, l]) => {
        setUsers(u);
        setModel(m);
        setSaved(a);
        setDraft(a);
        setLog(l);
      })
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const changes = useMemo(
    () => (saved && draft ? describeChanges(saved, draft, users) : []),
    [saved, draft, users],
  );

  if (loadError) {
    return (
      <main class="shell">
        <p class="error" role="alert">
          Access settings didn’t load: {loadError}
        </p>
      </main>
    );
  }
  const viewer = users.find((u) => u.id === viewerId);
  if (!model || !saved || !draft || !viewer) {
    return (
      <main class="shell">
        <p class="loading">Loading access settings…</p>
      </main>
    );
  }

  const savedIds = accessTeamIds(saved.access);
  const draftIds = accessTeamIds(draft.access);
  const canView = userCapabilities(viewer, savedIds, saved.teams).has('view');
  const canManage = canManageModelAccess(viewer, savedIds, saved.teams);
  const savedTeam = (id: string) => saved.teams.find((t) => t.id === id)!;
  const draftTeam = (id: string) => draft.teams.find((t) => t.id === id)!;
  const canEditAny = savedIds.some((id) => canEditTeam(viewer, savedTeam(id)));
  const dirty = changes.length > 0;

  const losesAccess = canManage && !viewer.firmAdmin && !canManageModelAccess(viewer, draftIds, draft.teams);
  const warnings: string[] = [];
  if (teamManagers(users, draftIds, draft.teams).length === 0) {
    warnings.push(
      'No team administrator will have access. Only firm administrators will be able to change access to this model.',
    );
  }
  if (losesAccess) warnings.push('You’ll no longer be able to change access to this model after saving.');

  const updateTeam = (id: string, fn: (t: Team) => Team) =>
    setDraft((d) => d && { ...d, teams: d.teams.map((t) => (t.id === id ? fn(t) : t)) });

  const addTeam = (id: string) =>
    setDraft((d) => d && { ...d, access: { ...d.access, direct: [...d.access.direct, id] } });

  // Removing a team also drops any unsaved rank edits made to it here.
  const removeTeam = (id: string) =>
    setDraft(
      (d) =>
        d && {
          access: { ...d.access, direct: d.access.direct.filter((x) => x !== id) },
          teams: d.teams.map((t) => (t.id === id ? savedTeam(id) : t)),
        },
    );

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const next = await api.saveAccess(MODEL_ID, viewer!.id, draft);
      const n = changes.length;
      setSaved(next);
      setDraft(next);
      setLog(await api.getLog(MODEL_ID));
      setNotice(`Saved ${n} ${n === 1 ? 'change' : 'changes'}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const folders = [...new Set(draft.access.inherited.map((i) => i.folder))];
  const card = (id: string, direct: boolean) => (
    <TeamCard
      key={id}
      team={draftTeam(id)}
      savedTeam={savedTeam(id)}
      users={users}
      viewerId={viewer.id}
      canEdit={canEditTeam(viewer, savedTeam(id))}
      canRemove={direct && canManage}
      onUpdate={(fn) => updateTeam(id, fn)}
      onRemove={() => removeTeam(id)}
    />
  );

  return (
    <main class="shell">
      <header class="topbar">
        <div class="title-block">
          <nav aria-label="Folder path" class="crumbs">
            {model.path.join(' / ')}
          </nav>
          <h1>{model.name}</h1>
          <p class="subtitle">
            <span class="chip chip-type">{MODEL_TYPE_LABEL[model.type]}</span>
            Who can open and change this model
          </p>
        </div>
        <div class="viewer" title="Prototype control: switch users to see how permissions change the screen">
          <label for="viewer">Prototype: view as</label>
          <select
            id="viewer"
            value={viewerId}
            disabled={dirty}
            onChange={(e) => {
              setViewerId(e.currentTarget.value);
              setError(null);
            }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.firmAdmin ? 'firm admin' : u.title.toLowerCase()})
              </option>
            ))}
          </select>
          {dirty && <span class="hint">Save or discard changes to switch.</span>}
        </div>
      </header>

      {!canView ? (
        <div class="no-access">
          <h2>You don’t have access to this model</h2>
          <p>
            Ask an administrator of a team that owns the “{folders[0] ?? model.path.at(-1)}” folder to add you to their
            team.
          </p>
        </div>
      ) : (
        <>
          <div class="tabs" role="tablist" aria-label="Access sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                class="tab"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!canManage && !canEditAny && (
            <p class="readonly">You can see who has access. Team administrators can change it.</p>
          )}

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'teams' && (
              <div class="layout">
                <div class="teams">
                  {folders.map((folder) => (
                    <section key={folder} class="group" aria-labelledby={`group-${folder}`}>
                      <h2 id={`group-${folder}`}>From the “{folder}” folder</h2>
                      <p class="group-note">
                        Teams that own this folder can open everything in it. To remove one, change the folder’s
                        access.
                      </p>
                      {draft.access.inherited.filter((i) => i.folder === folder).map((i) => card(i.teamId, false))}
                    </section>
                  ))}

                  <section class="group" aria-labelledby="group-direct">
                    <h2 id="group-direct">Added to this model</h2>
                    <p class="group-note">These teams can open this model but nothing else in the folder.</p>
                    {draft.access.direct.length === 0 && (
                      <p class="empty">
                        No extra teams yet.{canManage && ' Add one to share this model without sharing the folder.'}
                      </p>
                    )}
                    {draft.access.direct.map((id) => card(id, true))}
                    {canManage && (
                      <AddTeam teams={draft.teams.filter((t) => !draftIds.includes(t.id))} onAdd={addTeam} />
                    )}
                  </section>
                </div>
                <aside>
                  <RankTable />
                </aside>
              </div>
            )}
            {tab === 'people' && <EffectiveAccess users={users} saved={saved} draft={draft} dirty={dirty} />}
            {tab === 'activity' && <ActivityLog entries={log} users={users} />}
          </div>
        </>
      )}

      <ChangeBar
        changes={changes}
        warnings={warnings}
        losesAccess={losesAccess}
        saving={saving}
        error={error}
        notice={notice}
        onSave={save}
        onDiscard={() => {
          setDraft(saved);
          setError(null);
        }}
      />
    </main>
  );
}
