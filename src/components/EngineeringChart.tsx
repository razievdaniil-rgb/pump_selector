import { useId, useMemo, useState, type MouseEvent } from "react";
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
const H = 390;
const P = { left: 70, right: 70, top: 60, bottom: 46 };

export function EngineeringChart({
  series,
  layers,
  dutyPoints,
  staticHead,
  bep,
  showZone,
  pointer,
  singlePointer = false,
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
  singlePointer?: boolean;
  npsha?: number;
  compact?: boolean;
}) {
  const [cursor, setCursor] = useState<{ q: number; x: number } | null>(null);
  const clipId = "engineering-plot-clip-" + useId().replaceAll(":", "");
  const visible = series.filter((item) => layers.includes(item.type));
  const maxima = useMemo(() => {
    const rawQ = Math.max(
      10,
      ...visible.flatMap((item) => item.points.map((point) => point.q)),
      ...dutyPoints.map((point) => point.q),
    );
    const q = Math.ceil(rawQ / 5) * 5;
    const scales = Object.fromEntries(
      (["qh", "eff", "npsh", "power"] as CurveKey[]).map((type) => {
        const dutyValues =
          type === "qh" ? dutyPoints.map((point) => point.h) : [];
        const rawMax = Math.max(
          1,
          ...visible
            .filter((item) => item.type === type)
            .flatMap((item) => item.points.map((point) => point.value)),
          ...dutyValues,
        );
        const step = type === "npsh" || type === "power" ? 1 : 5;
        return [type, Math.ceil(rawMax / step) * step];
      }),
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
  const axisLayer: CurveKey = layers.includes("qh")
    ? "qh"
    : (layers[0] ?? "qh");
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
  const pointerSeries = singlePointer
    ? visible.filter(
        (item) => item.type === "qh" && item.pumpId === primaryQh?.pumpId,
      )
    : visible.filter(
        (item) => item.type !== "qh" || item.pumpId === primaryQh?.pumpId,
      );
  const tooltipSeries = cursor
    ? pointerSeries
        .filter((item) => cursor.q <= (item.points.at(-1)?.q ?? 0))
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
        <defs>
          <clipPath id={clipId}>
            <rect
              x={P.left}
              y={P.top}
              width={W - P.left - P.right}
              height={H - P.top - P.bottom}
            />
          </clipPath>
        </defs>
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
            <text className="plot-bep-label" x={x(bep.q) + 8} y={P.top - 14}>
              BEP {bep.q.toFixed(1)} м³/ч
            </text>
          </>
        )}
        {systemPath.length > 0 && (
          <path className="plot-system" d={path(systemPath, "qh")} clipPath={"url(#" + clipId + ")"} />
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
        {visible.map((item) => {
          const end = item.points.at(-1);
          const typeIndex = visible.filter((curve) => curve.type === item.type).findIndex((curve) => curve.key === item.key);
          const pattern = item.dashed
            ? "5 4"
            : item.type === "eff"
              ? "11 5"
              : item.type === "npsh"
                ? "2 5"
                : item.type === "power"
                  ? "12 4 2 4"
                  : ([undefined, "9 5", "2 5"][typeIndex] as string | undefined);
          const width = item.type === "qh" ? (typeIndex === 0 ? 2.5 : 2) : item.type === "power" ? 2.1 : 1.8;
          return (
            <g key={item.key}>
              <path
                className={`plot-series plot-${item.type}`}
                style={{
                  stroke: item.color,
                  strokeDasharray: pattern,
                  strokeWidth: width,
                }}
                d={path(item.points, item.type)}
              />
              {item.type === "qh" && end && (
                <circle
                  className="curve-endpoint"
                  cx={x(end.q)}
                  cy={y(end.value, item.type)}
                  r="3"
                  style={{ fill: item.color }}
                />
              )}
            </g>
          );
        })}
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
              key={`x-${index}`}
              x={P.left + (index * (W - P.left - P.right)) / 6}
              y={H - 25}
              textAnchor="middle"
            >
              {Math.round((index * maxima.q) / 6)}
            </text>
          ))}
          {Array.from({ length: 6 }, (_, index) => (
            <text
              key={`y-${index}`}
              x={P.left - 12}
              y={P.top + (index * (H - P.top - P.bottom)) / 5 + 4}
              textAnchor="end"
            >
              {((maxima[axisLayer] * (5 - index)) / 5).toFixed(
                axisLayer === "npsh" || axisLayer === "power" ? 1 : 0,
              )}
            </text>
          ))}
          <text x={W - P.right} y={H - 5} textAnchor="end">
            Q, м³/ч
          </text>
          <text
            x={P.left}
            y="24"
            className="axis-primary"
            fill={curveLabels[axisLayer].color}
          >
            {curveLabels[axisLayer].label}, {curveLabels[axisLayer].unit}
          </text>
          {layers
            .filter((layer) => layer !== axisLayer)
            .map((layer, index) => (
              <text
                key={layer}
                x={P.left + 165 + index * 165}
                y="24"
                fill={curveLabels[layer].color}
              >
                {curveLabels[layer].label}: 0–
                {maxima[layer].toFixed(
                  layer === "npsh" || layer === "power" ? 1 : 0,
                )}{" "}
                {curveLabels[layer].unit}
              </text>
            ))}
        </g>
        {cursor && (
          <g className="plot-cursor">
            <line x1={cursor.x} x2={cursor.x} y1={P.top} y2={H - P.bottom} />
            {tooltipSeries.map((item) => (
              <circle
                key={`cursor-${item.key}`}
                cx={cursor.x}
                cy={y(item.value, item.type)}
                r="6"
                style={{ fill: item.color }}
              />
            ))}
            <g
              transform={`translate(${Math.min(cursor.x + 16, W - 310)} ${P.top + 18})`}
            >
              <rect
                width="286"
                height={56 + tooltipSeries.length * 23}
                rx="10"
              />
              <text x="16" y="26" className="tooltip-title">
                Q {cursor.q.toFixed(1)} м³/ч
              </text>
              {tooltipSeries.map((item, index) => (
                <text
                  key={item.key}
                  x="16"
                  y={50 + index * 23}
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
