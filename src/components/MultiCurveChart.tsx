import type { PumpResult, SelectionContext } from "../domain/types";
export function MultiCurveChart({
  context,
  pumps,
  layers,
}: {
  context: SelectionContext;
  pumps: PumpResult[];
  layers: string[];
}) {
  const pump = pumps[0],
    px = 62 + (Math.min(context.q, 100) / 100) * 566,
    py = 280 - (Math.min(context.h, 100) / 100) * 230;
  return (
    <div className="embedded-chart multi-chart">
      <div className="chart-legend">
        <span className="legend-stroke qh" />
        Q-H <span className="legend-stroke eff" />
        {"\u041a\u041f\u0414"} <span className="legend-stroke npsh" />
        NPSH <span className="legend-stroke power" />
        P2 <span className="zone-box" />
        {
          "\u0420\u0430\u0431\u043e\u0447\u0430\u044f \u0437\u043e\u043d\u0430"
        }{" "}
        <span className="point-dot" />
        {
          "\u0420\u0430\u0431\u043e\u0447\u0430\u044f \u0442\u043e\u0447\u043a\u0430"
        }
      </div>
      <svg
        className="qh-chart"
        viewBox="0 0 680 330"
        role="img"
        aria-label={
          "\u0413\u0440\u0430\u0444\u0438\u043a \u0438\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u044b\u0445 \u043a\u0440\u0438\u0432\u044b\u0445"
        }
      >
        <g className="grid-lines">
          <path d="M62 36V280M156 36V280M250 36V280M344 36V280M438 36V280M532 36V280M628 36V280" />
          <path d="M62 36H628M62 97H628M62 158H628M62 219H628M62 280H628" />
        </g>
        <rect
          className="chart-zone"
          x={Math.max(62, px - 48)}
          y="36"
          width="96"
          height="244"
        />
        {layers.includes("qh") && (
          <path
            className="metric-curve metric-qh"
            d="M62 58 C215 62 445 128 628 230"
          />
        )}
        {layers.includes("eff") && (
          <path
            className="metric-curve metric-eff"
            d="M62 250 C190 175 330 88 450 118 C535 138 590 190 628 238"
          />
        )}
        {layers.includes("npsh") && (
          <path
            className="metric-curve metric-npsh"
            d="M62 264 C230 274 430 245 628 118"
          />
        )}
        {layers.includes("power") && (
          <path
            className="metric-curve metric-power"
            d="M62 238 C225 220 432 154 628 76"
          />
        )}
        <path className="system-curve" d={`M62 275 Q${px} ${py} 628 62`} />
        <path className="bep-line" d={`M${px} 36V280`} />
        <circle className="work-point" cx={px} cy={py} r="8" />
        <g className="axis-labels">
          <text x="22" y="40">
            {"H, \u043c"}
          </text>
          <text x="592" y="315">
            {"Q, \u043c\u00b3/\u0447"}
          </text>
          {[0, 20, 40, 60, 80, 100].map((value, index) => (
            <text key={value} x={55 + index * 94} y="303">
              {value}
            </text>
          ))}
        </g>
        <g
          className="point-label"
          transform={`translate(${Math.min(476, px + 13)} ${Math.max(64, py - 48)})`}
        >
          <rect width="150" height="70" rx="8" />
          <text x="12" y="20">
            {
              "\u0420\u0430\u0431\u043e\u0447\u0430\u044f \u0442\u043e\u0447\u043a\u0430"
            }
          </text>
          <text x="12" y="40">
            Q {context.q} {"\u00b7"} H {context.h}
          </text>
          <text x="12" y="58">
            {"\u041a\u041f\u0414"} {pump?.efficiency ?? "\u2014"}%
          </text>
        </g>
      </svg>
    </div>
  );
}
