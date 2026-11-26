import {useEffect,useRef} from "react";
import {createHoloCard,type HoloEffect} from "@kongyo2/cards-css";
import "@kongyo2/cards-css/styles.css";
const foils:HoloEffect[]=["none","metal","prism","gold"];
const colors=["#fff0c8","#eac487","#c48446","#34231f"];
export default function WarmSurface({level,active,quality}:{level:number;active:boolean;quality:"off"|"low"|"high"}){
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=host.current;if(!el||!active||quality==="off"||level===0)return;
 const card=createHoloCard({content:doc=>{const bg=doc.createElement("div");bg.style.cssText="width:100%;height:100%;background:"+colors[level];return bg},effect:foils[level],gyroscope:false,interactive:true,activateOnClick:false,showcase:{delay:80,duration:1100,intensity:7,loop:false,speed:.07},physics:{maxTilt:3,parallax:.35},palette:{preset:"gold",sunpillars:["#fff5ce","#eac18a","#f6d59a","#c38a53","#e9ab78","#fff2d6"],spectrum:["#ffe1a0","#e8b26b","#b76e43","#f5d2ab","#eac080"]},visual:{shineOpacity:quality==="high"?.65:.28,glareOpacity:.18,saturate:.65},textureSeed:1729,aspectRatio:1.55});
 el.appendChild(card.element);
 return()=>{card.destroy();card.element.remove()};
 },[level,active,quality]);
 return <div ref={host} className="warm-foil" aria-hidden="true"/>;
}
