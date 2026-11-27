import {useLayoutEffect,useRef,useState} from "react";
import {material,type ReferenceId} from "./referenceMaterials";
import {ShineBorder} from "./ShineBorder";
import {loadReferencePlate} from "./referenceArt";
export type ArtState="loading"|"ready"|"fallback";
import type {DeckQuality} from "@/services/deckTheme";

// Five horizontal slices preserve the corners AND the center plaque. The
// three vertical slices preserve the top and bottom carved rails. At native
// aspect ratio all bands have identical scale and reconstruct the reference.
function axis(length:number,target:number,cuts:number[],scale:number,elastic:number[]){
 const src=[0,...cuts.map(x=>length*x),length];
 const widths=src.slice(1).map((v,i)=>v-src[i]);
 const fixed=widths.reduce((sum,v,i)=>sum+(elastic.includes(i)?0:v*scale),0);
 const flex=widths.reduce((sum,v,i)=>sum+(elastic.includes(i)?v:0),0);
 const dst=[0];for(let i=0;i<widths.length;i++)dst.push(dst[i]+(elastic.includes(i)?(target-fixed)*widths[i]/flex:widths[i]*scale));
 dst[dst.length-1]=target;return {src,dst};
}
function paint(canvas:HTMLCanvasElement,img:HTMLImageElement,width:number,height:number){
 const ctx=canvas.getContext("2d");if(!ctx)return;
 canvas.width=width;canvas.height=height;
 const iw=img.naturalWidth,ih=img.naturalHeight,scale=Math.min(width/iw,height/ih);
 const x=axis(iw,width,[.12,.28,.72,.88],scale,[1,3]),y=axis(ih,height,[.25,.78],scale,[1]);
 ctx.imageSmoothingQuality="high";
 for(let j=0;j<3;j++)for(let i=0;i<5;i++){
  const sw=x.src[i+1]-x.src[i],sh=y.src[j+1]-y.src[j];
  const dx=Math.round(x.dst[i]),dy=Math.round(y.dst[j]),dw=Math.round(x.dst[i+1])-dx,dh=Math.round(y.dst[j+1])-dy;
  if(dw>0&&dh>0)ctx.drawImage(img,x.src[i],y.src[j],sw,sh,dx,dy,dw,dh);
 }
}
export default function ReferenceFrame({id,level,quality,active,onState}:{id:ReferenceId;level:number;quality:DeckQuality;active:boolean;onState:(state:ArtState)=>void}){
 const host=useRef<HTMLDivElement>(null),base=useRef<HTMLCanvasElement>(null);
 const [state,setState]=useState<ArtState>("loading");
 const m=material(id,level);
 useLayoutEffect(()=>{
  let live=true;const e=host.current,c=base.current;if(!e||!c)return;
  let image:HTMLImageElement|null=null;
  const publish=(value:ArtState)=>{if(live){setState(value);onState(value)}};
  publish("loading");
  const render=()=>{
   if(!live||!image||!e.clientWidth||!e.clientHeight)return;
   try{const w=e.clientWidth,h=e.clientHeight,scale=Math.min(devicePixelRatio||1,2,960/Math.max(w,h));paint(c,image,Math.round(w*scale),Math.round(h*scale));publish("ready")}
   catch{image=null;publish("fallback")}
  };
  void loadReferencePlate(id,level).then(plate=>{if(live){image=plate;render()}},()=>publish("fallback"));
  const observer=new ResizeObserver(render);observer.observe(e);return()=>{live=false;observer.disconnect()};
 },[id,level,onState]);
 const shine=id==="balatro"?(level===2?["#91b6d2bb","#fff8ff","#e9bbebdd"]:["#92b4d7cc","#ffffff","#b8d5f1ee"]):id==="gwent"?["#a67e3bbb","#fff5d5","#e9bc6aee"]:id==="infernal"?["#c47846cc","#ffe2a3","#eaa26aee"]:["#b18a59cc","#fff0ca","#e5b878ee"];
 return <div ref={host} className="reference-frame" data-material={m.name} data-reference={id} data-art-state={state} aria-hidden="true">
 {state==="fallback"&&<div className="reference-art-fallback" style={{background:m.paper,borderColor:m.rim}}/>}
 <canvas ref={base} className="reference-art" style={{visibility:state==="ready"?"visible":"hidden"}}/>
 {state==="ready"&&active&&quality!=="off"&&level>0&&<ShineBorder data-testid="reference-shine" borderWidth={quality==="low"?1.5:2} duration={quality==="low"?6:4.8} shineColor={shine} style={{opacity:quality==="low"?.84:1}}/>}
 </div>
}
