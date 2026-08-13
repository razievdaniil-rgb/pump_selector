import type { PumpResult } from "./types";

export type CurveKey = "qh" | "eff" | "npsh" | "power";
export type CurvePoint = { q: number; value: number };
export type CurveSeries = {
  key: string;
  pumpId: string;
  label: string;
  type: CurveKey;
  color: string;
  points: CurvePoint[];
  dashed?: boolean;
};

export type CurveAdjustments = {
  frequency: number;
  impellerPercent: number;
  viscosity: number;
  density: number;
  parallel: number;
};

export const curveLabels: Record<
  CurveKey,
  { label: string; unit: string; color: string }
> = {
  qh: { label: "Q-H", unit: "м", color: "#2f6fed" },
  eff: { label: "КПД", unit: "%", color: "#15924a" },
  npsh: { label: "NPSH", unit: "м", color: "#d98524" },
  power: { label: "P2 (мощн.)", unit: "кВт", color: "#8758b7" },
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function basePoints(pump: PumpResult, type: CurveKey): CurvePoint[] {
  const count = 17;
  const bepQ = pump.maxQ * 0.58;
  return Array.from({ length: count }, (_, index) => {
    const q = (pump.maxQ * index) / (count - 1);
    const ratio = q / pump.maxQ;
    if (type === "qh") {
      const shutoff = pump.maxH * 1.14;
      return {
        q,
        value: Math.max(0, shutoff - pump.maxH * 0.93 * ratio ** 1.72),
      };
    }
    if (type === "eff") {
      const spread = pump.maxQ * 0.48;
      const value =
        pump.efficiency * Math.max(0.22, 1 - ((q - bepQ) / spread) ** 2);
      return { q, value };
    }
    if (type === "npsh") {
      return { q, value: 1.35 + 0.55 * ratio + 5.2 * ratio ** 2.35 };
    }
    return { q, value: pump.power * (0.58 + 0.48 * ratio + 0.12 * ratio ** 2) };
  });
}

export function buildCurveSeries(
  pumps: PumpResult[],
  types: CurveKey[],
  adjustments: CurveAdjustments,
): CurveSeries[] {
  const frequencyRatio = clamp(adjustments.frequency, 20, 60) / 50;
  const trimRatio = clamp(adjustments.impellerPercent, 70, 110) / 100;
  const hydraulicRatio = frequencyRatio * trimRatio;
  const viscosityPenalty = clamp((adjustments.viscosity - 1) / 220, 0, 0.28);
  const densityRatio = clamp(adjustments.density, 600, 1800) / 1000;

  return pumps.flatMap((pump, pumpIndex) =>
    types.map((type) => ({
      key: `${pump.id}-${type}`,
      pumpId: pump.id,
      label: pump.name,
      type,
      color:
        type === "qh"
          ? (["#2f6fed", "#6b96ef", "#9bb8ee"][pumpIndex] ?? "#2f6fed")
          : curveLabels[type].color,
      points: basePoints(pump, type).map((point) => {
        let q =
          point.q *
          hydraulicRatio *
          Math.max(0.72, 1 - viscosityPenalty * 0.45);
        let value = point.value;
        if (type === "qh")
          value *= hydraulicRatio ** 2 * (1 - viscosityPenalty);
        if (type === "eff") value *= 1 - viscosityPenalty * 0.9;
        if (type === "npsh")
          value *= frequencyRatio ** 2 * (1 + viscosityPenalty * 0.5);
        if (type === "power")
          value *= hydraulicRatio ** 3 * densityRatio * (1 + viscosityPenalty);
        if (type === "qh" && adjustments.parallel > 1)
          q *= adjustments.parallel;
        return { q, value };
      }),
    })),
  );
}

export function interpolate(points: CurvePoint[], q: number) {
  if (!points.length) return 0;
  if (q <= points[0].q) return points[0].value;
  if (q >= points[points.length - 1].q) return points[points.length - 1].value;
  const right = points.findIndex((point) => point.q >= q);
  const a = points[right - 1];
  const b = points[right];
  const ratio = (q - a.q) / (b.q - a.q || 1);
  return a.value + (b.value - a.value) * ratio;
}

export function findBep(efficiency: CurvePoint[]) {
  return efficiency.reduce(
    (best, point) => (point.value > best.value ? point : best),
    efficiency[0],
  );
}

export function systemHead(
  q: number,
  dutyQ: number,
  dutyH: number,
  staticHead: number,
) {
  const coefficient = Math.max(0, dutyH - staticHead) / Math.max(1, dutyQ ** 2);
  return staticHead + coefficient * q ** 2;
}

export function findIntersection(
  qh: CurvePoint[],
  dutyQ: number,
  dutyH: number,
  staticHead: number,
) {
  return qh.reduce(
    (best, point) => {
      const system = systemHead(point.q, dutyQ, dutyH, staticHead);
      const delta = Math.abs(point.value - system);
      return delta < best.delta ? { q: point.q, h: point.value, delta } : best;
    },
    { q: dutyQ, h: dutyH, delta: Number.POSITIVE_INFINITY },
  );
}

export function calculateNpsha({
  atmosphericPressure,
  density,
  suctionHeight,
  losses,
  vaporHead,
  reserve,
}: {
  atmosphericPressure: number;
  density: number;
  suctionHeight: number;
  losses: number;
  vaporHead: number;
  reserve: number;
}) {
  const pressureHead =
    (atmosphericPressure * 1000) / (Math.max(1, density) * 9.80665);
  return pressureHead - suctionHeight - losses - vaporHead - reserve;
}
