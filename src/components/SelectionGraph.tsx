import type { PumpResult, SelectionContext } from '../domain/types';
import { CurveWorkspace } from './CurveWorkspace';

export function SelectionGraph({ context, items, onContextChange }: { context: SelectionContext; items: PumpResult[]; onContextChange: (context: SelectionContext) => void }) {
  const hasCurves = items.some((item) => item.level !== 'excluded');
  if (!hasCurves) return <section className="selection-graph card"><div className="graph-empty" role="status"><strong>Нет подходящих кривых для этой рабочей точки</strong><span>Измените Q/H, DN или тип насоса — график обновится вместе с результатами.</span></div></section>;
  return <section className="selection-graph unified-selection-graph"><CurveWorkspace context={context} items={items} onContextChange={onContextChange} /></section>;
}