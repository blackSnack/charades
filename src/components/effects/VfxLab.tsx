import {useEffect,useState} from "react";
import {motion,useReducedMotion} from "motion/react";
import {ArrowLeft,RotateCcw,Sparkles} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import MetalRim from "./MetalRim";
import QuestionWord from "@/components/QuestionWord";
import "./vfx-lab.css";
import WarmSurface from "./WarmSurface";
import ReferenceFrame from "./ReferenceFrame";
import {isReference,material} from "./referenceMaterials";
import "./reference-decks.css";
import {deckThemes,type DeckPreference,type DeckThemeId} from "@/services/deckTheme";
const themes=[{name:"简单",word:"大熊猫"},{name:"中等",word:"金鸡独立"},{name:"困难",word:"草木皆兵"},{name:"地狱",word:"沆瀣一气"}] as const;
type Quality="off"|"low"|"high";
type Renderer=DeckThemeId;
function Preview({level,quality,revealed,visible,renderer,word,category,game=false}:{level:number;quality:Quality;revealed:boolean;visible:boolean;renderer:Renderer;word?:string;category?:string;game?:boolean}){
 const theme=themes[level], [flipDone,setFlipDone]=useState(false);
 const refMaterial=isReference(renderer)?material(renderer,level):null;
 const reduced=useReducedMotion()===true,active=quality!=="off"&&!reduced&&visible;
 return <div className={"vfx-stage "+(game?"deck-game question":"")+(refMaterial?" reference-stage":"")} data-theme={renderer} data-testid="vfx-stage" data-level={level+1} data-revealed={revealed}>
 <motion.div className="vfx-flipper" initial={false} animate={{rotateY:revealed?180:0}} transition={{duration:active?.58:0,ease:[.22,.72,.2,1]}} onAnimationComplete={()=>setFlipDone(revealed)}>
 <Card className={"vfx-face vfx-back "+(renderer!=="original"?"warm-back":"")} aria-hidden={revealed}><div className="vfx-back-mark"><Sparkles size={32}/><strong>Party<br/>Deck</strong><small>你比划我猜</small></div></Card>
 <Card className={`vfx-face vfx-front vfx-level-${level+1} deck-${renderer} ${refMaterial?"reference-card":""}`} style={refMaterial?{"--vfx-bg":refMaterial.paper,"--vfx-fg":refMaterial.ink,"--ref-label":refMaterial.label} as React.CSSProperties:undefined} aria-hidden={!revealed}>
 {renderer==="warm"&&revealed&&<WarmSurface level={level} active={active&&flipDone} quality={quality}/>}
 {renderer==="metal"&&revealed&&<MetalRim level={level} active={active&&flipDone} quality={quality}/>}
 {isReference(renderer)&&revealed&&<ReferenceFrame id={renderer} level={level} active={active&&flipDone} quality={quality}/>}
 <div className="vfx-front-content" data-preview={!game}><div className="vfx-tags"><span>{category||"示例题目"}</span><span>{theme.name}</span></div><div className="question-word-zone"><QuestionWord word={word??(refMaterial?"大熊猫":theme.word)} testId={game?"word":"vfx-word"}/></div></div>
 </Card></motion.div></div>
}
function useVisible(){const [visible,setVisible]=useState(!document.hidden);useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener("visibilitychange",update);return()=>document.removeEventListener("visibilitychange",update)},[]);return visible}
export function DeckGameCard({level,word,category,preference}:{level:number;word:string;category:string;preference:DeckPreference}){
 const visible=useVisible(),[revealed,setRevealed]=useState(false);
 useEffect(()=>{setRevealed(true)},[]);
 return <Preview game level={level-1} word={word} category={category} renderer={preference.theme} quality={preference.quality} revealed={revealed} visible={visible}/>;
}
export default function VfxLab({onBack,preference,onApply}:{onBack:()=>void;preference:DeckPreference;onApply:(p:DeckPreference)=>boolean}){
 const [level,setLevel]=useState(0),[renderer,setRenderer]=useState<Renderer>(preference.theme==="original"?"warm":preference.theme),[quality,setQuality]=useState<Quality>(preference.quality),[revealed,setRevealed]=useState(false),[run,setRun]=useState(0),[message,setMessage]=useState(""),[favorites,setFavorites]=useState(preference.favorites),[gallery,setGallery]=useState(false);const visible=useVisible();
 const reset=()=>{setRevealed(false);setRun(n=>n+1)};
 const apply=()=>{const p={theme:renderer,quality,favorites};setMessage(onApply(p)?"已应用到游戏":"无法保存设置，请重试")};
 const favorite=()=>{const next=favorites.includes(renderer)?favorites.filter(x=>x!==renderer):[...favorites,renderer];setFavorites(next);const p={...preference,favorites:next};if(!onApply(p))setMessage("无法保存收藏")};
 return <section className="vfx-lab"><header><Button variant="neutral" size="icon-lg" aria-label="返回首页" onClick={onBack}><ArrowLeft/></Button><h2>卡牌动效实验室</h2><span className="vfx-experiment">实验</span></header>
 <h2>卡组主题</h2><p className="hint">当前游戏：{deckThemes.find(t=>t.id===preference.theme)?.name}。预览不会改变游戏，应用后生效。</p>
 <div role="group" aria-label="卡组主题" className="grid2">{deckThemes.map(t=><Button key={t.id} variant="noShadow" className={("min-h-16 whitespace-normal flex-col gap-1 ")+(renderer===t.id?"bg-[#FFDB63]":"bg-secondary-background")} aria-pressed={renderer===t.id} onClick={()=>{setRenderer(t.id);setGallery(false);setMessage("");reset()}}><span>{t.name}{favorites.includes(t.id)?" ★":""}</span><small>{t.description}</small></Button>)}</div>
 <div role="group" aria-label="选择难度" className="vfx-options">{themes.map((t,i)=><Button key={t.name} variant="noShadow" className={level===i?"bg-[#FFDB63] min-h-11":"bg-secondary-background min-h-11"} aria-pressed={level===i} onClick={()=>{setLevel(i);reset()}}>{t.name}</Button>)}</div>
 <Preview key={run} level={level} quality={quality} revealed={revealed} visible={visible} renderer={renderer}/>
 {isReference(renderer)&&<><Button variant="neutral" aria-expanded={gallery} onClick={()=>setGallery(v=>!v)}>{gallery?"收起四级对照":"四级对照"}</Button>{gallery&&<div className="reference-gallery" aria-label="四级样式对照">{[3,2,1,0].map(i=><div key={i}><Preview level={i} quality="off" revealed visible={false} renderer={renderer} word="大熊猫"/><small>{themes[i].name} · {material(renderer,i).name}</small></div>)}</div>}</>}
 <div className="vfx-controls"><Button size="lg" className="min-h-12 bg-[#80D9A8] text-base" disabled={revealed} onClick={()=>setRevealed(true)}>翻牌揭晓 <Sparkles/></Button><Button size="lg" variant="neutral" className="min-h-12" onClick={reset}><RotateCcw/>重置卡背</Button></div>
 <div role="group" aria-label="特效质量" className="vfx-options">{([["off","关闭"],["low","简洁"],["high","完整"]] as const).map(([v,t])=><Button key={v} variant="noShadow" aria-pressed={quality===v} className={quality===v?"bg-[#80D9A8] min-h-11":"bg-secondary-background min-h-11"} onClick={()=>setQuality(v)}>{t}</Button>)}</div>
 <div className="grid2"><Button className="min-h-12 bg-[#80D9A8]" onClick={apply}>应用到游戏</Button><Button variant="neutral" className="min-h-12" onClick={favorite}>{favorites.includes(renderer)?"取消收藏":"收藏此卡组"}</Button></div><small role="status">{message}</small>
 <small>美术纹理底板 · 实时 WebGL 材质</small></section>
}
