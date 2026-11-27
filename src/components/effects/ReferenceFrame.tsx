import {useEffect,useLayoutEffect,useRef,useState} from "react";
import {material,type ReferenceId} from "./referenceMaterials";
import ReferenceShader from "./ReferenceShader";
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
export default function ReferenceFrame({id,level,quality,active}:{id:ReferenceId;level:number;quality:DeckQuality;active:boolean}){
 const host=useRef<HTMLDivElement>(null),base=useRef<HTMLCanvasElement>(null),map=useRef<HTMLCanvasElement>(null);
 const [ready,setReady]=useState(false),[revision,setRevision]=useState(0),[failed,setFailed]=useState(false);
 const m=material(id,level),name=id+"-"+(level+1);
 useLayoutEffect(()=>{
  let live=true;const e=host.current,c=base.current;if(!e||!c)return;
  setReady(false);setFailed(false);let loaded=false;
  const plate=new Image();plate.decoding="async";
  const render=()=>{if(!live||!loaded||!e.clientWidth||!e.clientHeight)return;const w=e.clientWidth,h=e.clientHeight,scale=Math.min(devicePixelRatio||1,2,960/Math.max(w,h));paint(c,plate,Math.round(w*scale),Math.round(h*scale));setReady(true)};
  plate.onload=()=>{if(!live)return;loaded=true;render()};plate.onerror=()=>{if(live)setFailed(true)};
  plate.src=import.meta.env.BASE_URL+"deck-art/v1/"+name+".webp";
  const observer=new ResizeObserver(render);observer.observe(e);return()=>{live=false;observer.disconnect();plate.onload=null;plate.onerror=null};
 },[name]);
 // Map is fetched only for active animation. Static gallery and reduced-motion
 // users get the same art, without a second texture or any WebGL work.
 useEffect(()=>{
  const e=host.current,c=map.current;if(!active||quality==="off"||level===0||!e||!c)return;
  let live=true,loaded=false;const image=new Image();
  const render=()=>{if(!live||!loaded||!e.clientWidth||!e.clientHeight)return;const w=e.clientWidth,h=e.clientHeight,s=Math.min(1,640/Math.max(w,h));paint(c,image,Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s)));setRevision(n=>n+1)};
  image.onload=()=>{if(live){loaded=true;render()}};image.src=import.meta.env.BASE_URL+"deck-art/v1/"+name+"-map.webp";
  const o=new ResizeObserver(render);o.observe(e);return()=>{live=false;image.onload=null;o.disconnect();setRevision(0)};
 },[active,quality,level,name]);
 return <div ref={host} className="reference-frame" data-material={m.name} data-reference={id} data-art-state={ready?"ready":failed?"fallback":"loading"} aria-hidden="true">
 <div className="reference-art-fallback" style={{background:m.paper,borderColor:m.rim,boxShadow:"inset 0 0 0 3px "+m.light}}/>
 <canvas ref={base} className="reference-art" style={{visibility:ready?"visible":"hidden"}}/>
 <canvas ref={map} hidden/>
 {ready&&active&&quality!=="off"&&level>0&&<ReferenceShader key={name+quality} material={m} quality={quality} normalMap={map} revision={revision}/>}
 </div>
}
