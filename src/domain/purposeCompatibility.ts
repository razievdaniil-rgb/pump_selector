const types = {
  inline: "Центробежный In-Line",
  console: "Консольный",
  submersible: "Погружной",
  sewage: "Канализационный",
  multistage: "Многоступенчатый",
} as const;

const compatibility: Record<string, string[]> = {
  "boiler-hot-water": [types.inline, types.console, types.multistage],
  "water-supply": [types.multistage, types.console, types.submersible],
  drainage: [types.submersible, types.sewage],
  sewage: [types.sewage, types.submersible],
};

export function getPurposePumpTypes(purposeId: string): string[] {
  return compatibility[purposeId] ?? [];
}

export function isPumpTypeAllowed(
  pumpType: string,
  allowedPumpTypes: string[] | null,
): boolean {
  return !allowedPumpTypes || allowedPumpTypes.includes(pumpType);
}
