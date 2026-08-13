import type { PumpResult, SelectionContext } from "../domain/types";
import { CurveWorkspace } from "./CurveWorkspace";

export function SelectionGraph({
  context,
  items,
  onContextChange,
}: {
  context: SelectionContext;
  items: PumpResult[];
  onContextChange: (context: SelectionContext) => void;
}) {
  const hasCurves = items.some((item) => item.level !== "excluded");
  if (!hasCurves) {
    return (
      <section className="selection-graph card">
        <div className="graph-empty" role="status">
          <strong>Нет подходящих кривых для этой рабочей точки</strong>
          <span>
            Измените Q/H или тип насоса — график обновится вместе с
            результатами.
          </span>
        </div>
      </section>
    );
  }
  return (
    <section className="selection-graph unified-selection-graph">
      <div className="graph-heading card">
        <div>
          <span className="graph-eyebrow">Подбор по рабочей точке</span>
          <h2>Характеристики подходящих насосов</h2>
          <p>
            Один график для Q‑H, КПД, NPSH и мощности. Выберите показатель
            вкладкой и при необходимости раскройте инженерные настройки.
          </p>
        </div>
        <div className="duty-badge">
          <span>Рабочая точка</span>
          <b>Q {context.q}</b>
          <i>H {context.h}</i>
        </div>
      </div>
      <CurveWorkspace
        context={context}
        items={items}
        onContextChange={onContextChange}
      />
    </section>
  );
}
