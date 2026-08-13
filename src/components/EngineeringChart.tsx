import { useMemo, useState, type MouseEvent } from "react";
import {
  curveLabels,
  interpolate,
  systemHead,
  type CurveKey,
  type CurvePoint,
  type CurveSeries,
} from "../domain/curveEngine";

type DutyPoint = { id: string; q: number; h: number; label: string };

const W = 1040;
const H = 500;
const P = { left: 70, right: 70, top: 42, bottom: 58 };

export function EngineeringChart({
  series,
  layers,
  dutyPoints,
  staticHead,
  bep,
  showZone,
  pointer,
  npsha,
  compact = false,
}: {
  series: CurveSeries[];
  layers: CurveKey[];
  dutyPoints: DutyPoint[];
  staticHead: number;
  bep?: CurvePoint;
  showZone: boolean;
  pointer: boolean;
  npsha?: number;
  compact?: boolean;
}) {
  const [cursor, setCursor] = useState<{ q: number; x: number } | null>(null);
  const visible = series.filter((item) => layers.includes(item.type));
  const maxima = useMemo(() => {
    const q =
      Math.max(
        10,
        ...visible.flatMap((item) => item.points.map((point) => point.q)),
        ...dutyPoints.map((point) => point.q),
      ) * 1.08;
    const scales = Object.fromEntries(
      (["qh", "eff", "npsh", "power"] as CurveKey[]).map((type) => [
        type,
        Math.max(
          1,
          ...visible
            .filter((item) => item.type === type)
            .flatMap((item) => item.points.map((point) => point.value)),
        ) * 1.12,
      ]),
    ) as Record<CurveKey, number>;
    return { ...scales, q };
  }, [visible, dutyPoints]);
  const x = (q: number) => P.left + (q / maxima.q) * (W - P.left - P.right);
  const y = (value: number, type: CurveKey) =>
    H - P.bottom - (value / maxima[type]) * (H - P.top - P.bottom);
  const path = (points: CurvePoint[], type: CurveKey) =>
    points
      .map(
        (point, index) =>
          `${index ? "L" : "M"}${x(point.q).toFixed(1)} ${y(point.value, type).toFixed(1)}`,
      )
      .join(" ");
  const primaryQh = visible.find((item) => item.type === "qh");
  const systemPath =
    primaryQh && dutyPoints[0]
      ? Array.from({ length: 31 }, (_, index) => {
          const q = (maxima.q * index) / 30;
          return {
            q,
            value: systemHead(q, dutyPoints[0].q, dutyPoints[0].h, staticHead),
          };
        })
      : [];
  const move = (event: MouseEvent<SVGSVGElement>) => {
    if (!pointer) return;
    const box = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - box.left) / box.width) * W;
    const bounded = Math.max(P.left, Math.min(W - P.right, svgX));
    setCursor({
      x: bounded,
      q: ((bounded - P.left) / (W - P.left - P.right)) * maxima.q,
    });
  };
  const tooltipSeries = cursor
    ? visible
        .filter(
          (item) => item.type !== "qh" || item.pumpId === primaryQh?.pumpId,
        )
        .map((item) => ({
          ...item,
          value: interpolate(item.points, cursor.q),
        }))
    : [];
  const zoneStart = bep ? x(bep.q * 0.82) : 0;
  const zoneEnd = bep ? x(bep.q * 1.18) : 0;

  return (
    <div className={`engineering-plot ${compact ? "is-compact" : ""}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="engineering-chart-v2"
        onMouseMove={move}
        onMouseLeave={() => setCursor(null)}
        role="img"
        aria-label="Интерактивный график характеристик насоса"
      >
        <g className="plot-grid">
          {Array.from({ length: 7 }, (_, index) => (
            <line
              key={`v${index}`}
              x1={P.left + (index * (W - P.left - P.right)) / 6}
              x2={P.left + (index * (W - P.left - P.right)) / 6}
              y1={P.top}
              y2={H - P.bottom}
            />
          ))}
          {Array.from({ length: 6 }, (_, index) => (
            <line
              key={`h${index}`}
              x1={P.left}
              x2={W - P.right}
              y1={P.top + (index * (H - P.top - P.bottom)) / 5}
              y2={P.top + (index * (H - P.top - P.bottom)) / 5}
            />
          ))}
        </g>
        {showZone && bep && (
          <rect
            className="plot-zone"
            x={zoneStart}
            y={P.top}
            width={zoneEnd - zoneStart}
            height={H - P.top - P.bottom}
          />
        )}
        {bep && (
          <>
            <line
              className="plot-bep"
              x1={x(bep.q)}
              x2={x(bep.q)}
              y1={P.top}
              y2={H - P.bottom}
            />
            <text className="plot-bep-label" x={x(bep.q) + 8} y={P.top + 18}>
              BEP {bep.q.toFixed(1)}
            </text>
          </>
        )}
        {systemPath.length > 0 && (
          <path className="plot-system" d={path(systemPath, "qh")} />
        )}
        {npsha !== undefined && layers.includes("npsh") && (
          <line
            className="plot-npsha"
            x1={P.left}
            x2={W - P.right}
            y1={y(npsha, "npsh")}
            y2={y(npsha, "npsh")}
          />
        )}
        {visible.map((item) => (
          <path
            key={item.key}
            className={`plot-series plot-${item.type}`}
            style={{
              stroke: item.color,
              strokeDasharray: item.dashed ? "8 6" : undefined,
            }}
            d={path(item.points, item.type)}
          />
        ))}
        {dutyPoints.map((point) => (
          <g key={point.id}>
            <line
              className="duty-guide"
              x1={x(point.q)}
              x2={x(point.q)}
              y1={y(point.h, "qh")}
              y2={H - P.bottom}
            />
            <circle
              className="duty-dot"
              cx={x(point.q)}
              cy={y(point.h, "qh")}
              r="8"
            />
            <text
              className="duty-label"
              x={x(point.q) + 12}
              y={y(point.h, "qh") - 12}
            >
              {point.label}: Q {point.q} · H {point.h}
            </text>
          </g>
        ))}
        <g className="plot-axis">
          {Array.from({ length: 7 }, (_, index) => (
            <text
              key={index}
              x={P.left + (index * (W - P.left - P.right)) / 6}
              y={H - 25}
              textAnchor="middle"
            >
              {Math.round((index * maxima.q) / 6)}
            </text>
          ))}
          <text x={W - P.right} y={H - 5} textAnchor="end">
            Q, м³/ч
          </text>
          <text x="16" y="28">
            Шкалы: H / КПД / NPSH / P2
          </text>
        </g>
        {cursor && (
          <g className="plot-cursor">
            <line x1={cursor.x} x2={cursor.x} y1={P.top} y2={H - P.bottom} />
            <circle
              cx={cursor.x}
              cy={
                primaryQh
                  ? y(interpolate(primaryQh.points, cursor.q), "qh")
                  : P.top
              }
              r="6"
            />
            <g
              transform={`translate(${Math.min(cursor.x + 14, W - 240)} ${P.top + 18})`}
            >
              <rect
                width="220"
                height={44 + tooltipSeries.length * 19}
                rx="10"
              />
              <text x="14" y="22" className="tooltip-title">
                Q {cursor.q.toFixed(1)} м³/ч
              </text>
              {tooltipSeries.map((item, index) => (
                <text
                  key={item.key}
                  x="14"
                  y={43 + index * 19}
                  fill={curveLabels[item.type].color}
                >
                  {curveLabels[item.type].label}: {item.value.toFixed(1)}{" "}
                  {curveLabels[item.type].unit}
                </text>
              ))}
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
