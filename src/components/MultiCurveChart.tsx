import { useMemo } from "react";
import {
  buildCurveSeries,
  findBep,
  type CurveKey,
} from "../domain/curveEngine";
import type { PumpResult, SelectionContext } from "../domain/types";
import { EngineeringChart } from "./EngineeringChart";

export function MultiCurveChart({
  context,
  pumps,
  layers,
}: {
  context: SelectionContext;
  pumps: PumpResult[];
  layers: string[];
}) {
  const activeLayers = layers as CurveKey[];
  const series = useMemo(
    () =>
      buildCurveSeries(pumps, ["qh", "eff", "npsh", "power"], {
        frequency: 50,
        impellerPercent: 100,
        viscosity: context.viscosity,
        density: context.density,
        parallel: 1,
      }),
    [pumps, context.viscosity, context.density],
  );
  const efficiency = series.find((item) => item.type === "eff");
  const bep = efficiency ? findBep(efficiency.points) : undefined;
  return (
    <div className="embedded-chart multi-chart calculated-preview">
      <div className="preview-model-legend">
        {pumps.map((pump, index) => (
          <span key={pump.id}>
            <i className={`preview-color color-${index}`} />
            {pump.name}
          </span>
        ))}
      </div>
      <EngineeringChart
        compact
        series={series}
        layers={activeLayers}
        dutyPoints={[
          { id: "context", q: context.q, h: context.h, label: "Рабочая точка" },
        ]}
        staticHead={0}
        bep={bep}
        showZone
        pointer={false}
      />
    </div>
  );
}
