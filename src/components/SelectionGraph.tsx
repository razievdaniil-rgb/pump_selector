import { useState } from "react";
import type { PumpResult, SelectionContext } from "../domain/types";
import { MultiCurveChart } from "./MultiCurveChart";

export function SelectionGraph({
  context,
  items,
  onOpen,
}: {
  context: SelectionContext;
  items: PumpResult[];
  onOpen: () => void;
}) {
  const pumps = items.filter((item) => item.level !== "excluded").slice(0, 3);
  const [layers, setLayers] = useState(["qh", "eff", "npsh", "power"]);
  const hasCurves = pumps.length > 0;

  return (
    <section className="selection-graph card">
      <div className="graph-heading">
        <div>
          <span className="graph-eyebrow">Подбор по рабочей точке</span>
          <h2>Q-H кривые подходящих насосов</h2>
          <p>
            Сравниваем точку Q {context.q} м³/ч · H {context.h} м с рабочими
            диапазонами выбранного типа.
          </p>
        </div>
        <div className="duty-badge">
          <span>Рабочая точка</span>
          <b>Q {context.q}</b>
          <i>H {context.h}</i>
        </div>
      </div>

      {hasCurves ? (
        <>
          <div className="curve-tabs">
            <div className="live-curve-tabs">
              {[
                ["qh", "Q-H"],
                ["eff", "КПД"],
                ["npsh", "NPSH"],
                ["power", "P2"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={layers.includes(id)}
                  className={layers.includes(id) ? `active layer-${id}` : ""}
                  onClick={() =>
                    setLayers((current) =>
                      current.includes(id)
                        ? current.length === 1
                          ? current
                          : current.filter((item) => item !== id)
                        : [...current, id],
                    )
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <MultiCurveChart context={context} pumps={pumps} layers={layers} />
          <button className="open-curve-workspace" onClick={onOpen}>
            Открыть детальный экран кривых →
          </button>
        </>
      ) : (
        <div className="graph-empty" role="status">
          <strong>Нет подходящих кривых для этой рабочей точки</strong>
          <span>
            Измените Q/H или тип насоса — график обновится вместе с
            результатами.
          </span>
        </div>
      )}
    </section>
  );
}
