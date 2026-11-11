import { useState } from 'preact/hooks';
import { CAPABILITIES, RANK_BY_ID, accessTeamIds, effectiveRank, userCapabilities } from '../permissions';
import type { AccessSnapshot, User } from '../types';
import { RankBadge } from './RankLadder';

interface Props {
  users: User[];
  saved: AccessSnapshot;
  draft: AccessSnapshot;
  dirty: boolean;
}

export function EffectiveAccess({ users, saved, draft, dirty }: Props) {
  const [query, setQuery] = useState('');
  const [showEveryone, setShowEveryone] = useState(false);

  const nowIds = accessTeamIds(draft.access);
  const beforeIds = accessTeamIds(saved.access);
  const teamName = (id: string) => draft.teams.find((t) => t.id === id)?.name ?? id;

  const rows = users.map((user) => ({
    user,
    now: effectiveRank(user.id, nowIds, draft.teams),
    before: effectiveRank(user.id, beforeIds, saved.teams),
    caps: userCapabilities(user, nowIds, draft.teams),
  }));
  const openCount = rows.filter((r) => r.caps.has('view')).length;
  const applyCount = rows.filter((r) => r.caps.has('applyDrafts')).length;

  const q = query.trim().toLowerCase();
  const level = (r: (typeof rows)[number]) => (r.user.firmAdmin ? 5 : RANK_BY_ID[r.now.rank].level);
  const visible = rows
    .filter((r) => showEveryone || r.caps.has('view') || r.before.rank !== 'none')
    .filter((r) => !q || r.user.name.toLowerCase().includes(q) || r.user.title.toLowerCase().includes(q))
    .sort((a, b) => level(b) - level(a) || a.user.name.localeCompare(b.user.name));

  return (
    <section aria-labelledby="people-title">
      <h2 id="people-title" class="sr-only">
        People with access
      </h2>
      <p class="summary">
        {openCount} of {users.length} people can open this model, and {applyCount} can apply drafts.
        {dirty && ' This includes your unsaved changes.'}
      </p>
      <div class="filters">
        <input
          type="search"
          placeholder="Find a person"
          aria-label="Find a person"
          value={query}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />
        <label class="check">
          <input type="checkbox" checked={showEveryone} onChange={(e) => setShowEveryone(e.currentTarget.checked)} />
          Show people without access
        </label>
      </div>

      <div class="table-wrap">
        <table class="access-table">
          <thead>
            <tr>
              <th scope="col">Person</th>
              <th scope="col">Rank on this model</th>
              <th scope="col">Through</th>
              {CAPABILITIES.map((c) => (
                <th key={c.id} scope="col" class="cap" title={c.label}>
                  {c.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const changed = !r.user.firmAdmin && r.now.rank !== r.before.rank;
              return (
                <tr key={r.user.id} class={changed ? 'changed' : ''}>
                  <th scope="row">
                    <span class="name">{r.user.name}</span>
                    <span class="title">{r.user.title}</span>
                  </th>
                  <td>
                    {r.user.firmAdmin ? (
                      <RankBadge rank="admin" label="Firm administrator" />
                    ) : (
                      <RankBadge rank={r.now.rank} />
                    )}
                    {changed && <span class="was">Was {RANK_BY_ID[r.before.rank].label.toLowerCase()}</span>}
                  </td>
                  <td class="through">
                    {r.user.firmAdmin
                      ? 'Firm administrator account'
                      : r.now.via.map(teamName).join(', ') || 'Not in a team with access'}
                  </td>
                  {CAPABILITIES.map((c) => (
                    <td key={c.id} class="cap">
                      {r.caps.has(c.id) ? (
                        <>
                          <span aria-hidden="true" class="yes">✓</span>
                          <span class="sr-only">Yes</span>
                        </>
                      ) : (
                        <>
                          <span aria-hidden="true" class="no">–</span>
                          <span class="sr-only">No</span>
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && <p class="empty">No one matches “{query}”. Check the spelling or show people without access.</p>}
    </section>
  );
}
