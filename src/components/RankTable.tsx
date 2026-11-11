import { CAPABILITIES, RANKS } from '../permissions';
import { RankLadder } from './RankLadder';

export function RankTable() {
  const ranks = RANKS.filter((r) => r.level > 0);
  return (
    <section class="rank-table" aria-labelledby="rank-table-title">
      <h2 id="rank-table-title">What each rank can do</h2>
      <p class="hint">People in several teams get their highest rank.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">
              <span class="sr-only">Permission</span>
            </th>
            {ranks.map((r) => (
              <th key={r.id} scope="col" title={r.label}>
                <RankLadder rank={r.id} />
                <span>{r.short}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CAPABILITIES.map((c) => (
            <tr key={c.id}>
              <th scope="row">{c.label}</th>
              {ranks.map((r) => (
                <td key={r.id}>
                  {r.capabilities.includes(c.id) ? (
                    <>
                      <span aria-hidden="true" class="yes">✓</span>
                      <span class="sr-only">Yes</span>
                    </>
                  ) : (
                    <span class="sr-only">No</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
