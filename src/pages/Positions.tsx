import type { Dataset } from '../lib/sheets';
import { PositionsTable } from '../components/PositionsTable';

export function Positions({ ds, query }: { ds: Dataset; query: string }) {
  return (
    <div className="animate-fade-up">
      <PositionsTable ds={ds} query={query} />
    </div>
  );
}
