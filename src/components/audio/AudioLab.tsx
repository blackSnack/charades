import {useEffect,useRef,useState} from "react";
import {ArrowLeft,Download,Headphones,Play,Square} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {deckThemes,loadDeck,type DeckThemeId} from "@/services/deckTheme";
import {albums,effects,loopSeconds,renderMusic,renderEffect,type Album,type Effect,type Scene} from "./score";
import type {AudioProfile} from "@/services/audioPreference";

type Tab=Scene|"sfx";
type Review={picks:Record<string,string>;notes:Record<string,string>};
const storageKey="party-deck-audio-review-v1";
function loadReview():Review{try{const x=JSON.parse(localStorage.getItem(storageKey)||"null");if(x&&typeof x.picks==="object"&&x.picks&&typeof x.notes==="object"&&x.notes)return x}catch{}return {picks:{},notes:{}}}
const labels:Record<Tab,string>={lounge:"休闲音乐",play:"游戏音乐",sfx:"音效"};
export default function AudioLab({onBack,profile,onApply}:{onBack:()=>void;profile:AudioProfile|null;onApply:(p:AudioProfile)=>boolean}){
 const [theme,setTheme]=useState<DeckThemeId|"all">(()=>loadDeck().theme),[tab,setTab]=useState<Tab>("lounge"),[review,setReview]=useState(loadReview),[volume,setVolume]=useState(.45),[active,setActive]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const ctx=useRef<AudioContext|null>(null),source=useRef<AudioBufferSourceNode|null>(null),gain=useRef<GainNode|null>(null),token=useRef(0),cache=useRef(new Map<string,AudioBuffer>());
 function halt(){token.current++;if(source.current){try{source.current.stop()}catch{}source.current.disconnect();source.current=null}if(gain.current){gain.current.disconnect();gain.current=null}setActive("");setBusy(false)}
 useEffect(()=>{const stopHidden=()=>{if(document.hidden)halt()};document.addEventListener("visibilitychange",stopHidden);return()=>{document.removeEventListener("visibilitychange",stopHidden);token.current++;try{source.current?.stop()}catch{}void ctx.current?.close().catch(()=>{});cache.current.clear()}},[]);
 useEffect(()=>{if(gain.current&&ctx.current)gain.current.gain.setTargetAtTime(volume,ctx.current.currentTime,.025)},[volume]);
 function persist(next:Review){setReview(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setMessage("")}catch{setMessage("无法保存到本机，请导出试听记录。")}}
 function changeTheme(value:DeckThemeId|"all"){halt();setTheme(value);setMessage("")}
 function changeTab(value:Tab){halt();setTab(value);setMessage("")}
 async function audition(album:Album,event?:Effect){
  const scene=tab,key=album.id+":"+(event??scene);if(active===key){halt();return}
  halt();const generation=token.current;setActive(key);setBusy(true);setMessage("");
  try{
   const ac=ctx.current??new AudioContext();ctx.current=ac;await ac.resume();
   if(generation!==token.current)return;
   let buffer=cache.current.get(key);if(!buffer){buffer=event?await renderEffect(album,event):await renderMusic(album,scene as Scene);if(generation!==token.current)return;cache.current.set(key,buffer);if(cache.current.size>4){const oldest=cache.current.keys().next().value;if(oldest)cache.current.delete(oldest)}}
   if(generation!==token.current)return;
   const node=ac.createBufferSource(),g=ac.createGain();node.buffer=buffer;node.loop=!event;g.gain.value=volume;node.connect(g);g.connect(ac.destination);source.current=node;gain.current=g;
   node.onended=()=>{if(token.current===generation){source.current=null;g.disconnect();gain.current=null;setActive("")}};
   node.start();setBusy(false)
  }catch{if(generation===token.current){halt();setMessage("音频播放失败，请重新点击试听或检查浏览器声音权限。")}}
 }
 function apply(a:Album){halt();const valid=(s:Tab)=>albums.find(x=>x.id===review.picks[a.theme+":"+s]&&x.theme===a.theme)?.id??a.id;const next={lounge:valid("lounge"),play:valid("play"),sfx:valid("sfx"),enabled:true,music:profile?.music??.32,effects:profile?.effects??.65};next[tab]=a.id;setMessage(onApply(next)?"已应用到游戏，返回首页开始或继续游戏即可体验。":"本次已应用，但无法保存声音设置。")}
 const visible=albums.filter(a=>theme==="all"||a.theme===theme);
 function exportReview(){const b=new Blob([JSON.stringify({version:1,review,albums:albums.map(a=>({id:a.id,title:a.title,theme:a.theme}))},null,2)],{type:"application/json"}),url=URL.createObjectURL(b),a=document.createElement("a");a.href=url;a.download="party-deck-audio-review.json";a.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <section className="group" data-testid="audio-lab">
  <header><Button variant="neutral" size="icon-lg" aria-label="返回实验室" onClick={()=>{halt();onBack()}}><ArrowLeft/></Button><h2>音频实验</h2><Headphones aria-hidden="true"/></header>
  <Card className="p-3 bg-[#FFDB63]"><strong>Cozy Party · EP Vol. 01</strong><small>12 套 EP · 24 首原创循环候选 · 12 类事件音效</small><small>V2 · 真实钢琴和尼龙吉他采样、重新编曲、柔和拟音。选择后可在游戏中体验。</small></Card>
  {profile&&<Card className="p-3 gap-2 bg-secondary-background"><strong>游戏声音 {profile.enabled?"已开启":"已关闭"}</strong><small>休闲：{albums.find(a=>a.id===profile.lounge)?.title} · 游戏：{albums.find(a=>a.id===profile.play)?.title} · 音效：{albums.find(a=>a.id===profile.sfx)?.title}</small><label className="flex items-center gap-2">背景音乐<input aria-label="游戏背景音乐音量" className="min-w-0 flex-1" type="range" min="0" max="1" step=".05" value={profile.music} onChange={e=>onApply({...profile,music:+e.target.value})}/><span>{Math.round(profile.music*100)}%</span></label><label className="flex items-center gap-2">游戏音效<input aria-label="游戏音效音量" className="min-w-0 flex-1" type="range" min="0" max="1" step=".05" value={profile.effects} onChange={e=>onApply({...profile,effects:+e.target.value})}/><span>{Math.round(profile.effects*100)}%</span></label><Button variant="neutral" onClick={()=>{halt();onApply({...profile,enabled:!profile.enabled})}}>{profile.enabled?"关闭游戏声音":"开启游戏声音"}</Button></Card>}
  <label className="group font-bold">卡组主题<select className="min-h-12 rounded-base border-2 bg-secondary-background px-2" value={theme} onChange={e=>changeTheme(e.target.value as DeckThemeId|"all")}><option value="all">全部主题 · 12 套 EP</option>{deckThemes.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
  <div className="options" role="group" aria-label="试听类型">{(["lounge","play","sfx"] as const).map(s=><Button key={s} variant="noShadow" className={"min-h-11 "+(tab===s?"bg-[#80D9A8]":"bg-secondary-background")} aria-pressed={tab===s} onClick={()=>changeTab(s)}>{labels[s]}</Button>)}</div>
  <div className="flex items-center gap-2"><label className="flex flex-1 items-center gap-2 text-sm font-bold">音量 <input aria-label="试听音量" className="min-w-0 flex-1 accent-[#6B6256]" type="range" min="0" max="1" step=".05" value={volume} onChange={e=>setVolume(+e.target.value)}/><span>{Math.round(volume*100)}%</span></label><Button variant="neutral" disabled={!active} onClick={halt}><Square size={16}/>停止</Button></div>
  <small role="status" aria-live="polite">{message||(busy?"正在渲染原创音频…":active?"正在试听："+albums.find(a=>active.startsWith(a.id+":"))?.title:"选择一套 EP 开始试听")}</small>
  {visible.map(a=>{const pickKey=a.theme+":"+tab,chosen=review.picks[pickKey]===a.id,noteKey=a.id+":"+tab,playing=active===a.id+":"+tab;return <Card key={a.id} className="p-3 gap-3 bg-secondary-background" data-testid="audio-ep">
   <div className="flex items-center gap-3"><div aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-base border-2 font-black" style={{background:a.palette}}>{a.id.slice(-2)}</div><div className="min-w-0 flex-1"><strong className="block">{a.title}</strong><small>{deckThemes.find(t=>t.id===a.theme)?.name} · {a.description}</small></div></div>
   {tab==="sfx"?<div className="grid2">{effects.map(([id,label])=><Button key={id} variant="noShadow" className={"min-h-11 whitespace-normal "+(active===a.id+":"+id?"bg-[#FFDB63]":"bg-secondary-background")} aria-label={a.title+" "+label} onClick={()=>void audition(a,id)}>{active===a.id+":"+id?<Square size={14}/>:<Play size={14}/>} {label}</Button>)}</div>:<><small>{a.tempo[tab==="lounge"?0:1]} BPM · {Math.round(loopSeconds(a,tab))} 秒循环 · 无人声</small><Button className="min-h-12 bg-[#FFDB63]" aria-label={a.title+" "+(playing?"停止":"试听")} onClick={()=>void audition(a)}>{playing?<Square/>:<Play/>}{playing?(busy?"取消渲染":"停止试听"):"试听循环"}</Button></>}
   <Button variant="noShadow" className={"min-h-11 "+(chosen?"bg-[#80D9A8]":"bg-secondary-background")} aria-pressed={chosen} onClick={()=>{const picks={...review.picks};if(chosen)delete picks[pickKey];else picks[pickKey]=a.id;persist({...review,picks})}}>{chosen?"已选为此主题候选":"选为此主题候选"}</Button>
   <Button className="min-h-11 bg-[#80D9A8]" aria-label={a.title+" 应用到游戏"} onClick={()=>apply(a)}>{profile?.enabled&&profile[tab]===a.id?"当前使用 · 重新应用":"应用到游戏"}</Button>
   <label className="group text-sm">试听反馈<textarea rows={2} className="w-full rounded-base border-2 bg-secondary-background p-2 text-base" value={review.notes[noteKey]??""} onChange={e=>persist({...review,notes:{...review.notes,[noteKey]:e.target.value}})} placeholder="旋律、节奏、音色、需要修改的地方"/></label>
  </Card>})}
  <Button variant="neutral" className="min-h-12" onClick={exportReview}><Download/>导出试听记录</Button>
 </section>
}
