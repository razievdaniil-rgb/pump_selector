import { Bot, Box, Check, ChevronDown, CircleHelp, ClipboardList, Droplets, Gauge, GitCompareArrows, Grid2X2, Headphones, Search, ShoppingCart, SlidersHorizontal, Sparkles, Waves, Building2, Flame, ArrowLeft } from 'lucide-react';
const icons={compare:GitCompareArrows,bot:Bot,box:Box,check:Check,down:ChevronDown,help:CircleHelp,spec:ClipboardList,fluid:Droplets,gauge:Gauge,catalog:Grid2X2,engineer:Headphones,search:Search,cart:ShoppingCart,filters:SlidersHorizontal,sparkles:Sparkles,pump:Waves,purpose:Building2,heat:Flame,back:ArrowLeft};
export type IconName=keyof typeof icons;
export function Icon({name,size=18}:{name:IconName;size?:number}){const Component=icons[name];return <Component className="ui-icon" width={size} height={size} strokeWidth={1.8} aria-hidden="true"/>}
