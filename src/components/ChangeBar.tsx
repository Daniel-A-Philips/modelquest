interface Props {
  changes: string[];
  warnings: string[];
  losesAccess: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  onSave: () => void;
  onDiscard: () => void;
}

export function ChangeBar({ changes, warnings, losesAccess, saving, error, notice, onSave, onDiscard }: Props) {
  if (changes.length === 0 && !notice) return null;
  return (
    <div class="changebar" role="region" aria-label="Unsaved changes">
      <div class="changebar-inner">
        {changes.length === 0 ? (
          <p class="notice" role="status">
            {notice}
          </p>
        ) : (
          <>
            <details class="change-list">
              <summary>
                {changes.length} unsaved {changes.length === 1 ? 'change' : 'changes'}
              </summary>
              <ul>
                {changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </details>
            <div class="actions">
              <button type="button" class="btn btn-quiet" onClick={onDiscard} disabled={saving}>
                Discard
              </button>
              <button type="button" class="btn btn-primary" onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : losesAccess ? 'Save and give up access' : 'Save changes'}
              </button>
            </div>
            {warnings.map((w, i) => (
              <p key={i} class="warning">
                {w}
              </p>
            ))}
            {error && (
              <p class="error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
