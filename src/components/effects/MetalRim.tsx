import {useEffect,useState} from "react";
import {MetalFx} from "metal-fx";
import type {DeckQuality} from "@/services/deckTheme";
// MengTo liquid-metal-border: one host, explicit radius, preserve static fallback,
// no reflections or halo, freeze after the reveal. The CSS mask also excludes the center.
export default function MetalRim({level,active,quality}:{level:number;active:boolean;quality:DeckQuality}){
 const [paused,setPaused]=useState(false);
 useEffect(()=>{setPaused(false);if(!active)return;const t=window.setTimeout(()=>setPaused(true),1800);return()=>window.clearTimeout(t)},[active,level,quality]);
 if(level===0||quality==="off"||!active)return null;
 return <div className="metal-rim-mask" aria-hidden="true" data-testid="metal-rim">
 <MetalFx variant="button" preset="gold" theme={level===3?"dark":"light"} strength={(quality==="low"?.55:.88)} borderRadius={17} ringCssPx={[0,2,3,5][level]} shaderScale={1.45} disableGlow normalizeHostStyles={false} paused={paused} className="metal-rim-host" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
 <div className="metal-rim-target" />
 </MetalFx></div>
}
