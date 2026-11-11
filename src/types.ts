// Ranks are provisional in the design doc, so they live in one config table
// (see permissions.ts) and everything else refers to them by id.
export type RankId = 'none' | 'limited' | 'regular' | 'power' | 'admin';

export type Capability =
  | 'view'
  | 'editDrafts'
  | 'deleteDrafts'
  | 'applyDrafts'
  | 'sendToReportQuest'
  | 'viewAuditLog'
  | 'manageAccess';

export interface Rank {
  id: RankId;
  label: string;
  short: string;
  level: number; // higher wins when a user is in several teams
  capabilities: Capability[];
}

export interface User {
  id: string;
  name: string;
  title: string;
  firmAdmin: boolean; // firm-level administrator account
}

/** A member with no `rank` gets the team's default rank. */
export interface TeamMember {
  userId: string;
  rank?: RankId;
}

/** Ranks belong to the team (per the doc), so editing them affects every place the team has access. */
export interface Team {
  id: string;
  name: string;
  firmWide: boolean;
  defaultRank: RankId;
  members: TeamMember[];
  usedIn: number; // folders + models this team has access to
}

export type ModelType = 'security-weight' | 'asset-class';

export interface Model {
  id: string;
  name: string;
  type: ModelType;
  path: string[];
}

export interface InheritedTeam {
  teamId: string;
  folder: string;
}

export interface ModelAccess {
  modelId: string;
  inherited: InheritedTeam[]; // teams that own the model's folder (read-only here)
  direct: string[]; // team ids added to this model specifically
  version: number; // optimistic concurrency
}

/** Everything the access screen edits, saved as one unit. */
export interface AccessSnapshot {
  access: ModelAccess;
  teams: Team[];
}

export interface AccessLogEntry {
  id: string;
  modelId: string;
  at: string;
  userId: string;
  changes: string[];
}
