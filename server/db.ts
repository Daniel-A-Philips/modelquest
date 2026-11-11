// In-memory data store. Resets every time the server restarts.
// Replace with a real database later; only server/index.ts reads from it.
import type { AccessLogEntry, Model, ModelAccess, Team, User } from '../src/types';

const users: User[] = [
  { id: 'u-priya', name: 'Priya Raman', title: 'Operations director', firmAdmin: true },
  { id: 'u-sarah', name: 'Sarah Okafor', title: 'Equity strategies supervisor', firmAdmin: false },
  { id: 'u-john', name: 'John Mercer', title: 'Equity analyst', firmAdmin: false },
  { id: 'u-adam', name: 'Adam Liu', title: 'Equity analyst', firmAdmin: false },
  { id: 'u-alyssa', name: 'Alyssa Romero', title: 'Equity intern', firmAdmin: false },
  { id: 'u-dana', name: 'Dana Whitfield', title: 'Portfolio manager', firmAdmin: false },
  { id: 'u-marcus', name: 'Marcus Hale', title: 'Fixed income lead', firmAdmin: false },
  { id: 'u-kenji', name: 'Kenji Ito', title: 'Compliance officer', firmAdmin: false },
  { id: 'u-ruth', name: 'Ruth Abernathy', title: 'Client service associate', firmAdmin: false },
];

export const db: {
  users: User[];
  teams: Team[];
  models: Model[];
  access: Record<string, ModelAccess>;
  log: AccessLogEntry[];
} = {
  users,
  teams: [
    {
      id: 't-firm',
      name: 'Everyone at Hartwell & Lowe',
      firmWide: true,
      defaultRank: 'none',
      usedIn: 14,
      members: [
        { userId: 'u-priya', rank: 'admin' },
        { userId: 'u-sarah', rank: 'regular' },
        { userId: 'u-john', rank: 'limited' },
        { userId: 'u-adam', rank: 'limited' },
        { userId: 'u-alyssa' },
        { userId: 'u-dana', rank: 'regular' },
        { userId: 'u-marcus', rank: 'regular' },
        { userId: 'u-kenji', rank: 'limited' },
        { userId: 'u-ruth' },
      ],
    },
    {
      id: 't-equity',
      name: 'Equity strategies',
      firmWide: false,
      defaultRank: 'power',
      usedIn: 6,
      members: [
        { userId: 'u-sarah', rank: 'admin' },
        { userId: 'u-john' },
        { userId: 'u-adam' },
        { userId: 'u-alyssa', rank: 'limited' },
        { userId: 'u-dana' },
      ],
    },
    {
      id: 't-fixed',
      name: 'Fixed income',
      firmWide: false,
      defaultRank: 'regular',
      usedIn: 4,
      members: [{ userId: 'u-marcus', rank: 'admin' }, { userId: 'u-dana', rank: 'power' }, { userId: 'u-ruth', rank: 'limited' }],
    },
    {
      id: 't-compliance',
      name: 'Compliance',
      firmWide: false,
      defaultRank: 'limited',
      usedIn: 9,
      members: [{ userId: 'u-kenji', rank: 'admin' }],
    },
  ],
  models: [
    {
      id: 'm-uslcc',
      name: 'US Large Cap Core',
      type: 'security-weight',
      path: ['Firm', 'Equity strategies', 'Core models'],
    },
  ],
  access: {
    'm-uslcc': {
      modelId: 'm-uslcc',
      inherited: [{ teamId: 't-equity', folder: 'Equity strategies' }],
      direct: ['t-compliance'],
      version: 3,
    },
  },
  log: [
    { id: 'log-1', modelId: 'm-uslcc', at: '2026-09-14T15:02:00Z', userId: 'u-priya', changes: ['Gave Compliance access'] },
    {
      id: 'log-2',
      modelId: 'm-uslcc',
      at: '2026-10-02T13:40:00Z',
      userId: 'u-sarah',
      changes: ['Equity strategies: Alyssa Romero from team default (Power user) to Limited user'],
    },
  ],
};
