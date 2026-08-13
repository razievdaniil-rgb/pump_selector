import type { SelectionContext } from '../domain/types';

export interface BitrixSelectorPayload {
  context?: Partial<SelectionContext>;
  assetsBase?: string;
  endpoints?: { search?: string; product?: string };
}

declare global {
  interface Window {
    APGSPumpSelectorData?: BitrixSelectorPayload;
  }
}

export function readBitrixSelectorPayload(): BitrixSelectorPayload {
  return window.APGSPumpSelectorData ?? {};
}

export function resolveSelectorAsset(fileName: string): string {
  const configuredBase = window.APGSPumpSelectorData?.assetsBase?.replace(/\/$/, '');
  return configuredBase ? `${configuredBase}/${fileName}` : `${import.meta.env.BASE_URL}${fileName}`;
}
