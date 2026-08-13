import { useMemo, useRef, useState } from "react";
import {
  buildCurveSeries,
  calculateNpsha,
  curveLabels,
  findBep,
  findIntersection,
  interpolate,
  type CurveKey,
} from "../domain/curveEngine";
import type { PumpResult, SelectionContext } from "../domain/types";
import { EngineeringChart } from "./EngineeringChart";
import { Icon } from "./Icon";

type ToolPanel =
  "point" | "system" | "regulation" | "fluid" | "parallel" | null;
type DutyPoint = { id: string; q: number; h: number; label: string };

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
    .slice(0, 3);
  const [visible, setVisible] = useState<string[]>(
    candidates[0] ? [candidates[0].id] : [],
  );
  const [layers, setLayers] = useState<CurveKey[]>([
    "qh",
    "eff",
    "npsh",
    "power",
  ]);
  const [showZone, setShowZone] = useState(true);
  const [layout, setLayout] = useState<"combined" | "split">("combined");
  const [pointer, setPointer] = useState(true);
  const [panel, setPanel] = useState<ToolPanel>(null);
  const [frequency, setFrequency] = useState(50);
  const [impellerPercent, setImpellerPercent] = useState(100);
  const [density, setDensity] = useState(context.density || 998);
  const [viscosity, setViscosity] = useState(context.viscosity || 1);
  const [parallel, setParallel] = useState(1);
  const [reserve, setReserve] = useState(0);
  const [staticHead, setStaticHead] = useState(8);
  const [dutyPoints, setDutyPoints] = useState<DutyPoint[]>([
    { id: "duty-1", q: context.q, h: context.h, label: "Рабочая точка" },
  ]);
  const [newPoint, setNewPoint] = useState({ q: context.q, h: context.h });
  const [npsh, setNpsh] = useState({
    atmosphericPressure: 101.3,
    suctionHeight: 1.5,
    losses: 0.8,
    vaporHead: 0.25,
    reserve: 0.5,
  });
  const chartRef = useRef<HTMLElement>(null);
  const selected = useMemo(
    () => candidates.filter((pump) => visible.includes(pump.id)),
    [candidates, visible],
  );
  const series = useMemo(
    () =>
      buildCurveSeries(selected, ["qh", "eff", "npsh", "power"], {
        frequency,
        impellerPercent,
        viscosity,
        density,
        parallel,
      }),
    [selected, frequency, impellerPercent, viscosity, density, parallel],
  );
  const primaryQh = series.find((item) => item.type === "qh");
  const primaryEff = series.find((item) => item.type === "eff");
  const primaryPower = series.find((item) => item.type === "power");
  const primaryNpsh = series.find((item) => item.type === "npsh");
  const bep = primaryEff ? findBep(primaryEff.points) : undefined;
  const intersection =
    primaryQh && dutyPoints[0]
      ? findIntersection(
          primaryQh.points,
          dutyPoints[0].q,
          dutyPoints[0].h,
          staticHead,
        )
      : undefined;
  const npsha = calculateNpsha({ ...npsh, density });
  const activePoint = dutyPoints[0];
  const efficiencyAtPoint =
    primaryEff && activePoint
      ? interpolate(primaryEff.points, activePoint.q)
      : 0;
  const powerAtPoint =
    primaryPower && activePoint
      ? interpolate(primaryPower.points, activePoint.q)
      : 0;
  const npshrAtPoint =
    primaryNpsh && activePoint
      ? interpolate(primaryNpsh.points, activePoint.q)
      : 0;
  const npshReserve = npsha - npshrAtPoint;
  const toggleLayer = (key: CurveKey) =>
    setLayers((current) =>
      current.includes(key)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== key)
        : [...current, key],
    );
  const openPanel = (value: ToolPanel) =>
    setPanel((current) => (current === value ? null : value));

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
          onClick={() => chartRef.current?.requestFullscreen?.()}
        >
          ⛶ На весь экран
        </button>
      </header>

      <section className="curve-toolbar card">
        <div className="curve-mode-tabs">
          {(Object.keys(curveLabels) as CurveKey[]).map((key) => (
            <button
              key={key}
              className={layers.includes(key) ? "active" : ""}
              onClick={() => toggleLayer(key)}
            >
              <i style={{ background: curveLabels[key].color }} />
              {curveLabels[key].label}
            </button>
          ))}
          <button
            className={showZone ? "active" : ""}
            onClick={() => setShowZone((value) => !value)}
          >
            <i className="zone-chip" />
            Раб. зона
          </button>
        </div>
        <div className="chart-view-tools">
          <button
            className={pointer ? "active" : ""}
            onClick={() => setPointer((value) => !value)}
            title="Показывать значения в любой точке кривой"
          >
            ⌖ Указка
          </button>
          <div className="segmented">
            <button
              className={layout === "combined" ? "active" : ""}
              onClick={() => setLayout("combined")}
            >
              Вместе
            </button>
            <button
              className={layout === "split" ? "active" : ""}
              onClick={() => setLayout("split")}
            >
              Отдельно
            </button>
          </div>
        </div>
      </section>

      <section className="curve-actions card" aria-label="Инструменты расчёта">
        <button
          className={panel === "point" ? "active" : ""}
          onClick={() => openPanel("point")}
        >
          ＋ Рабочая точка
        </button>
        <button
          className={panel === "system" ? "active" : ""}
          onClick={() => openPanel("system")}
        >
          ＋ Параметры системы
        </button>
        <button
          className={panel === "regulation" ? "active" : ""}
          onClick={() => openPanel("regulation")}
        >
          Регулирование
        </button>
        <button
          className={panel === "fluid" ? "active" : ""}
          onClick={() => openPanel("fluid")}
        >
          Рабочая жидкость
        </button>
        <button
          className={panel === "parallel" ? "active" : ""}
          onClick={() => openPanel("parallel")}
        >
          Параллельная работа
        </button>
        <span className="curve-layer-note">
          BEP вычисляется по пику кривой КПД
        </span>
      </section>

      {panel && (
        <section className="curve-config-panel card">
          {panel === "point" && (
            <>
              <div className="config-copy">
                <b>Рабочие точки</b>
                <span>
                  Добавьте альтернативный режим и сравните его со всеми кривыми.
                </span>
              </div>
              <div className="inline-fields">
                <label>
                  Q, м³/ч
                  <input
                    type="number"
                    min="0"
                    value={newPoint.q}
                    onChange={(event) =>
                      setNewPoint({
                        ...newPoint,
                        q: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  H, м
                  <input
                    type="number"
                    min="0"
                    value={newPoint.h}
                    onChange={(event) =>
                      setNewPoint({
                        ...newPoint,
                        h: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <div className="point-actions">
                  <button
                    className="button ghost"
                    onClick={() => {
                      setDutyPoints((current) =>
                        current.map((point, index) =>
                          index === 0 ? { ...point, ...newPoint } : point,
                        ),
                      );
                      onContextChange({ ...context, ...newPoint });
                    }}
                  >
                    Обновить основную
                  </button>
                  <button
                    className="button primary"
                    onClick={() =>
                      setDutyPoints((current) => [
                        ...current,
                        {
                          id: `duty-${Date.now()}`,
                          ...newPoint,
                          label: `Режим ${current.length + 1}`,
                        },
                      ])
                    }
                  >
                    Добавить режим
                  </button>
                </div>
              </div>
              <div className="point-list">
                {dutyPoints.map((point, index) => (
                  <span key={point.id}>
                    <b>{point.label}</b> Q {point.q} · H {point.h}
                    {index > 0 && (
                      <button
                        onClick={() =>
                          setDutyPoints((current) =>
                            current.filter((item) => item.id !== point.id),
                          )
                        }
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </>
          )}
          {panel === "system" && (
            <>
              <div className="config-copy">
                <b>Кривая системы и кавитационный запас</b>
                <span>Задайте статический напор и исходные данные NPSHa.</span>
              </div>
              <div className="config-grid">
                <label>
                  Статический напор Hст, м
                  <input
                    type="number"
                    min="0"
                    value={staticHead}
                    onChange={(event) =>
                      setStaticHead(Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  Атмосферное давление, кПа
                  <input
                    type="number"
                    value={npsh.atmosphericPressure}
                    onChange={(event) =>
                      setNpsh({
                        ...npsh,
                        atmosphericPressure: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Высота всасывания, м
                  <input
                    type="number"
                    value={npsh.suctionHeight}
                    onChange={(event) =>
                      setNpsh({
                        ...npsh,
                        suctionHeight: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Потери Hf, м
                  <input
                    type="number"
                    value={npsh.losses}
                    onChange={(event) =>
                      setNpsh({ ...npsh, losses: Number(event.target.value) })
                    }
                  />
                </label>
                <label>
                  Напор паров Hv, м
                  <input
                    type="number"
                    value={npsh.vaporHead}
                    onChange={(event) =>
                      setNpsh({
                        ...npsh,
                        vaporHead: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Запас Hs, м
                  <input
                    type="number"
                    value={npsh.reserve}
                    onChange={(event) =>
                      setNpsh({ ...npsh, reserve: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
              <div
                className={`calculation-result ${npshReserve >= 0.5 ? "ok" : "warn"}`}
              >
                NPSHa {npsha.toFixed(2)} м · NPSHr {npshrAtPoint.toFixed(2)} м ·
                запас {npshReserve.toFixed(2)} м
              </div>
            </>
          )}
          {panel === "regulation" && (
            <>
              <div className="config-copy">
                <b>Регулирование характеристики</b>
                <span>
                  Частота и обточка пересчитываются по законам подобия.
                </span>
              </div>
              <div className="range-controls">
                <label>
                  <span>
                    Частота двигателя <b>{frequency} Гц</b>
                  </span>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="1"
                    value={frequency}
                    onChange={(event) =>
                      setFrequency(Number(event.target.value))
                    }
                  />
                </label>
                <label>
                  <span>
                    Диаметр рабочего колеса <b>{impellerPercent}%</b>
                  </span>
                  <input
                    type="range"
                    min="70"
                    max="110"
                    step="1"
                    value={impellerPercent}
                    onChange={(event) =>
                      setImpellerPercent(Number(event.target.value))
                    }
                  />
                </label>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setFrequency(50);
                  setImpellerPercent(100);
                }}
              >
                Сбросить регулирование
              </button>
            </>
          )}
          {panel === "fluid" && (
            <>
              <div className="config-copy">
                <b>Смена рабочей жидкости</b>
                <span>
                  Плотность влияет на мощность, вязкость — на Q, H и КПД.
                </span>
              </div>
              <div className="inline-fields">
                <label>
                  Плотность, кг/м³
                  <input
                    type="number"
                    min="600"
                    max="1800"
                    value={density}
                    onChange={(event) => setDensity(Number(event.target.value))}
                  />
                </label>
                <label>
                  Кинематическая вязкость, сСт
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={viscosity}
                    onChange={(event) =>
                      setViscosity(Number(event.target.value))
                    }
                  />
                </label>
                <button
                  className="button primary"
                  onClick={() =>
                    onContextChange({ ...context, density, viscosity })
                  }
                >
                  Применить
                </button>
              </div>
            </>
          )}
          {panel === "parallel" && (
            <>
              <div className="config-copy">
                <b>Параллельная работа насосов</b>
                <span>
                  Суммарная подача масштабируется по числу работающих агрегатов.
                </span>
              </div>
              <div className="inline-fields">
                <label>
                  Работает насосов
                  <select
                    value={parallel}
                    onChange={(event) =>
                      setParallel(Number(event.target.value))
                    }
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </label>
                <label>
                  Резерв
                  <select
                    value={reserve}
                    onChange={(event) => setReserve(Number(event.target.value))}
                  >
                    <option value="0">Нет</option>
                    <option value="1">1 насос</option>
                    <option value="2">2 насоса</option>
                  </select>
                </label>
                <div className="parallel-summary">
                  <b>
                    {parallel} рабочих + {reserve} резерв
                  </b>
                  <span>
                    Расчётная подача до{" "}
                    {Math.round(primaryQh?.points.at(-1)?.q ?? 0)} м³/ч
                  </span>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <section className="curve-models card">
        <div className="panel-title">
          Модели на графике{" "}
          <span className="counter muted-counter">{selected.length}</span>
        </div>
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
            Сейчас используются расчётные мок-кривые. При интеграции источник
            заменяется на <b>PMP_CURVES_JSON</b> без изменения интерфейса.
          </span>
        </div>
      </section>

      <section className="curve-canvas card" ref={chartRef}>
        <div className="curve-canvas-heading">
          <div>
            <h2>
              Гидравлические характеристики ·{" "}
              {selected[0]?.name ?? "модель не выбрана"}
            </h2>
            <p>
              {selected.length} {selected.length === 1 ? "модель" : "модели"} ·{" "}
              {frequency} Гц · колесо {impellerPercent}% · {parallel} насос(а)
            </p>
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
            <span>
              <i className="legend-system" />
              Кривая системы
            </span>
          </div>
        </div>
        {layout === "combined" ? (
          <EngineeringChart
            series={series}
            layers={layers}
            dutyPoints={dutyPoints}
            staticHead={staticHead}
            bep={bep}
            showZone={showZone}
            pointer={pointer}
            npsha={npsha}
          />
        ) : (
          <div className="split-charts">
            {layers.map((layer) => (
              <div key={layer} className="split-chart">
                <h3>
                  {curveLabels[layer].label}{" "}
                  <span>{curveLabels[layer].unit}</span>
                </h3>
                <EngineeringChart
                  compact
                  series={series}
                  layers={[layer]}
                  dutyPoints={layer === "qh" ? dutyPoints : []}
                  staticHead={staticHead}
                  bep={bep}
                  showZone={showZone}
                  pointer={pointer}
                  npsha={npsha}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="curve-values card">
        <div>
          <span>Заданная точка</span>
          <b>
            Q {activePoint?.q} / H {activePoint?.h}
          </b>
          <small>м³/ч · м</small>
        </div>
        <div>
          <span>Расчётная точка</span>
          <b>
            Q {intersection?.q.toFixed(1) ?? "—"} / H{" "}
            {intersection?.h.toFixed(1) ?? "—"}
          </b>
          <small>пересечение с системой</small>
        </div>
        <div>
          <span>КПД в точке</span>
          <b>{efficiencyAtPoint.toFixed(1)}%</b>
          <small>BEP при Q {bep?.q.toFixed(1) ?? "—"}</small>
        </div>
        <div>
          <span>Мощность</span>
          <b>{powerAtPoint.toFixed(2)} кВт</b>
          <small>
            {frequency} Гц · ρ {density} кг/м³
          </small>
        </div>
        <div>
          <span>NPSH запас</span>
          <b className={npshReserve >= 0.5 ? "value-ok" : "value-warn"}>
            {npshReserve >= 0 ? "+" : ""}
            {npshReserve.toFixed(2)} м
          </b>
          <small>
            {npshReserve >= 0.5 ? "достаточный" : "требует внимания"}
          </small>
        </div>
      </section>
    </main>
  );
}
