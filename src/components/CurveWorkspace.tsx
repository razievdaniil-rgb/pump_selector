import { useMemo, useState } from "react";
import type { PumpResult, SelectionContext } from "../domain/types";
import { Icon } from "./Icon";

type CurveType = "QH" | "EFF" | "NPSH" | "POWER";
const curveMeta: Record<
  CurveType,
  { label: string; color: string; unit: string }
> = {
  QH: { label: "Q-H", color: "#2f6fed", unit: "м" },
  EFF: { label: "КПД", color: "#35a267", unit: "%" },
  NPSH: { label: "NPSH", color: "#d98b32", unit: "м" },
  POWER: { label: "Мощность", color: "#8b5bb5", unit: "кВт" },
};

function pathFor(type: CurveType, index: number) {
  if (type === "QH")
    return `M80 ${92 + index * 15} C260 ${98 + index * 8} 560 ${174 + index * 18} 850 ${330 + index * 27}`;
  if (type === "EFF")
    return `M80 355 C270 ${265 - index * 8} 480 ${155 - index * 5} 680 ${205 + index * 10} C760 ${228 + index * 8} 815 ${270 + index * 7} 850 ${310 + index * 8}`;
  if (type === "NPSH")
    return `M80 ${354 - index * 4} C330 ${365 - index * 3} 620 ${315 - index * 6} 850 ${168 - index * 8}`;
  return `M80 ${330 - index * 5} C320 ${290 - index * 5} 610 ${205 - index * 9} 850 ${115 - index * 12}`;
}

export function CurveWorkspace({
  context,
  items,
  onBack,
  onContextChange,
}: {
  context: SelectionContext;
  items: PumpResult[];
  onBack: () => void;
  onContextChange: (context: SelectionContext) => void;
}) {
  const candidates = items
      .filter((item) => item.level !== "excluded")
      .slice(0, 3),
    [visible, setVisible] = useState<string[]>(
      candidates.length ? [candidates[0].id] : [],
    ),
    [types, setTypes] = useState<CurveType[]>(["QH", "EFF", "NPSH", "POWER"]),
    [combined, setCombined] = useState(true),
    [editing, setEditing] = useState(false);
  const shownTypes = combined
      ? (["QH", "EFF", "NPSH", "POWER"] as CurveType[])
      : types,
    px = 80 + (Math.min(context.q, 100) / 100) * 770,
    py = 370 - (Math.min(context.h, 120) / 120) * 300,
    bepQ = 32.4,
    bepX = 80 + (bepQ / 100) * 770;
  const selected = useMemo(
    () => candidates.filter((item) => visible.includes(item.id)),
    [candidates, visible],
  );
  const toggleType = (type: CurveType) => {
    setCombined(false);
    setTypes((current) =>
      current.includes(type)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== type)
        : [...current, type],
    );
  };
  return (
    <main className="curve-workspace">
      <header className="curve-screen-header">
        <button className="back-link" onClick={onBack}>
          <Icon name="back" size={17} />К результатам подбора
        </button>
        <div>
          <span className="graph-eyebrow">Инженерные характеристики</span>
          <h1>Кривые и рабочая точка</h1>
          <p>
            {context.pumpType} · {context.fluid} · {context.temperature} °C
          </p>
        </div>
        <button
          className="button ghost curve-fullscreen"
          onClick={() => document.documentElement.requestFullscreen?.()}
        >
          <span>⛶</span> На весь экран
        </button>
      </header>
      <section className="curve-toolbar card">
        <div className="curve-mode-tabs">
          {(Object.keys(curveMeta) as CurveType[]).map((type) => (
            <button
              key={type}
              className={shownTypes.includes(type) ? "active" : ""}
              onClick={() => toggleType(type)}
            >
              <i style={{ background: curveMeta[type].color }} />
              {curveMeta[type].label}
            </button>
          ))}
          <button
            className={combined ? "active combined" : ""}
            onClick={() => setCombined((value) => !value)}
          >
            Все кривые
          </button>
        </div>
        <div className="curve-context-control">
          <span>Рабочая точка</span>
          {editing ? (
            <>
              <label>
                Q{" "}
                <input
                  autoFocus
                  type="number"
                  value={context.q}
                  onChange={(event) =>
                    onContextChange({
                      ...context,
                      q: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                H{" "}
                <input
                  type="number"
                  value={context.h}
                  onChange={(event) =>
                    onContextChange({
                      ...context,
                      h: Number(event.target.value),
                    })
                  }
                />
              </label>
              <button onClick={() => setEditing(false)}>Готово</button>
            </>
          ) : (
            <>
              <b>Q {context.q} м³/ч</b>
              <b>H {context.h} м</b>
              <button onClick={() => setEditing(true)}>Изменить</button>
            </>
          )}
        </div>
      </section>
      <div className="curve-layout">
        <section
          className="curve-actions card"
          aria-label="??????????? ???????"
        >
          <button type="button">+ ???????? ??????</button>
          <button type="button">+ ???????? ?????????</button>
          <button type="button">
            ????????????? <span>?</span>
          </button>
          <button type="button">????? ??????? ????????</button>
          <span className="curve-layer-note">
            ??????? ???? ? BEP ? ????????? ??????
          </span>
        </section>
        <aside className="curve-models card">
          <div className="panel-title">
            Модели на графике{" "}
            <span className="counter muted-counter">{selected.length}</span>
          </div>
          <p>Оставьте до трёх кривых для сравнения.</p>
          {candidates.map((pump, index) => (
            <label className="curve-model" key={pump.id}>
              <input
                type="checkbox"
                checked={visible.includes(pump.id)}
                onChange={() =>
                  setVisible((current) =>
                    current.includes(pump.id)
                      ? current.length === 1
                        ? current
                        : current.filter((id) => id !== pump.id)
                      : [...current, pump.id],
                  )
                }
              />
              <i className={`model-color color-${index}`} />
              <span>
                <b>{pump.name}</b>
                <small>{pump.article}</small>
              </span>
              <em>{pump.score}%</em>
            </label>
          ))}
          <div className="curve-hint">
            <Icon name="help" size={16} />
            <span>
              Числовые точки подключаются из <b>PMP_CURVES_JSON</b>. Сейчас
              экран работает на демонстрационных кривых.
            </span>
          </div>
        </aside>
        <section className="curve-canvas card">
          <div className="curve-canvas-heading">
            <div>
              <h2>Гидравлические характеристики</h2>
              <p>{selected.length} модели · Q от 0 до 100 м³/ч</p>
            </div>
            <div className="canvas-legend">
              <span>
                <i className="legend-zone" />
                Допустимая зона
              </span>
              <span>
                <i className="legend-bep" />
                BEP
              </span>
              <span>
                <i className="legend-point" />
                Рабочая точка
              </span>
            </div>
          </div>
          <svg
            viewBox="0 0 930 440"
            className="engineering-chart"
            role="img"
            aria-label="Детальный график инженерных кривых"
          >
            <g className="engineering-grid">
              <path d="M80 50V370M234 50V370M388 50V370M542 50V370M696 50V370M850 50V370" />
              <path d="M80 50H850M80 114H850M80 178H850M80 242H850M80 306H850M80 370H850" />
            </g>
            <rect
              className="engineering-zone"
              x={bepX - 58}
              y="50"
              width="116"
              height="320"
            />
            <path className="engineering-bep" d={`M${bepX} 50V370`} />
            {shownTypes.flatMap((type) =>
              selected.map((pump, index) => (
                <path
                  key={`${type}-${pump.id}`}
                  className={`engineering-curve model-${index} curve-type-${type.toLowerCase()}`}
                  style={{
                    stroke: combined ? curveMeta[type].color : undefined,
                  }}
                  d={pathFor(type, index)}
                />
              )),
            )}
            <path className="required-head" d={`M80 365 Q${px} ${py} 850 70`} />
            <circle className="engineering-point" cx={px} cy={py} r="9" />
            <g
              className="engineering-tooltip"
              transform={`translate(${Math.min(700, px + 16)} ${Math.max(70, py - 62)})`}
            >
              <rect width="150" height="74" rx="9" />
              <text x="14" y="23">
                Рабочая точка
              </text>
              <text x="14" y="45">
                Q {context.q} м³/ч · H {context.h} м
              </text>
              <text x="14" y="63">
                КПД {selected[0]?.efficiency ?? 0}%
              </text>
            </g>
            <g className="engineering-axis">
              <text x="30" y="55">
                H, м
              </text>
              <text x="810" y="415">
                Q, м³/ч
              </text>
              {[0, 20, 40, 60, 80, 100].map((value, index) => (
                <text key={value} x={72 + index * 154} y="397">
                  {value}
                </text>
              ))}
              {[120, 96, 72, 48, 24, 0].map((value, index) => (
                <text key={value} x="48" y={55 + index * 64}>
                  {value}
                </text>
              ))}
            </g>
            <text className="bep-label" x={bepX + 7} y="70">
              BEP {bepQ}
            </text>
          </svg>
        </section>
      </div>
      <section className="curve-values card">
        <div>
          <span>Рабочая точка</span>
          <b>
            Q {context.q} / H {context.h}
          </b>
          <small>м³/ч · м</small>
        </div>
        <div>
          <span>КПД в точке</span>
          <b>{selected[0]?.efficiency ?? "—"}%</b>
          <small>BEP около {bepQ} м³/ч</small>
        </div>
        <div>
          <span>Мощность</span>
          <b>{selected[0]?.power ?? "—"} кВт</b>
          <small>для выбранной модели</small>
        </div>
        <div>
          <span>NPSH запас</span>
          <b>+1,2 м</b>
          <small>достаточный</small>
        </div>
        <div>
          <span>Положение точки</span>
          <b className="value-ok">В допустимой зоне</b>
          <small>отклонение от BEP +0%</small>
        </div>
      </section>
    </main>
  );
}
