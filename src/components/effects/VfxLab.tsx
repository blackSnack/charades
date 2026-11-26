import {useEffect,useRef,useState} from "react";
import {motion,useReducedMotion} from "motion/react";
import confetti from "canvas-confetti";
import {burning} from "agent-aura/fire";
import {thunder} from "agent-aura/thunder";
import {ArrowLeft,RotateCcw,Sparkles,Flame,Gem,Zap} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {BorderBeam} from "./border-beam";
import "./vfx-lab.css";
import WarmSurface from "./WarmSurface";
import {deckThemes,type DeckPreference,type DeckThemeId} from "@/services/deckTheme";
const themes=[
 {name:"简单",tag:"COMMON",word:"大熊猫",icon:Sparkles,colors:["#ffdb63","#fff4de","#80d9a8"],particles:8},
 {name:"中等",tag:"RARE",word:"金鸡独立",icon:Gem,colors:["#76d8ff","#e4fcff","#3c8bdf"],particles:24},
 {name:"困难",tag:"EPIC",word:"草木皆兵",icon:Zap,colors:["#a873ff","#edc5ff","#ff8be7"],particles:38},
 {name:"地狱",tag:"INFERNO",word:"沆瀣一气",icon:Flame,colors:["#ff5926","#ffb33f","#ffed9d"],particles:52}
] as const;
type Quality="off"|"low"|"high";
type Renderer=DeckThemeId;
type GpuState="idle"|"active"|"fallback";
function FlameLayer({animate}:{animate:boolean}){
 return <svg className="vfx-flames" viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">
 <defs><linearGradient id="lab-fire" x1="0" x2="0" y1="1" y2="0"><stop stopColor="#ffdc72"/><stop offset=".45" stopColor="#ff7027"/><stop offset="1" stopColor="#bc251d" stopOpacity=".1"/></linearGradient></defs>
 {[0,1,2].map(i=><motion.g key={i} style={{transformOrigin:"50% 100%"}} animate={animate?{scaleY:[.82,1.08,.91,.82],opacity:[.62,.92,.72,.62]}:{scaleY:1,opacity:.8}} transition={animate?{duration:1.6+i*.4,repeat:Infinity,ease:"easeInOut",delay:i*.16}:{duration:0}}><path d="M0 100 Q-5 72 16 53 Q9 82 32 72 Q24 44 49 26 Q35 65 64 79 Q61 58 79 53 Q75 82 96 87 Q80 56 113 32 Q95 70 127 79 Q117 28 152 6 Q132 53 160 75 Q176 62 175 42 Q193 58 194 83 Q209 69 214 47 Q233 63 228 86 Q244 65 248 28 Q270 48 263 77 Q282 72 288 46 Q298 67 292 85 Q309 71 320 50 L320 100Z" fill="url(#lab-fire)" transform={`translate(0 ${i*13}) scale(1 ${1-i*.11})`}/></motion.g>)}
 </svg>
}
function Preview({level,quality,revealed,visible,renderer,word,category,game=false}:{level:number;quality:Quality;revealed:boolean;visible:boolean;renderer:Renderer;word?:string;category?:string;game?:boolean}){
 const theme=themes[level],Icon=theme.icon,canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null);
 const [flipDone,setFlipDone]=useState(false),[gpu,setGpu]=useState<GpuState>("idle");
 const reduced=useReducedMotion()===true,active=quality!=="off"&&!reduced&&visible,high=quality==="high"&&active;
 const wantsGpu=renderer==="gpu"&&high&&level>=2&&revealed;
 useEffect(()=>{
  const container=stage.current,target=container?.querySelector<HTMLElement>(".vfx-front");
  if(!wantsGpu||!flipDone||!container||!target){setGpu("idle");return}
  let fx:{dispose:()=>void}|undefined;
  const dispose=()=>{try{fx?.dispose()}catch{/* context may already be lost */}fx=undefined};
  const lost=(event:Event)=>{event.preventDefault();dispose();setGpu("fallback")};
  try{
   const options={container,classNames:"vfx-gpu-canvas",zIndex:5,skipGreeting:true,styles:{pointerEvents:"none" as const}};
   fx=level===3?burning(target,{...options,particleCount:700,smokeCount:100,glow:true}):thunder(target,{...options,offset:5,particleCount:65,maxBranches:8});
   if(!container.querySelector("canvas.vfx-gpu-canvas"))throw Error("GPU canvas unavailable");
   container.addEventListener("webglcontextlost",lost,true);setGpu("active");
  }catch{dispose();setGpu("fallback")}
  return()=>{container.removeEventListener("webglcontextlost",lost,true);dispose()};
 },[wantsGpu,flipDone,level]);
 const elemental=renderer==="classic"||renderer==="gpu";
 const classicFx=elemental&&(!wantsGpu||gpu==="fallback");
 useEffect(()=>{if(!revealed||!high||!canvas.current||!elemental)return;const fire=confetti.create(canvas.current,{resize:true,useWorker:false,disableForReducedMotion:true});const timer=window.setTimeout(()=>{void fire({particleCount:theme.particles,spread:level===3?110:85,angle:90,startVelocity:level===3?30:19,gravity:level===3?-.12:.45,decay:.91,ticks:level===3?110:75,scalar:level===0?.65:.85,colors:[...theme.colors],shapes:level===1?["square","circle"]:level===3?["circle"]:["star","circle"],origin:{x:.5,y:.68}})},320);return()=>{window.clearTimeout(timer);fire.reset()}},[revealed,high,level,theme,elemental]);
 return <div ref={stage} className={"vfx-stage "+(game?"deck-game question":"")} data-theme={renderer} data-testid="vfx-stage" data-level={level+1} data-revealed={revealed} data-gpu={gpu}>
 <motion.div className="vfx-flipper" initial={false} animate={{rotateY:revealed?180:0}} transition={{duration:active?.58:0,ease:[.22,.72,.2,1]}} onAnimationComplete={()=>setFlipDone(revealed)}>
 <Card className={"vfx-face vfx-back "+(renderer==="warm"?"warm-back":"")} aria-hidden={revealed}><div className="vfx-back-mark"><Sparkles size={32}/><strong>Party<br/>Deck</strong><small>你比划我猜</small></div></Card>
 <Card className={`vfx-face vfx-front vfx-level-${level+1} deck-${renderer}`} aria-hidden={!revealed}>
 {renderer==="warm"&&revealed&&<WarmSurface level={level} active={active&&flipDone} quality={quality}/>}
 {revealed&&active&&level>0&&classicFx&&<BorderBeam size={90} duration={level===3?2.2:4} colorFrom={theme.colors[0]} colorTo={theme.colors[2]} borderWidth={3}/>}
 {revealed&&level===3&&quality!=="off"&&classicFx&&<FlameLayer animate={active}/>}
 {revealed&&high&&level===3&&classicFx&&<div className="vfx-embers" aria-hidden="true">{Array.from({length:8},(_,i)=><motion.span key={i} style={{left:`${9+i*11}%`,bottom:"8%",background:theme.colors[i%3]}} animate={{y:[0,-85-i*4],opacity:[0,.9,0],x:[0,(i%2?1:-1)*12]}} transition={{duration:1.4+(i%3)*.35,repeat:Infinity,delay:i*.18,ease:"easeOut"}}/>)}</div>}
 <div className="vfx-front-content"><div className="vfx-tags"><span>{category||"LEVEL 0"+(level+1)}</span><span>{theme.name}</span></div>{!game&&<Icon className="vfx-emblem" size={32} aria-hidden="true"/>}<strong className={"vfx-word "+((word??theme.word).length>6?"long":"")} data-testid={game?"word":"vfx-word"}>{word??theme.word}</strong><span className="vfx-tag">{renderer==="warm"?["PAPER","CHAMPAGNE","AMBER","OBSIDIAN"][level]:renderer==="original"?"PARTY DECK":theme.tag}</span></div>
 </Card></motion.div><canvas ref={canvas} className="vfx-canvas" aria-hidden="true"/>
 {gpu==="fallback"&&<span className="vfx-renderer-status" role="status">WebGL2 不可用 · 已降级</span>}
 </div>
}
function useVisible(){const [visible,setVisible]=useState(!document.hidden);useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",update);return()=>document.removeEventListener("visibilitychange",update)},[]);return visible}
export function DeckGameCard({level,word,category,preference}:{level:number;word:string;category:string;preference:DeckPreference}){
 const visible=useVisible(),[revealed,setRevealed]=useState(false);
 useEffect(()=>{setRevealed(true)},[]);
 return <Preview game level={level-1} word={word} category={category} renderer={preference.theme} quality={preference.quality} revealed={revealed} visible={visible}/>;
}
export default function VfxLab({onBack,preference,onApply}:{onBack:()=>void;preference:DeckPreference;onApply:(p:DeckPreference)=>boolean}){
 const [level,setLevel]=useState(0),[renderer,setRenderer]=useState<Renderer>(preference.theme==="original"?"warm":preference.theme),[quality,setQuality]=useState<Quality>(preference.quality),[revealed,setRevealed]=useState(false),[run,setRun]=useState(0),[message,setMessage]=useState(""),[favorites,setFavorites]=useState(preference.favorites);const visible=useVisible();
 const reset=()=>{setRevealed(false);setRun(n=>n+1)};
 const apply=()=>{const p={theme:renderer,quality,favorites};setMessage(onApply(p)?"已应用到游戏":"无法保存设置，请重试")};
 const favorite=()=>{const next=favorites.includes(renderer)?favorites.filter(x=>x!==renderer):[...favorites,renderer];setFavorites(next);const p={...preference,favorites:next};if(!onApply(p))setMessage("无法保存收藏")};
 return <section className="vfx-lab"><header><Button variant="neutral" size="icon-lg" aria-label="返回首页" onClick={onBack}><ArrowLeft/></Button><h2>卡牌动效实验室</h2><span className="vfx-experiment">实验</span></header>
 <h2>卡组主题</h2><p className="hint">当前游戏：{deckThemes.find(t=>t.id===preference.theme)?.name}。预览不会改变游戏，应用后生效。</p>
 <div role="group" aria-label="卡组主题" className="grid2">{deckThemes.map(t=><Button key={t.id} variant="noShadow" className={("min-h-16 whitespace-normal flex-col gap-1 ")+(renderer===t.id?"bg-[#FFDB63]":"bg-secondary-background")} aria-pressed={renderer===t.id} onClick={()=>{setRenderer(t.id);setMessage("");reset()}}><span>{t.name}{favorites.includes(t.id)?" ★":""}</span><small>{t.description}</small></Button>)}</div>
 <div role="group" aria-label="选择难度" className="vfx-options">{themes.map((t,i)=><Button key={t.name} variant="noShadow" className={level===i?"bg-[#FFDB63] min-h-11":"bg-secondary-background min-h-11"} aria-pressed={level===i} onClick={()=>{setLevel(i);reset()}}>{t.name}</Button>)}</div>
 <Preview key={run} level={level} quality={quality} revealed={revealed} visible={visible} renderer={renderer}/>
 <div className="vfx-controls"><Button size="lg" className="min-h-12 bg-[#80D9A8] text-base" disabled={revealed} onClick={()=>setRevealed(true)}>翻牌揭晓 <Sparkles/></Button><Button size="lg" variant="neutral" className="min-h-12" onClick={reset}><RotateCcw/>重置卡背</Button></div>
 <div role="group" aria-label="特效质量" className="vfx-options">{([["off","关闭"],["low","简洁"],["high","完整"]] as const).map(([v,t])=><Button key={v} variant="noShadow" aria-pressed={quality===v} className={quality===v?"bg-[#80D9A8] min-h-11":"bg-secondary-background min-h-11"} onClick={()=>setQuality(v)}>{t}</Button>)}</div>
 <div className="grid2"><Button className="min-h-12 bg-[#80D9A8]" onClick={apply}>应用到游戏</Button><Button variant="neutral" className="min-h-12" onClick={favorite}>{favorites.includes(renderer)?"取消收藏":"收藏此卡组"}</Button></div><small role="status">{message}</small>
 <small>暖色收藏卡：cards-css 全息箔面；元素卡：Magic UI、Canvas 或 Agent Aura WebGL2。预览可重复，正式游戏不改变题库或进度。</small></section>
}
