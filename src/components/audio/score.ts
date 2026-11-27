import type {DeckThemeId} from "@/services/deckTheme";
import {planMusic,roles,targetRms,activeRms} from "./arrangement";

export type Scene="lounge"|"play";
export type Voice="guitar"|"rhodes"|"marimba"|"bass"|"pizz"|"harp"|"bell"|"wood"|"brush"|"kick";
type Groove="bossa"|"swing"|"folk"|"waltz"|"funk"|"chamber";
export type Album={id:string;theme:DeckThemeId;title:string;description:string;tempo:[number,number];key:number;groove:Groove;lead:Voice;chord:Voice;accent:Voice;palette:string;progression:number};
export const albums:Album[]=[
 {id:"ep01",theme:"original",title:"午后微风",description:"尼龙吉他 · 温暖 Bossa · 柔和贝斯",tempo:[84,112],key:0,groove:"bossa",lead:"guitar",chord:"rhodes",accent:"marimba",palette:"#F2D18C",progression:0},
 {id:"ep02",theme:"original",title:"咖啡与桌游",description:"真实钢琴 · 轻爵士 · 拨弦低音",tempo:[78,108],key:2,groove:"swing",lead:"rhodes",chord:"guitar",accent:"marimba",palette:"#D9B99B",progression:1},
 {id:"ep03",theme:"original",title:"周末开盒",description:"木质旋律 · 尼龙吉他 · 原声民谣",tempo:[88,116],key:5,groove:"folk",lead:"marimba",chord:"guitar",accent:"pizz",palette:"#B8D5A2",progression:2},
 {id:"ep04",theme:"warm",title:"琥珀时光",description:"真实钢琴 · 指弹吉他 · 暖金泛音",tempo:[82,110],key:0,groove:"bossa",lead:"rhodes",chord:"guitar",accent:"bell",palette:"#E3BE7D",progression:1},
 {id:"ep05",theme:"warm",title:"蜂蜜小夜曲",description:"尼龙吉他 · 轻圆舞曲 · 钢琴",tempo:[87,120],key:5,groove:"waltz",lead:"guitar",chord:"rhodes",accent:"harp",palette:"#E9CD99",progression:2},
 {id:"ep06",theme:"metal",title:"流金律动",description:"真实钢琴 · 轻 Funk · 柔和贝斯",tempo:[86,118],key:3,groove:"funk",lead:"rhodes",chord:"guitar",accent:"bell",palette:"#DEC27E",progression:3},
 {id:"ep07",theme:"balatro",title:"纸箔游乐场",description:"木琴 · 钢琴切分 · 轻快节拍",tempo:[90,120],key:2,groove:"funk",lead:"marimba",chord:"rhodes",accent:"bell",palette:"#C6B9E6",progression:2},
 {id:"ep08",theme:"gwent",title:"工匠的茶会",description:"尼龙吉他 · 真实钢琴 · 室内乐",tempo:[80,112],key:0,groove:"chamber",lead:"guitar",chord:"rhodes",accent:"harp",palette:"#CFB98F",progression:3},
 {id:"ep09",theme:"gwent",title:"黄铜八音盒",description:"轻圆舞曲 · 钢琴 · 柔和金属点缀",tempo:[84,114],key:5,groove:"waltz",lead:"rhodes",chord:"guitar",accent:"bell",palette:"#D6BC84",progression:0},
 {id:"ep10",theme:"infernal",title:"炉火旁的朋友",description:"尼龙吉他 · 木质节奏 · 温暖低音",tempo:[78,108],key:3,groove:"folk",lead:"guitar",chord:"rhodes",accent:"wood",palette:"#E2AD89",progression:1},
 {id:"ep11",theme:"occult",title:"烛光与木刻",description:"指弹吉他 · 真实钢琴 · 烛光民谣",tempo:[76,106],key:2,groove:"chamber",lead:"guitar",chord:"rhodes",accent:"marimba",palette:"#C8C5A3",progression:3},
 {id:"ep12",theme:"occult",title:"星光小游戏",description:"柔和钢琴 · 轻爵士 · 星光点缀",tempo:[82,114],key:0,groove:"swing",lead:"rhodes",chord:"guitar",accent:"harp",palette:"#D1C4E4",progression:0},
];
export const effects=[["tap","按键"],["select","选择"],["back","返回"],["start","开始"],["correct","答对"],["skip","换题"],["handoff","玩家轮换"],["finish","结算"],["flip1","简单翻牌"],["flip2","中等翻牌"],["flip3","困难翻牌"],["flip4","地狱翻牌"]] as const;
export type Effect=typeof effects[number][0];
const sr=32000,tau=2*Math.PI;
function random(seed:number){let x=seed|0;return()=>{x=(Math.imul(x,1664525)+1013904223)|0;return (x>>>0)/4294967296}}
function frequency(note:number){return 440*Math.pow(2,(note-69)/12)}
const roots={piano:[48,57,60,65,72],guitar:[45,48,57,60,69,77]} as const;
type SampleKind=keyof typeof roots;
type SampleBank=Map<string,AudioBuffer>;
const sampleBytes=new Map<string,Promise<ArrayBuffer>>(),decodedSamples=new Map<string,Promise<AudioBuffer>>();
function sampledKind(voice:Voice):SampleKind|undefined{
 if(voice==="rhodes")return "piano";
 if(voice==="guitar"||voice==="pizz"||voice==="harp")return "guitar";
}
async function loadSamples(ctx:BaseAudioContext,kinds:SampleKind[]):Promise<SampleBank>{
 const bank:SampleBank=new Map();
 await Promise.all([...new Set(kinds)].flatMap(kind=>roots[kind].map(async root=>{
  const id=kind+"-"+root;let request=sampleBytes.get(id);
  if(!request){request=fetch(import.meta.env.BASE_URL+"audio-samples/v2/"+id+".ogg").then(r=>{if(!r.ok)throw Error("Sample unavailable: "+id);return r.arrayBuffer()});sampleBytes.set(id,request);request.catch(()=>sampleBytes.delete(id))}
  const cacheKey=ctx.sampleRate+":"+id;let decoded=decodedSamples.get(cacheKey);
  if(!decoded){decoded=(async()=>{
   const raw=await ctx.decodeAudioData((await request).slice(0));
   // Preserve the attack and decay; keep only the audible portion used by the score.
   const frames=Math.min(raw.length,Math.ceil(raw.sampleRate*3.5)),trim=ctx.createBuffer(raw.numberOfChannels,frames,raw.sampleRate);
   let peak=0;for(let ch=0;ch<raw.numberOfChannels;ch++){const a=raw.getChannelData(ch);for(let i=0;i<frames;i++)peak=Math.max(peak,Math.abs(a[i]))}
   if(!peak)throw Error("Empty sample: "+id);
   const rawChannels=Array.from({length:raw.numberOfChannels},(_,ch)=>raw.getChannelData(ch).subarray(0,Math.min(frames,Math.round(raw.sampleRate*.8))));
   const rms=activeRms(rawChannels,raw.sampleRate),gain=Math.min(.72/peak,.13/Math.max(rms,.001));for(let ch=0;ch<raw.numberOfChannels;ch++){const src=raw.getChannelData(ch),a=trim.getChannelData(ch);for(let i=0;i<frames;i++)a[i]=src[i]*gain*Math.min(1,(frames-i)/(raw.sampleRate*.06))}
   return trim
  })();decodedSamples.set(cacheKey,decoded);decoded.catch(()=>decodedSamples.delete(cacheKey))}
  bank.set(id,await decoded)
 })));
 return bank
}
function synth(ctx:BaseAudioContext,voice:Voice,note:number){
 const length=voice==="bass"?1.5:voice==="brush"?.15:voice==="wood"?.12:voice==="kick"?.16:1.6;
 const b=ctx.createBuffer(1,Math.ceil(length*ctx.sampleRate),ctx.sampleRate),a=b.getChannelData(0),f=frequency(note),r=random(note*101+voice.length*17);let lp=0;
 for(let i=0;i<a.length;i++){
  const t=i/ctx.sampleRate,p=tau*f*t,noise=r()*2-1;lp=.82*lp+.18*noise;
  let v=0;
  if(voice==="bass")v=(Math.sin(p)+.21*Math.sin(2*p)*Math.exp(-t*3)+.045*Math.sin(3*p)*Math.exp(-t*6))*.53*Math.exp(-t*2.2);
  else if(voice==="marimba")v=(Math.sin(p)*Math.exp(-t*6)+.14*Math.sin(3.99*p)*Math.exp(-t*22))*.63;
  else if(voice==="bell")v=(Math.sin(p)*Math.exp(-t*7)+.095*Math.sin(2.01*p)*Math.exp(-t*11))*.57;
  else if(voice==="kick")v=Math.sin(tau*(49*t+1.2*(1-Math.exp(-t*30))))*Math.exp(-t*30)*.53;
  else if(voice==="brush")v=(lp*.65+(noise-lp)*.10)*Math.exp(-t*24);
  else v=(lp*.42+Math.sin(p)*.18)*Math.exp(-t*40);
  a[i]=v*Math.min(1,t/.004)*Math.min(1,(a.length-i)/(ctx.sampleRate*.025))
 }
 return b
}
function instruments(ctx:BaseAudioContext,output:AudioNode,bank:SampleBank){
 const cache=new Map<string,AudioBuffer>();
 return (voice:Voice,pitch:number,at:number,duration:number,velocity:number,pan=0)=>{
  const kind=sampledKind(voice);let b:AudioBuffer|undefined,rate=1;
  if(kind){const root=roots[kind].reduce((a,c)=>Math.abs(c-pitch)<Math.abs(a-pitch)?c:a);b=bank.get(kind+"-"+root);rate=Math.pow(2,(pitch-root)/12)}
  if(!b){const key=voice+":"+pitch;b=cache.get(key);if(!b){b=synth(ctx,voice,pitch);cache.set(key,b)}}
  const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;s.playbackRate.value=rate;
  const length=Math.min(duration,b.duration/rate),release=Math.min(kind?.18:.095,length*.43),attack=Math.min(kind?(voice==="rhodes"?.018:.011):.006,length*.2);
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(velocity,at+attack);g.gain.setValueAtTime(velocity,at+length-release);g.gain.linearRampToValueAtTime(0,at+length);
  s.connect(g);if(typeof ctx.createStereoPanner==="function"){const p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(output)}else g.connect(output);
  s.start(at);s.stop(at+length+.002)
 }
}
export function loopSeconds(album:Album,scene:Scene){return 16*(album.groove==="waltz"?3:4)*60/album.tempo[scene==="lounge"?0:1]}
export async function renderMusic(album:Album,scene:Scene):Promise<AudioBuffer>{
 const plan=planMusic(album,scene),frames=Math.round(plan.seconds*sr);
 // Render stems independently, measure their actual active RMS, then mix at deliberate
 // role-relative levels. A common soft low-pass keeps bright attacks out of the foreground.
 const output=new AudioBuffer({numberOfChannels:2,length:frames,sampleRate:sr});
 for(const role of roles){
  const notes=plan.notes.filter(n=>n.role===role);if(!notes.length)continue;
  const ctx=new OfflineAudioContext(2,frames,sr),filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=role==="lead"?5300:role==="harmony"?3000:role==="bass"?700:2200;filter.Q.value=.5;filter.connect(ctx.destination);
  const bank=await loadSamples(ctx,notes.flatMap(n=>{const k=sampledKind(n.voice);return k?[k]:[]}));
  const note=instruments(ctx,filter,bank);
  for(const n of notes)note(n.voice,n.pitch,n.start,n.duration,n.velocity,n.pan);
  const stem=await ctx.startRendering(),channels=[stem.getChannelData(0),stem.getChannelData(1)],rms=activeRms(channels,sr);
  if(!Number.isFinite(rms)||rms<1e-6)throw Error("Invalid "+role+" stem");
  const f=targetRms[role]/rms;
  for(let ch=0;ch<2;ch++){const to=output.getChannelData(ch),from=channels[ch];for(let i=0;i<frames;i++)to[i]+=from[i]*f}
 }
 let peak=0;for(let ch=0;ch<2;ch++)for(const v of output.getChannelData(ch))peak=Math.max(peak,Math.abs(v));
 if(!Number.isFinite(peak)||peak<.001)throw Error("Invalid music mix");
 const gain=Math.min(1,.48/peak),fade=Math.round(sr*.012);
 for(let ch=0;ch<2;ch++){const a=output.getChannelData(ch);for(let i=0;i<frames;i++)a[i]*=gain*Math.min(1,i/fade,(frames-1-i)/fade)}
 return output
}
// Real card handling recordings, with a synthesized fallback if a sample cannot decode.
async function foleySample(ctx:BaseAudioContext,id:string):Promise<AudioBuffer>{
 const key=ctx.sampleRate+":"+id;let decoded=decodedSamples.get(key);
 if(!decoded){decoded=(async()=>{
  const r=await fetch(import.meta.env.BASE_URL+"audio-samples/v2/"+id+".ogg");if(!r.ok)throw Error("Foley unavailable");
  const b=await ctx.decodeAudioData(await r.arrayBuffer());let peak=0;for(let ch=0;ch<b.numberOfChannels;ch++)for(const v of b.getChannelData(ch))peak=Math.max(peak,Math.abs(v));
  if(!peak)throw Error("Empty foley");
  for(let ch=0;ch<b.numberOfChannels;ch++){const a=b.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]*=.68/peak}
  return b
 })();decodedSamples.set(key,decoded);decoded.catch(()=>decodedSamples.delete(key))}
 return decoded
}
export async function renderEffect(album:Album,event:Effect):Promise<AudioBuffer>{
 const duration=event==="finish"?1.15:event==="handoff"?.62:event==="start"?.55:event==="flip4"?.62:event==="flip3"?.42:event==="flip2"?.28:event==="flip1"?.19:event==="correct"?.32:event==="skip"?.16:.13;
 const ctx=new OfflineAudioContext(2,Math.ceil(sr*duration),sr),bus=ctx.createGain(),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=3900;bus.gain.value=.62;bus.connect(lp);lp.connect(ctx.destination);
 // Mostly unpitched tactile feedback; tonal cues are short, rounded and in the EP key.
 const note=instruments(ctx,bus,new Map()),k=album.key;
 const needsCard=event.startsWith("flip")||event==="skip";
 const [slide,place]=needsCard?await Promise.all([foleySample(ctx,"card-slide").catch(()=>null),foleySample(ctx,"card-place").catch(()=>null)]):[null,null];
 const recorded=(b:AudioBuffer|null,t:number,d:number,volume:number,rate=1)=>{if(!b)return false;const node=ctx.createBufferSource(),g=ctx.createGain(),length=Math.min(d,b.duration/rate);node.buffer=b;node.playbackRate.value=rate;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.003);g.gain.setValueAtTime(volume,t+Math.max(.003,length-.023));g.gain.linearRampToValueAtTime(0,t+length);node.connect(g);g.connect(bus);node.start(t);node.stop(t+length+.002);return true};
 const material=album.theme==="metal"||album.theme==="gwent"?"bell":album.theme==="infernal"?"wood":"marimba";
 const hit=(p:number,t:number,a=.17,d=.18)=>note(material,p+k,t,d,a,.03);
 const paper=(at:number,d:number,level=1)=>{const b=ctx.createBuffer(1,Math.round(d*sr),sr),a=b.getChannelData(0),r=random(429+album.key+level*13),s=ctx.createBufferSource(),filter=ctx.createBiquadFilter();let smooth=0;for(let i=0;i<a.length;i++){const f=i/a.length,noise=r()*2-1;smooth=.7*smooth+.3*noise;a[i]=(noise-smooth*.9)*Math.sin(Math.PI*f)**2*.23}filter.type="bandpass";filter.frequency.value=album.theme==="original"?1150:1550;filter.Q.value=.55;s.buffer=b;s.connect(filter);filter.connect(bus);s.start(at)};
 if(event.startsWith("flip")){
  const level=Number(event.slice(-1));if(!recorded(slide,0,.115+level*.025,.20+level*.015,1.08-level*.04))paper(0,.115+level*.025,level);if(!recorded(place,.075+level*.025,.09+level*.01,.18,1.02))note("wood",53,.075+level*.025,.085,.15+level*.015);
  if(level>1)note("wood",48+level*2,.115+level*.025,.09+level*.012,.035+level*.009);
  if(level===4)paper(.18,.24,level);
 }else if(event==="tap"){note("wood",57,0,.085,.22)}
 else if(event==="select"){note("wood",64,0,.09,.19)}
 else if(event==="back"){note("wood",48,0,.085,.18)}
 else if(event==="skip"){if(!recorded(slide,0,.145,.25,1.15))paper(0,.125);if(!recorded(place,.065,.09,.13,1.15))note("wood",53,.045,.08,.14)}
 else if(event==="correct"){note("wood",64,0,.09,.20);note("wood",72,.09,.12,.12)}
 else if(event==="start"){hit(60,0,.19,.15);hit(64,.095,.17,.17);hit(67,.19,.19,.29)}
 else if(event==="handoff"){hit(64,0,.15,.15);hit(67,.12,.19,.2);hit(60,.25,.16,.29)}
 else{hit(60,0,.18,.24);hit(64,.12,.18,.24);hit(67,.24,.17,.29);hit(72,.36,.15,.65);note("bass",48+k,.36,.54,.11)}
 const rendered=await ctx.startRendering();let peak=0;for(let c=0;c<2;c++)for(const v of rendered.getChannelData(c))peak=Math.max(peak,Math.abs(v));
 const frequent=event.startsWith("flip")||event==="tap"||event==="select"||event==="back"||event==="skip"||event==="correct";
 const g=Math.min(1.35,(frequent?.105:.15)/Math.max(peak,.001));for(let c=0;c<2;c++){const a=rendered.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=g}
 return rendered
}
