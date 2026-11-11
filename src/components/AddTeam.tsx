import { useState } from 'preact/hooks';
import { RANK_BY_ID } from '../permissions';
import type { Team } from '../types';

export function AddTeam({ teams, onAdd }: { teams: Team[]; onAdd: (teamId: string) => void }) {
  const [selected, setSelected] = useState('');
  if (teams.length === 0) return <p class="empty">Every team at the firm already has access.</p>;
  return (
    <div class="add-team">
      <label for="add-team">Give another team access</label>
      <div class="add-row">
        <select id="add-team" value={selected} onChange={(e) => setSelected(e.currentTarget.value)}>
          <option value="">Choose a team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.members.length} people, default {RANK_BY_ID[t.defaultRank].label.toLowerCase()})
            </option>
          ))}
        </select>
        <button
          type="button"
          class="btn"
          disabled={!selected}
          onClick={() => {
            onAdd(selected);
            setSelected('');
          }}
        >
          Add team
        </button>
      </div>
    </div>
  );
}
