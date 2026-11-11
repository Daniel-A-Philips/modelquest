import type { AccessLogEntry, User } from '../types';

export function ActivityLog({ entries, users }: { entries: AccessLogEntry[]; users: User[] }) {
  if (entries.length === 0) {
    return <p class="empty">No access changes yet. Saved changes show up here with who made them.</p>;
  }
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown user';
  return (
    <ol class="log" aria-label="Access changes, newest first">
      {entries.map((e) => (
        <li key={e.id}>
          <div class="log-head">
            <strong>{name(e.userId)}</strong>
            <time dateTime={e.at}>
              {new Date(e.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </time>
          </div>
          <ul>
            {e.changes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
