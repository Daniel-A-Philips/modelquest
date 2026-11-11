import type { Capability, ModelAccess, Rank, RankId, Team, User } from './types';

export const RANKS: Rank[] = [
  { id: 'none', label: 'No permissions', short: 'None', level: 0, capabilities: [] },
  { id: 'limited', label: 'Limited user', short: 'Limited', level: 1, capabilities: ['view'] },
  { id: 'regular', label: 'Regular user', short: 'Regular', level: 2, capabilities: ['view', 'editDrafts'] },
  {
    id: 'power',
    label: 'Power user',
    short: 'Power',
    level: 3,
    capabilities: ['view', 'editDrafts', 'deleteDrafts', 'applyDrafts', 'sendToReportQuest'],
  },
  {
    id: 'admin',
    label: 'Team administrator',
    short: 'Admin',
    level: 4,
    capabilities: [
      'view',
      'editDrafts',
      'deleteDrafts',
      'applyDrafts',
      'sendToReportQuest',
      'viewAuditLog',
      'manageAccess',
    ],
  },
];

export const RANK_BY_ID = Object.fromEntries(RANKS.map((r) => [r.id, r])) as Record<RankId, Rank>;

export const CAPABILITIES: { id: Capability; label: string; short: string }[] = [
  { id: 'view', label: 'Open the model and its drafts', short: 'View' },
  { id: 'editDrafts', label: 'Create and edit drafts', short: 'Edit drafts' },
  { id: 'deleteDrafts', label: 'Delete drafts', short: 'Delete drafts' },
  { id: 'applyDrafts', label: 'Apply drafts to the model', short: 'Apply drafts' },
  { id: 'sendToReportQuest', label: 'Send the model to ReportQuest', short: 'ReportQuest' },
  { id: 'viewAuditLog', label: 'See the audit log', short: 'Audit log' },
  { id: 'manageAccess', label: 'Change who has access', short: 'Access' },
];

export function memberRank(team: Team, userId: string): RankId | null {
  const m = team.members.find((x) => x.userId === userId);
  if (!m) return null;
  return m.rank ?? team.defaultRank;
}

export function accessTeamIds(access: ModelAccess): string[] {
  return [...new Set([...access.inherited.map((i) => i.teamId), ...access.direct])];
}

export interface Effective {
  rank: RankId;
  via: string[]; // team ids that grant the winning rank
}

/** Highest rank across every team on the model that the user belongs to. */
export function effectiveRank(userId: string, teamIds: string[], teams: Team[]): Effective {
  let rank: RankId = 'none';
  let via: string[] = [];
  for (const id of teamIds) {
    const team = teams.find((t) => t.id === id);
    if (!team) continue;
    const r = memberRank(team, userId);
    if (r === null) continue;
    const level = RANK_BY_ID[r].level;
    const best = RANK_BY_ID[rank].level;
    if (level > best) {
      rank = r;
      via = [id];
    } else if (level === best && level > 0) {
      via.push(id);
    }
  }
  return { rank, via };
}

/** Assumption: firm administrators can always manage every model so none is ever orphaned. */
export function userCapabilities(user: User, teamIds: string[], teams: Team[]): Set<Capability> {
  if (user.firmAdmin) return new Set(CAPABILITIES.map((c) => c.id));
  return new Set(RANK_BY_ID[effectiveRank(user.id, teamIds, teams).rank].capabilities);
}

export function canManageModelAccess(user: User, teamIds: string[], teams: Team[]): boolean {
  return userCapabilities(user, teamIds, teams).has('manageAccess');
}

/** Firm admins manage every team; team admins manage only their own team. */
export function canEditTeam(user: User, team: Team): boolean {
  return user.firmAdmin || memberRank(team, user.id) === 'admin';
}

/** Non-firm-admin users who could change this model's access. */
export function teamManagers(users: User[], teamIds: string[], teams: Team[]): User[] {
  return users.filter((u) => !u.firmAdmin && canManageModelAccess(u, teamIds, teams));
}
