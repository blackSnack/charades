import {useEffect,useRef,useState} from "react";
import {motion,useReducedMotion} from "motion/react";
import confetti from "canvas-confetti";
import {ArrowLeft,RotateCcw,Sparkles,Flame,Gem,Zap} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {BorderBeam} from "./border-beam";
import "./vfx-lab.css";
const themes=[
 {name:"简单",tag:"COMMON",word:"大熊猫",icon:Sparkles,colors:["#ffdb63","#fff4de","#80d9a8"],particles:8},
 {name:"中等",tag:"RARE",word:"金鸡独立",icon:Gem,colors:["#76d8ff","#e4fcff","#3c8bdf"],particles:24},
 {name:"困难",tag:"EPIC",word:"草木皆兵",icon:Zap,colors:["#a873ff","#edc5ff","#ff8be7"],particles:38},
 {name:"地狱",tag:"INFERNO",word:"沆瀣一气",icon:Flame,colors:["#ff5926","#ffb33f","#ffed9d"],particles:52}
] as const;
type Quality="off"|"low"|"high";
function FlameLayer({animate}:{animate:boolean}){
 return <svg className="vfx-flames" viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">
 <defs><linearGradient id="lab-fire" x1="0" x2="0" y1="1" y2="0"><stop stopColor="#ffdc72"/><stop offset=".45" stopColor="#ff7027"/><stop offset="1" stopColor="#bc251d" stopOpacity=".1"/></linearGradient></defs>
 {[0,1,2].map(i=><motion.g key={i} style={{transformOrigin:"50% 100%"}} animate={animate?{scaleY:[.82,1.08,.91,.82],opacity:[.62,.92,.72,.62]}:{scaleY:1,opacity:.8}} transition={animate?{duration:1.6+i*.4,repeat:Infinity,ease:"easeInOut",delay:i*.16}:{duration:0}}><path d="M0 100 Q-5 72 16 53 Q9 82 32 72 Q24 44 49 26 Q35 65 64 79 Q61 58 79 53 Q75 82 96 87 Q80 56 113 32 Q95 70 127 79 Q117 28 152 6 Q132 53 160 75 Q176 62 175 42 Q193 58 194 83 Q209 69 214 47 Q233 63 228 86 Q244 65 248 28 Q270 48 263 77 Q282 72 288 46 Q298 67 292 85 Q309 71 320 50 L320 100Z" fill="url(#lab-fire)" transform={`translate(0 ${i*13}) scale(1 ${1-i*.11})`}/></motion.g>)}
 </svg>
}
function Preview({level,quality,revealed,visible}:{level:number;quality:Quality;revealed:boolean;visible:boolean}){
 const theme=themes[level],Icon=theme.icon,canvas=useRef<HTMLCanvasElement>(null);
 const reduced=useReducedMotion()===true,active=quality!=="off"&&!reduced&&visible,high=quality==="high"&&active;
 useEffect(()=>{if(!revealed||!high||!canvas.current)return;const fire=confetti.create(canvas.current,{resize:true,useWorker:false,disableForReducedMotion:true});const timer=window.setTimeout(()=>{void fire({particleCount:theme.particles,spread:level===3?110:85,angle:90,startVelocity:level===3?30:19,gravity:level===3?-.12:.45,decay:.91,ticks:level===3?110:75,scalar:level===0?.65:.85,colors:[...theme.colors],shapes:level===1?["square","circle"]:level===3?["circle"]:["star","circle"],origin:{x:.5,y:.68}})},320);return()=>{window.clearTimeout(timer);fire.reset()}},[revealed,high,level,theme]);
 return <div className="vfx-stage" data-testid="vfx-stage" data-level={level+1} data-revealed={revealed}>
 <motion.div className="vfx-flipper" initial={false} animate={{rotateY:revealed?180:0}} transition={{duration:active?.58:0,ease:[.22,.72,.2,1]}}>
 <Card className="vfx-face vfx-back" aria-hidden={revealed}><div className="vfx-back-mark"><Sparkles size={32}/><strong>Party<br/>Deck</strong><small>你比划我猜</small></div></Card>
 <Card className={`vfx-face vfx-front vfx-level-${level+1}`} aria-hidden={!revealed}>
 {revealed&&active&&level>0&&<BorderBeam size={90} duration={level===3?2.2:4} colorFrom={theme.colors[0]} colorTo={theme.colors[2]} borderWidth={3}/>}
 {revealed&&level===3&&<FlameLayer animate={active}/>}
 {revealed&&high&&level===3&&<div className="vfx-embers" aria-hidden="true">{Array.from({length:8},(_,i)=><motion.span key={i} style={{left:`${9+i*11}%`,bottom:"8%",background:theme.colors[i%3]}} animate={{y:[0,-85-i*4],opacity:[0,.9,0],x:[0,(i%2?1:-1)*12]}} transition={{duration:1.4+(i%3)*.35,repeat:Infinity,delay:i*.18,ease:"easeOut"}}/>)}</div>}
 <div className="vfx-front-content"><div className="vfx-tags"><span>LEVEL 0{level+1}</span><span>{theme.name}</span></div><Icon className="vfx-emblem" size={40} aria-hidden="true"/><strong className="vfx-word" data-testid="vfx-word">{theme.word}</strong><span className="vfx-tag">{theme.tag}</span></div>
 </Card></motion.div><canvas ref={canvas} className="vfx-canvas" aria-hidden="true"/>
 </div>
}
export default function VfxLab({onBack}:{onBack:()=>void}){
 const [level,setLevel]=useState(0),[quality,setQuality]=useState<Quality>("high"),[revealed,setRevealed]=useState(false),[run,setRun]=useState(0),[visible,setVisible]=useState(!document.hidden);
 useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",update);return()=>document.removeEventListener("visibilitychange",update)},[]);
 const reset=()=>{setRevealed(false);setRun(n=>n+1)};
 return <section className="vfx-lab"><header><Button variant="neutral" size="icon-lg" aria-label="返回首页" onClick={onBack}><ArrowLeft/></Button><h2>卡牌动效实验室</h2><span className="vfx-experiment">实验</span></header>
 <p className="hint">独立预览，不改变游戏进度或正式题卡。</p>
 <div role="group" aria-label="选择难度" className="vfx-options">{themes.map((t,i)=><Button key={t.name} variant="noShadow" className={level===i?"bg-[#FFDB63] min-h-11":"bg-secondary-background min-h-11"} aria-pressed={level===i} onClick={()=>{setLevel(i);reset()}}>{t.name}</Button>)}</div>
 <Preview key={run} level={level} quality={quality} revealed={revealed} visible={visible}/>
 <div className="vfx-controls"><Button size="lg" className="min-h-12 bg-[#80D9A8] text-base" disabled={revealed} onClick={()=>setRevealed(true)}>翻牌揭晓 <Sparkles/></Button><Button size="lg" variant="neutral" className="min-h-12" onClick={reset}><RotateCcw/>重置卡背</Button></div>
 <div role="group" aria-label="特效质量" className="vfx-options">{([["off","关闭"],["low","简洁"],["high","完整"]] as const).map(([v,t])=><Button key={v} variant="noShadow" aria-pressed={quality===v} className={quality===v?"bg-[#80D9A8] min-h-11":"bg-secondary-background min-h-11"} onClick={()=>setQuality(v)}>{t}</Button>)}</div>
 <small>Motion 3D 翻牌 · Magic UI 流光 · canvas-confetti 粒子 · SVG 火焰装饰。关闭特效仍保留难度主题。</small></section>
}
