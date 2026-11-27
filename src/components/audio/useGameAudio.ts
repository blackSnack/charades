import {useEffect,useRef,useState} from "react";
import type {AudioProfile} from "@/services/audioPreference";
import type {Effect,Scene} from "./score";
import type {Game} from "@/core/game";
type Score=typeof import("./score");
type Playing={node:AudioBufferSourceNode;gain:GainNode};
export function gameCue(events:string[],g:Game|null):Effect|undefined{
 if(events.includes("GAME_ENDED"))return "finish";
 if(events.includes("TURN_COMPLETED"))return "handoff";
 if(events.includes("TURN_ABANDONED")||events.includes("QUESTION_ABANDONED"))return "skip";
 if(events.includes("ANSWER_CORRECT"))return "correct";
 if(events.includes("QUESTION_SKIPPED"))return "skip";
 if(events.includes("GAME_STARTED")||events.includes("TURN_STARTED"))return "start";
 if(events.includes("QUESTION_CHANGED")&&g?.current)return (["flip1","flip2","flip3","flip4"] as const)[g.current.level-1]??"flip1";
}
class Player{
 readonly context=new AudioContext();
 private score:Promise<Score>|null=null;
 private cache=new Map<string,Promise<AudioBuffer>>();
 private music:Playing|null=null;
 private effect:Playing|null=null;
 private musicToken=0;
 private effectToken=0;
 private desired="";
 private profile:AudioProfile|null=null;
 private allowed=false;
 private musicQuietUntil=0;
 constructor(private onState:(s:string)=>void,private onCue:(s:string)=>void){}
 private module(){if(!this.score)this.score=import("./score").catch(e=>{this.score=null;throw e});return this.score}
 async buffer(id:string,key:Scene|Effect){
  const k=id+":"+key;let task=this.cache.get(k);
  if(!task){task=this.module().then(s=>{const a=s.albums.find(a=>a.id===id);if(!a)throw Error("Unknown EP");return key==="lounge"||key==="play"?s.renderMusic(a,key):s.renderEffect(a,key)});this.cache.set(k,task);task.catch(()=>this.cache.delete(k));if(this.cache.size>18){const oldest=this.cache.keys().next().value;if(oldest)this.cache.delete(oldest)}}
  return task
 }
 private stop(p:Playing|null,fade=.075){
  if(!p)return;const t=this.context.currentTime;
  try{p.gain.gain.cancelScheduledValues(t);p.gain.gain.setValueAtTime(p.gain.gain.value,t);p.gain.gain.linearRampToValueAtTime(0,t+fade);p.node.stop(t+fade+.01)}catch{}
 }
 stopAll(){this.allowed=false;this.desired="";this.musicToken++;this.effectToken++;this.stop(this.music);this.stop(this.effect,.03);this.music=null;this.effect=null;this.onState("");this.onCue("")}
 async configure(profile:AudioProfile|null,scene:Scene|null){
  this.profile=profile;
  if(!profile?.enabled||!scene){this.stopAll();return}
  this.allowed=true;
  const id=profile[scene],key=id+":"+scene;
  if(this.desired===key){if(this.music)this.music.gain.gain.setTargetAtTime(profile.music,this.context.currentTime,.12);return}
  this.desired=key;const generation=++this.musicToken;this.onState("loading");
  try{
   const b=await this.buffer(id,scene);
   if(generation!==this.musicToken||!this.allowed)return;
   const old=this.music,now=this.context.currentTime,node=this.context.createBufferSource(),gain=this.context.createGain();
   // The two arrangements may use unrelated harmonies. Fade through silence, not through each other.
   if(old){this.stop(old,.20);this.musicQuietUntil=Math.max(this.musicQuietUntil,now+.22)}
   const start=Math.max(now,this.musicQuietUntil);node.buffer=b;node.loop=true;node.connect(gain);gain.connect(this.context.destination);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(this.profile?.music??0,start+.48);
   node.onended=()=>{node.disconnect();gain.disconnect()};node.start(start);this.music={node,gain};this.onState(scene);
  }catch{if(generation===this.musicToken){this.desired="";this.onState("error")}}
 }
 warm(profile:AudioProfile){void this.buffer(profile.lounge,"lounge").catch(()=>{});void this.buffer(profile.play,"play").catch(()=>{});for(const e of ["tap","select","back","start","correct","skip","handoff","finish","flip1","flip2","flip3","flip4"] as const)void this.buffer(profile.sfx,e).catch(()=>{})}
 async cue(event:Effect){
  const p=this.profile;if(!p?.enabled||!this.allowed||p.effects===0||this.context.state!=="running")return;
  const generation=++this.effectToken,started=performance.now();
  try{
   const b=await this.buffer(p.sfx,event);
   if(generation!==this.effectToken||!this.allowed||performance.now()-started>300||this.profile?.sfx!==p.sfx)return;
   this.stop(this.effect,.025);const node=this.context.createBufferSource(),gain=this.context.createGain(),now=this.context.currentTime;
   node.buffer=b;node.connect(gain);gain.connect(this.context.destination);gain.gain.value=this.profile.effects*.78;
   node.onended=()=>{node.disconnect();gain.disconnect();if(this.effect?.node===node)this.effect=null};node.start();this.effect={node,gain};this.onCue(event);
   // Mild ducking for game events, never for a normal UI tap.
   // Frequent cues are deliberately quiet and do not pump the music fader. For a scene transition,
   // the existing fade-through-silence already separates the musical cue from the next arrangement.
  }catch{}
 }
 close(){this.stopAll();void this.context.close().catch(()=>{})}
}
export function useGameAudio(profile:AudioProfile|null,page:string,g:Game|null,serial:number,events:string[]){
 const player=useRef<Player|null>(null),[ready,setReady]=useState(false),[visible,setVisible]=useState(!document.hidden),[status,setStatus]=useState(""),[lastCue,setLastCue]=useState("");
 const experimental=page==="lab"||page==="cardLab"||page==="audioLab";
 const scene:Scene|null=experimental?null:page==="game"&&g?.phase==="play"?"play":"lounge";
 function unlock(p=profile){if(!p?.enabled)return;
  try{const engine=player.current??new Player(setStatus,setLastCue);player.current=engine;
   if(engine.context.state==="running"){setReady(true);return}
   void engine.context.resume().then(()=>{if(player.current===engine)setReady(true)}).catch(()=>{setStatus("error")})
  }catch{setStatus("error")}
 }
 useEffect(()=>{const onVisibility=()=>{setVisible(!document.hidden);if(document.hidden)player.current?.stopAll();else if(player.current?.context.state!=="running")setReady(false)};document.addEventListener("visibilitychange",onVisibility);return()=>{document.removeEventListener("visibilitychange",onVisibility);const p=player.current;player.current=null;p?.close()}},[]);
 useEffect(()=>{if(ready&&visible&&profile?.enabled)player.current?.warm(profile)},[ready,visible,profile?.lounge,profile?.play,profile?.sfx,profile?.enabled]);
 useEffect(()=>{if(player.current)void player.current.configure(profile,ready&&visible?scene:null)},[profile,scene,ready,visible]);
 const lastSerial=useRef(0);
 useEffect(()=>{if(serial===lastSerial.current)return;lastSerial.current=serial;if(!ready||!visible||experimental)return;const cue=gameCue(events,g);if(cue)void player.current?.cue(cue)},[serial,events,g,ready,visible,experimental]);
 return {unlock,status,lastCue,tap:()=>{if(!experimental&&visible&&page!=="game"&&page!=="confirm"&&page!=="abandon")void player.current?.cue("tap")}}
}
