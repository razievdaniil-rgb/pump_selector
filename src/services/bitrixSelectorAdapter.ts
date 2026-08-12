import type { SelectionContext } from '../domain/types';

export interface BitrixSelectorPayload {
  context?: Partial<SelectionContext>;
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
