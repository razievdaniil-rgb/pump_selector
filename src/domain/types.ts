export type SelectionMode = 'qh' | 'model' | 'purpose' | 'assistant';
export type SelectorScreen = 'start' | 'purpose' | 'model' | 'parameters' | 'results' | 'curves';
export type ResultLevel = 'recommended' | 'suitable' | 'possible' | 'excluded';
export type ResultTab = ResultLevel;
export type SortMode = 'score' | 'power' | 'name';
export interface SelectionContext { q:number; h:number; pumpType:string; fluid:string; temperature:number; density:number; viscosity:number; dn:string; pn:string; material:string; seal:string; }
export interface PumpResult { id:string; name:string; article:string; pumpType:string; score:number; level:ResultLevel; minQ:number; minH:number; maxQ:number; maxH:number; power:number; efficiency:number; dn:string; reasons:string[]; exclusionReason?:string; }
export interface PurposePreset { id:string; object:string; medium:string; label:string; description:string; context:Partial<SelectionContext>; }
