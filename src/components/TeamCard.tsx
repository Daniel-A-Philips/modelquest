import { useState } from 'preact/hooks';
import type { Team, User } from '../types';
import { RankBadge } from './RankLadder';
import { RankSelect } from './RankSelect';

interface Props {
  team: Team;
  savedTeam: Team;
  users: User[];
  viewerId: string;
  canEdit: boolean; // ranks and members
  canRemove: boolean; // take the team off this model
  onUpdate: (fn: (t: Team) => Team) => void;
  onRemove: () => void;
}

export function TeamCard({ team, savedTeam, users, viewerId, canEdit, canRemove, onUpdate, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const [newMember, setNewMember] = useState('');

  const edited = JSON.stringify(team) !== JSON.stringify(savedTeam);
  const userById = new Map(users.map((u) => [u.id, u]));
  const members = [...team.members].sort((a, b) =>
    (userById.get(a.userId)?.name ?? '').localeCompare(userById.get(b.userId)?.name ?? ''),
  );
  const outsiders = users.filter((u) => !team.members.some((m) => m.userId === u.id));
  const base = `team-${team.id}`;
  const count = `${team.members.length} ${team.members.length === 1 ? 'person' : 'people'}`;

  return (
    <article class={`team${edited ? ' is-edited' : ''}`} aria-labelledby={`${base}-name`}>
      <header class="team-head">
        <div>
          <h3 id={`${base}-name`}>{team.name}</h3>
          <p class="team-meta">{team.firmWide ? `Everyone at the firm, ${count}` : count}</p>
        </div>
        <div class="team-actions">
          {edited && <span class="chip">Edited</span>}
          {canRemove && (
            <button type="button" class="btn btn-quiet btn-danger-text" onClick={onRemove}>
              Remove access
            </button>
          )}
        </div>
      </header>

      <div class="team-default">
        <label for={`${base}-default`}>Default rank</label>
        {canEdit ? (
          <RankSelect
            id={`${base}-default`}
            label={`Default rank for ${team.name}`}
            value={team.defaultRank}
            onChange={(r) => r && onUpdate((t) => ({ ...t, defaultRank: r }))}
          />
        ) : (
          <RankBadge rank={team.defaultRank} />
        )}
        <span class="hint">For members without their own rank.</span>
      </div>

      <button
        type="button"
        class="disclosure"
        aria-expanded={open}
        aria-controls={`${base}-members`}
        onClick={() => setOpen(!open)}
      >
        <span class="caret" aria-hidden="true" />
        {open ? 'Hide people' : `Show people (${team.members.length})`}
      </button>

      {open && (
        <div id={`${base}-members`}>
          <ul class="members">
            {members.map((m) => {
              const u = userById.get(m.userId);
              if (!u) return null;
              return (
                <li key={m.userId}>
                  <div class="who">
                    <span class="name">
                      {u.name}
                      {u.id === viewerId && <span class="you"> (you)</span>}
                    </span>
                    <span class="title">{u.title}</span>
                  </div>
                  {canEdit ? (
                    <RankSelect
                      id={`${base}-${u.id}`}
                      label={`Rank for ${u.name} in ${team.name}`}
                      value={m.rank ?? null}
                      teamDefault={team.defaultRank}
                      onChange={(r) =>
                        onUpdate((t) => ({
                          ...t,
                          members: t.members.map((x) =>
                            x.userId !== m.userId ? x : r ? { userId: x.userId, rank: r } : { userId: x.userId },
                          ),
                        }))
                      }
                    />
                  ) : (
                    <RankBadge rank={m.rank ?? team.defaultRank} note={m.rank ? undefined : 'team default'} />
                  )}
                  {canEdit && !team.firmWide && (
                    <button
                      type="button"
                      class="btn btn-quiet btn-small"
                      aria-label={`Remove ${u.name} from ${team.name}`}
                      onClick={() =>
                        onUpdate((t) => ({ ...t, members: t.members.filter((x) => x.userId !== m.userId) }))
                      }
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {canEdit && !team.firmWide && outsiders.length > 0 && (
            <div class="add-row">
              <select
                aria-label={`Add a person to ${team.name}`}
                value={newMember}
                onChange={(e) => setNewMember(e.currentTarget.value)}
              >
                <option value="">Add a person to {team.name}</option>
                {outsiders.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.title})
                  </option>
                ))}
              </select>
              <button
                type="button"
                class="btn"
                disabled={!newMember}
                onClick={() => {
                  onUpdate((t) => ({ ...t, members: [...t.members, { userId: newMember }] }));
                  setNewMember('');
                }}
              >
                Add person
              </button>
            </div>
          )}
        </div>
      )}

      {!canEdit && <p class="hint team-foot">Only this team’s administrators can change its ranks.</p>}
      {edited && team.usedIn > 1 && (
        <p class="team-notice">
          Rank and membership changes apply everywhere {team.name} has access ({team.usedIn} folders and models), not
          only this model.
        </p>
      )}
    </article>
  );
}
