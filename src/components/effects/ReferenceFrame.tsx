import {useId,useLayoutEffect,useRef,useState} from "react";
import {material,type ReferenceId} from "./referenceMaterials";
import ReferenceShader from "./ReferenceShader";
import type {DeckQuality} from "@/services/deckTheme";

// All geometry is defined in units relative to the real card's short height.
// The straight rails expand with the host; corner motifs do not get stretched.
function FrameArt({id,level,width}:{id:ReferenceId;level:number;width:number}){
 const uid=useId().replace(/:/g,""),m=material(id,level),w=width,h=360,r=23,b=m.edge+3;
 const url=(s:string)=>"url(#"+uid+s+")";
 const shape=(d:number,rad:number)=>`M${d+rad} ${d}H${w-d-rad}Q${w-d} ${d} ${w-d} ${d+rad}V${h-d-rad}Q${w-d} ${h-d} ${w-d-rad} ${h-d}H${d+rad}Q${d} ${h-d} ${d} ${h-d-rad}V${d+rad}Q${d} ${d} ${d+rad} ${d}Z`;
 const star=(x:number,y:number,s:number)=>`M${x} ${y-s}Q${x+2} ${y-2} ${x+s} ${y}Q${x+2} ${y+2} ${x} ${y+s}Q${x-2} ${y+2} ${x-s} ${y}Q${x-2} ${y-2} ${x} ${y-s}Z`;
 const cornerTransforms=["translate(0 0)",`translate(${w} 0) scale(-1 1)`,`translate(0 ${h}) scale(1 -1)`,`translate(${w} ${h}) scale(-1 -1)`];
 const metal=id==="gwent"||id==="infernal",dark=id==="balatro"&&level===3;
 return <svg className="reference-art" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
 <defs>
 <linearGradient id={uid+"paper"} x1="0" x2="1" y1="0" y2="1"><stop stopColor={m.paper}/><stop offset=".48" stopColor={m.paper}/><stop offset="1" stopColor={m.shade}/></linearGradient>
 {dark&&<radialGradient id={uid+"negative"}><stop stopColor="#b6a9a9"/><stop offset=".52" stopColor="#9b9092"/><stop offset=".83" stopColor="#4a3e44"/><stop offset="1" stopColor="#2b2329"/></radialGradient>}
 <radialGradient id={uid+"vignette"}><stop offset=".48" stopColor={m.paper} stopOpacity="0"/><stop offset="1" stopColor={m.shade} stopOpacity=".48"/></radialGradient>
 <linearGradient id={uid+"metal"} x1="0" y1="0" x2="1" y2=".86">{[m.rim,m.mid,m.light,m.mid,m.rim,m.light,m.mid,m.rim].map((c,i)=><stop key={i} offset={i/7} stopColor={c}/>)}</linearGradient>
 <linearGradient id={uid+"holo"} x1="0" y1=".05" x2="1" y2=".92">{["#8b91b0","#d9c2de","#a9c5c6","#e7d9b6","#c7b5d7","#a2b9c9","#ebd9d4"].map((c,i)=><stop key={i} offset={i/6} stopColor={c}/>)}</linearGradient>
 <linearGradient id={uid+"carve"} x1="0" x2=".8" y1="0" y2="1"><stop stopColor={m.light}/><stop offset=".3" stopColor={m.mid}/><stop offset=".62" stopColor={m.rim}/><stop offset="1" stopColor={m.light}/></linearGradient>
 <filter id={uid+"grain"} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".67" numOctaves="3" seed={13+level} stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
 <pattern id={uid+"brush"} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)"><path d="M1 0V9M4 0V9M7 0V9" stroke={m.light} strokeWidth=".45" opacity=".5"/><path d="M2 0V9M8 0V9" stroke={m.rim} strokeWidth=".35" opacity=".6"/></pattern>
 <clipPath id={uid+"clip"}><path d={shape(1,r)}/></clipPath>
 <mask id={uid+"ring"}><path d={shape(1,r)} fill="white"/><path d={shape(b,Math.max(4,r-b))} fill="black"/></mask>
 <g id={uid+"corner"}>
 {id==="balatro"&&<><path d={`M7 58V28Q7 7 28 7H76Q45 13 35 35Q14 45 7 58Z`} fill={level===2?url("holo"):m.mid} opacity={level===0?.37:.8}/><path d="M9 62Q20 37 39 33Q45 16 77 9" stroke={m.light} strokeWidth="1.5" fill="none"/><path d={star(25,25,7+level)} fill={m.light} stroke={m.accent} strokeWidth=".8"/></>}
 {id==="gwent"&&<><path d={level===0?"M8 57V24L25 8H57L36 19L19 36Z":"M4 67V23L23 4H84L58 15L39 35L16 57Z"} fill={url("metal")} stroke={m.rim} strokeWidth="1.8"/><path d="M9 58V25L25 9H69M16 49V28L28 16H48" stroke={m.light} strokeWidth="1.5" opacity=".9" fill="none"/>{level>=1&&<path d="M15 46Q22 25 47 17Q30 34 15 46M21 36Q20 22 32 19Q35 28 21 36M33 26Q47 15 55 17Q51 27 33 26" fill={url("carve")} stroke={m.accent} strokeWidth=".8"/>}{level>=2&&<><path d="M8 80Q17 44 31 37Q37 17 81 8" stroke={m.accent} strokeWidth="3" fill="none"/>{[0,1,2,3].map(i=><path key={i} d={`M${12+i*9} ${62-i*12}q-5 -16 8 -22q7 13 -8 22q16 -13 22 -6q-4 12 -22 6Z`} fill={url("carve")} stroke={m.rim} strokeWidth=".6"/>)}</>}{level===3&&<path d="M7 15L26 9L46 14L32 22L39 29L22 37L15 57L8 49L16 33L7 28Z" fill={url("metal")} stroke={m.light} strokeWidth="1.2"/>}</>}
 {id==="infernal"&&<><path d="M4 79V25L24 4H80L64 15L37 19L19 39L14 64Z" fill={url("metal")} stroke={m.rim} strokeWidth="2"/><path d="M7 72L8 26L26 8H75M14 49L14 29L29 14L52 13" fill="none" stroke={m.light} strokeWidth="1.3"/>{level>0&&<><circle cx="23" cy="23" r="5.4" fill={m.rim} stroke={m.light}/><path d="M20 24L25 20" stroke={m.mid} strokeWidth="2"/></>}{level===3&&<><path d="M5 45L15 33L12 25L27 17L35 18L41 6M49 10L45 20L33 24" fill="none" stroke="#492a29" strokeWidth="5"/><path d="M5 45L15 33L12 25L27 17L35 18L41 6M49 10L45 20L33 24" fill="none" stroke="#bc6b45" strokeWidth="1.8"/></>}</>}
 {id==="occult"&&<><path d="M7 78Q12 53 9 30Q13 12 35 8L78 7Q48 20 34 22Q20 37 21 55L13 80Z" fill={level===0?"none":url("carve")} stroke={m.rim} strokeWidth={level===0?2:1.6}/>{[0,1,2,3].map(i=><path key={i} d={`M${8+i*3} ${70-i*8}Q${9+i*3} ${34+i*2} ${26+i*7} ${13+i}L${65-i*5} ${8+i*2}`} stroke={i%2?m.light:m.rim} opacity=".7" strokeWidth="1.2" fill="none"/>)}{level>=1&&<path d="M12 37Q4 30 9 22Q13 17 18 21Q19 11 27 11Q34 17 30 25L55 13Q63 7 67 15Q70 24 61 24L28 34Q30 40 22 43Q13 45 12 37Z" fill={level===1||level===3?"#c5ad84":m.mid} stroke={m.rim} strokeWidth="1.3"/>}{level>=2&&<path d="M21 55L39 35M30 46L20 40M30 46L35 58M46 20L56 35M46 20L62 22" stroke={level===3?m.accent:m.rim} strokeWidth="2" fill="none"/>}</>}
 </g>
 </defs>
 <g clipPath={url("clip")}>
 <path d={shape(1,r)} fill={url(dark?"negative":"paper")}/>
 <path d={shape(1,r)} fill={url("vignette")} opacity={dark?0:id==="balatro"?.5:.8}/>
 <rect width={w} height={h} filter={url("grain")} opacity={dark?.09:.075} style={{mixBlendMode:"multiply"}}/>
 {id==="balatro"&&level===2&&<><path d={`M0 0H${w}V40Q${w*.65} 60 ${w*.42} 24Q${w*.18} 0 0 80Z M0 290Q${w*.18} 370 ${w*.54} 320Q${w*.8} 285 ${w} 302V360H0Z`} fill={url("holo")} opacity=".44"/><path d={shape(b+5,16)} fill="none" stroke={url("holo")} strokeWidth="3" opacity=".8"/></>}
 <path d={shape(1,r)+" "+shape(b,Math.max(5,r-b))} fill={id==="balatro"&&level===2?url("holo"):url("metal")} fillRule="evenodd"/>
 <rect width={w} height={h} mask={url("ring")} fill={url("brush")} opacity={metal||level===1?.37:.18}/>
 <path d={shape(2,r-1)} stroke={m.light} strokeWidth="1.2" fill="none" opacity=".9"/>
 <path d={shape(b,Math.max(5,r-b))} stroke={m.rim} strokeWidth="2.2" fill="none"/>
 <path d={shape(b+3,Math.max(5,r-b))} stroke={m.light} strokeWidth="1" fill="none" opacity=".9"/>
 {cornerTransforms.map((t,i)=><use key={i} href={"#"+uid+"corner"} transform={t}/>)}
 {id==="gwent"&&level>=2&&<g transform={`translate(${w/2} ${h-15})`}><path d="M-56 4Q-32 -19 0 -7Q32 -19 56 4" fill="none" stroke={m.accent} strokeWidth="2"/>{[-1,1].map(s=><g key={s} transform={`scale(${s} 1)`}>{[0,1,2,3].map(i=><path key={i} d={`M${8+i*10} 1q-2 -13 10 -16q4 8 -10 16Z`} fill={url("carve")} stroke={m.rim} strokeWidth=".6"/>)}</g>)}<path d="M0 -16L13 -10L10 3L0 10L-10 3L-13 -10Z" fill={m.label} stroke={m.light} strokeWidth="2"/><path d="M0 -10L5 -2L0 4L-5 -2Z" fill={m.light}/></g>}
 {id==="infernal"&&<g><path d={`M${w*.24} 349H${w*.76}M${w*.24} 342H${w*.76}`} stroke={m.rim} strokeWidth="2.5"/>{Array.from({length:13},(_,i)=><path key={i} d={`M${w*(.25+i/24)} 340V352`} stroke={level>=2?m.accent:m.mid} strokeWidth="3"/>)}{level===3&&[0,1,2,3,4].map(i=>{const x=w*(.12+i*.18);return <g key={i}><path d={`M${x} 3l8 7l-4 7l12 -3l8 5M${x+6} 357l-6 -6l9 -5l-3 -8`} fill="none" stroke="#4a2929" strokeWidth="5"/><path d={`M${x} 3l8 7l-4 7l12 -3l8 5M${x+6} 357l-6 -6l9 -5l-3 -8`} fill="none" stroke={m.accent} strokeWidth="1.5"/></g>})}</g>}
 {id==="occult"&&<g><path d={`M${w*.23} 347Q${w*.35} 339 ${w*.5} 346T${w*.77} 347`} stroke={m.rim} strokeWidth="2" fill="none"/>{level>0&&[.12,.88].map((f,i)=><g key={i} transform={`translate(${w*f} 318)`}><path d="M-5 5H5V25H-5Z" fill={m.light} stroke={m.rim}/><path d="M0 6Q-8 -1 1 -12Q8 1 0 6Z" fill="#c58d5a" stroke={m.rim}/></g>)}{level>=2&&<g transform={`translate(${w/2} 343)`} stroke={level===3?m.accent:m.rim} strokeWidth="1.5" fill="none"><circle r="13"/><path d="M-10 7L0 -12L10 7ZM-13 0H13M0 -13V13"/></g>}</g>}
 </g>
 </svg>;
}
export default function ReferenceFrame({id,level,quality,active}:{id:ReferenceId;level:number;quality:DeckQuality;active:boolean}){
 const host=useRef<HTMLDivElement>(null),[width,setWidth]=useState(560),m=material(id,level);
 useLayoutEffect(()=>{const e=host.current;if(!e)return;const resize=()=>{if(e.clientHeight&&e.clientWidth)setWidth(360*e.clientWidth/e.clientHeight)};resize();const o=new ResizeObserver(resize);o.observe(e);return()=>o.disconnect()},[]);
 return <div ref={host} className="reference-frame" data-material={m.name} data-reference={id} aria-hidden="true">
 <FrameArt id={id} level={level} width={width}/>
 {active&&quality!=="off"&&level>0&&<ReferenceShader key={id+level+quality} material={m} quality={quality}/>}
 </div>
}
