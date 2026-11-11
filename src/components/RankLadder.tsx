import { RANK_BY_ID } from '../permissions';
import type { RankId } from '../types';

/** Four rungs, one per rank above "No permissions". */
export function RankLadder({ rank }: { rank: RankId }) {
  const level = RANK_BY_ID[rank].level;
  return (
    <span class="ladder" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <span key={i} class={i <= level ? 'rung on' : 'rung'} style={{ height: `${5 + i * 3}px` }} />
      ))}
    </span>
  );
}

export function RankBadge({ rank, label, note }: { rank: RankId; label?: string; note?: string }) {
  return (
    <span class={`rank-badge${rank === 'none' ? ' is-none' : ''}`}>
      <RankLadder rank={rank} />
      <span>{label ?? RANK_BY_ID[rank].label}</span>
      {note && <span class="rank-note">{note}</span>}
    </span>
  );
}
