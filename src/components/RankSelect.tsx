import { RANKS, RANK_BY_ID } from '../permissions';
import type { RankId } from '../types';
import { RankLadder } from './RankLadder';

interface Props {
  id: string;
  label: string;
  value: RankId | null; // null = use the team default
  teamDefault?: RankId; // when set, offers a "Team default" option
  onChange: (rank: RankId | null) => void;
}

export function RankSelect({ id, label, value, teamDefault, onChange }: Props) {
  const shown = value ?? teamDefault ?? 'none';
  return (
    <span class="rank-select">
      <RankLadder rank={shown} />
      <select
        id={id}
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => {
          const v = e.currentTarget.value;
          onChange(v === '' ? null : (v as RankId));
        }}
      >
        {teamDefault && <option value="">Team default ({RANK_BY_ID[teamDefault].label})</option>}
        {RANKS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
    </span>
  );
}
