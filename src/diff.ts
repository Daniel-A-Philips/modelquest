import { RANK_BY_ID } from './permissions';
import type { AccessSnapshot, RankId, Team, User } from './types';

/** Plain-language list of what changed between two snapshots. Used by the UI and the audit log. */
export function describeChanges(before: AccessSnapshot, after: AccessSnapshot, users: User[]): string[] {
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const teamName = (id: string) =>
    (after.teams.find((t) => t.id === id) ?? before.teams.find((t) => t.id === id))?.name ?? id;
  const rankText = (rank: RankId | undefined, team: Team) =>
    rank ? RANK_BY_ID[rank].label : `team default (${RANK_BY_ID[team.defaultRank].label})`;

  const out: string[] = [];

  for (const id of after.access.direct) {
    if (!before.access.direct.includes(id)) out.push(`Gave ${teamName(id)} access`);
  }
  for (const id of before.access.direct) {
    if (!after.access.direct.includes(id)) out.push(`Removed access for ${teamName(id)}`);
  }

  for (const t of after.teams) {
    const b = before.teams.find((x) => x.id === t.id);
    if (!b) continue;
    if (b.defaultRank !== t.defaultRank) {
      out.push(
        `${t.name}: default rank from ${RANK_BY_ID[b.defaultRank].label} to ${RANK_BY_ID[t.defaultRank].label}`,
      );
    }
    for (const m of t.members) {
      const bm = b.members.find((x) => x.userId === m.userId);
      if (!bm) out.push(`Added ${name(m.userId)} to ${t.name}`);
      else if (bm.rank !== m.rank) {
        out.push(`${t.name}: ${name(m.userId)} from ${rankText(bm.rank, b)} to ${rankText(m.rank, t)}`);
      }
    }
    for (const bm of b.members) {
      if (!t.members.some((x) => x.userId === bm.userId)) out.push(`Removed ${name(bm.userId)} from ${t.name}`);
    }
  }
  return out;
}
