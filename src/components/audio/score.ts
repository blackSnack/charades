import type {DeckThemeId} from "@/services/deckTheme";

export type Scene="lounge"|"play";
type Voice="guitar"|"rhodes"|"marimba"|"bass"|"pizz"|"harp"|"bell"|"wood"|"brush"|"kick";
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
// Explicit diatonic voicings and written phrases. Degrees are relative to C major.
const chordTable=[
 {root:48,notes:[55,60,64,69]}, // C6
 {root:45,notes:[55,60,64,69]}, // Am7
 {root:50,notes:[57,60,65,69]}, // Dm7
 {root:43,notes:[55,59,62,65]}, // G7
 {root:41,notes:[53,57,60,64]}, // Fmaj7
 {root:52,notes:[55,59,64,67]}, // Em7
];
const progressions=[
 [0,1,2,3,0,4,2,3,4,5,2,3,0,1,2,3],
 [0,5,1,3,4,0,2,3,1,5,4,0,2,3,0,3],
 [0,4,1,3,0,4,2,3,4,0,1,3,4,0,2,3],
 [0,1,4,3,0,5,2,3,4,0,2,3,1,4,2,3],
];
// A phrase has a beginning, response, breath and cadence. Four different contours,
// stable across lounge/play; no chord-index-generated melody or gratuitous octave jumps.
type PhraseNote=[number,number,number,number]; // beat in 4/4, MIDI, duration in beats, dynamic
const phrases:PhraseNote[][][]=[
 [
 [[.5,64,.85,.85],[1.5,67,.7,1],[2.5,69,1.15,.85]],
 [[0,67,1.3,.8],[1.75,64,.65,.76],[2.5,60,1.2,.72]],
 [[.5,62,.85,.76],[1.5,65,.7,.91],[2.5,69,1.15,.82]],
 [[0,67,1.6,.8],[2.5,62,.65,.72]],
 [[.5,64,.85,.85],[1.5,67,.7,.95],[2.5,72,1.15,.87]],
 [[0,69,1.5,.83],[2,67,.8,.76],[3,64,.6,.7]],
 [[.5,65,.8,.86],[1.5,64,.65,.78],[2.5,62,1,.75]],
 [[0,59,1.2,.72],[1.5,62,.75,.73],[2.5,60,1,.68]],
 ],
 [
 [[0,67,1.4,.85],[1.75,64,.7,.75],[2.75,62,.8,.72]],
 [[.5,64,.8,.81],[1.5,67,.7,.92],[2.5,71,1,.8]],
 [[0,69,1.4,.88],[2,67,.7,.72],[3,64,.7,.74]],
 [[.5,62,1.25,.78],[2,59,1.35,.72]],
 [[0,60,.85,.75],[1,64,.8,.86],[2,65,1.6,.89]],
 [[.5,67,1.5,.84],[2.5,64,.8,.73]],
 [[0,65,1.15,.84],[1.5,62,.8,.78],[2.5,65,.8,.76]],
 [[0,62,1.1,.77],[1.5,59,.8,.73],[2.5,60,1,.7]],
 ],
 [
 [[0,60,.8,.83],[1,64,.8,.9],[2,67,1.5,.92]],
 [[.5,69,.85,.9],[1.5,67,.85,.8],[2.5,64,1,.76]],
 [[0,64,1.15,.8],[1.5,67,.8,.85],[2.5,69,1.1,.89]],
 [[0,67,1.4,.83],[2,62,1.4,.72]],
 [[.5,60,.8,.77],[1.5,64,.7,.86],[2.5,67,1.1,.91]],
 [[0,69,1.3,.88],[1.75,72,.65,.85],[2.5,69,.9,.78]],
 [[.5,65,.9,.83],[1.75,64,.7,.8],[2.75,62,.8,.75]],
 [[0,59,1,.7],[1.5,62,.8,.76],[2.5,60,1,.69]],
 ],
 [
 [[.5,64,1.05,.84],[2,67,1.45,.9]],
 [[0,69,.85,.88],[1,67,.8,.82],[2,64,1.4,.78]],
 [[.5,65,1.2,.84],[2,69,.8,.87],[3,67,.6,.74]],
 [[0,62,1.5,.8],[2,59,1.3,.7]],
 [[.5,64,.8,.83],[1.5,67,.7,.87],[2.5,69,1.15,.91]],
 [[0,71,.85,.83],[1,69,.8,.8],[2,67,1.4,.76]],
 [[.5,65,.85,.84],[1.5,64,.7,.79],[2.5,62,1.1,.74]],
 [[0,62,1.1,.77],[1.5,59,.8,.7],[2.5,60,1,.67]],
 ],
];
function random(seed:number){let x=seed|0;return()=>{x=(Math.imul(x,1664525)+1013904223)|0;return (x>>>0)/4294967296}}
function frequency(note:number){return 440*Math.pow(2,(note-69)/12)}
const roots={piano:[48,57,60,65,72],guitar:[45,48,57,60,69,77]} as const;
type SampleKind=keyof typeof roots;
type SampleBank=Map<string,AudioBuffer>;
const sampleBytes=new Map<string,Promise<ArrayBuffer>>();
function sampledKind(voice:Voice):SampleKind|undefined{
 if(voice==="rhodes")return "piano";
 if(voice==="guitar"||voice==="pizz"||voice==="harp")return "guitar";
}
async function loadSamples(ctx:BaseAudioContext,kinds:SampleKind[]):Promise<SampleBank>{
 const bank:SampleBank=new Map();
 await Promise.all([...new Set(kinds)].flatMap(kind=>roots[kind].map(async root=>{
  const id=kind+"-"+root;let request=sampleBytes.get(id);
  if(!request){request=fetch(import.meta.env.BASE_URL+"audio-samples/v2/"+id+".ogg").then(r=>{if(!r.ok)throw Error("Sample unavailable: "+id);return r.arrayBuffer()});sampleBytes.set(id,request);request.catch(()=>sampleBytes.delete(id))}
  const raw=await ctx.decodeAudioData((await request).slice(0));
  // Normalize note-to-note differences but preserve decay, stereo and playing texture.
  let peak=0;for(let ch=0;ch<raw.numberOfChannels;ch++){const a=raw.getChannelData(ch);for(let i=0;i<a.length;i++)peak=Math.max(peak,Math.abs(a[i]))}
  if(!peak)throw Error("Empty sample: "+id);
  const gain=.68/peak;for(let ch=0;ch<raw.numberOfChannels;ch++){const a=raw.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]*=gain}
  bank.set(id,raw)
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
  const length=Math.min(duration,b.duration/rate),release=Math.min(.13,length*.43);
  g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(velocity,at+Math.min(.005,length*.2));g.gain.setValueAtTime(velocity,at+length-release);g.gain.linearRampToValueAtTime(0,at+length);
  s.connect(g);if(typeof ctx.createStereoPanner==="function"){const p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(output)}else g.connect(output);
  s.start(at);s.stop(at+length+.002)
 }
}
export function loopSeconds(album:Album,scene:Scene){return 16*(album.groove==="waltz"?3:4)*60/album.tempo[scene==="lounge"?0:1]}
export async function renderMusic(album:Album,scene:Scene):Promise<AudioBuffer>{
 const play=scene==="play",beat=60/album.tempo[play?1:0],meter=album.groove==="waltz"?3:4,seconds=loopSeconds(album,scene),frames=Math.round(seconds*sr),tail=Math.ceil(2.4*sr);
 const ctx=new OfflineAudioContext(2,frames+tail,sr),bus=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=play?7200:5800;bus.gain.value=.8;bus.connect(filter);filter.connect(ctx.destination);
 const bank=await loadSamples(ctx,([album.lead,album.chord] as Voice[]).flatMap(v=>{const k=sampledKind(v);return k?[k]:[]}));
 const note=instruments(ctx,bus,bank),r=random(71+album.key*11+album.progression*51),prog=progressions[album.progression],phrase=phrases[album.progression];
 const n=(v:Voice,p:number,t:number,d:number,a:number,pan=0)=>note(v,p,Math.max(0,t+(r()-.5)*.021),d,a*(.88+r()*.21),pan);
 for(let bar=0;bar<16;bar++){
  const c=chordTable[prog[bar]],start=bar*meter*beat,scale=meter/4;
  const bassPattern=meter===3?[0,2]:play&&album.groove==="bossa"?[0,1.5,2.5]:play&&album.groove==="funk"?[0,1.5,3]:[0,2];
  bassPattern.forEach((b,i)=>n("bass",c.root+album.key-12+(i===0?0:7),start+b*beat,beat*(i===0?1.35:.82),i===0?.12:.087,-.02));
  // Two or three voices, close voice-leading. No high accent track doubling the melody.
  const pitches=c.notes.slice(0,3).map(p=>p+album.key);
  const guitar=album.chord==="guitar",pattern=meter===3?[0,1,2]:album.groove==="bossa"?[.5,1.5,3]:album.groove==="funk"&&play?[.5,1.75,3]:[0,2];
  pattern.forEach((b,i)=>{
   if(!play&&i===2&&bar%2===1)return;
   if(guitar){pitches.forEach((p,j)=>n(album.chord,p,start+b*beat+j*.023,beat*(i===0?1.25:.84),(.043-j*.004)*(i===0?1:.76),-.14))}
   else pitches.forEach((p,j)=>n(album.chord,p,start+b*beat+j*.009,beat*(i===0?1.55:1.1),(.038-j*.003)*(i===0?1:.72),-.12))
  });
  const melody=phrase[bar%8];const resting=!play&&(bar===3||bar===11);
  if(!resting)melody.forEach(([b,p,d,v],i)=>{
   // The B section changes the register only by using a single answering note.
   const swing=album.groove==="swing"&&b%1===.5?.14:0;
   const answer=bar>=8&&bar%8===4&&i===melody.length-1?2:0;
   n(album.lead,p+album.key+answer,start+(b+swing)*scale*beat,d*scale*beat*(play?.91:1.06),v*(album.lead==="marimba"?.12:.16),.15)
  });
  if(play){
   const percussion=album.groove==="folk"||album.groove==="chamber"?"wood":"brush";
   for(let b=0;b<meter;b++){if(b%2===1)n(percussion,67,start+b*beat,.11,.041,.19);if(album.groove==="bossa"||album.groove==="funk")n("brush",79,start+(b+.5)*beat,.09,.028,-.19)}
   if(bar%2===0)n("kick",36,start,.15,.035)
  }else if(album.groove==="bossa"||album.groove==="swing"){n("brush",67,start+beat,.11,.023,.12)}
 }
 const rendered=await ctx.startRendering(),out=ctx.createBuffer(2,frames,sr);
 let peak=0,sum=0;for(let ch=0;ch<2;ch++){const from=rendered.getChannelData(ch),to=out.getChannelData(ch);for(let i=0;i<frames;i++){to[i]=from[i]+(i<tail?from[frames+i]:0);peak=Math.max(peak,Math.abs(to[i]));sum+=to[i]*to[i]}}
 const rms=Math.sqrt(sum/(2*frames));if(!Number.isFinite(rms)||rms<.0001)throw Error("Invalid rendered music");
 const gain=Math.min(.68/Math.max(peak,.001),.065/rms);for(let ch=0;ch<2;ch++){const a=out.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]*=gain}
 return out
}
export async function renderEffect(album:Album,event:Effect):Promise<AudioBuffer>{
 const duration=event==="finish"?1.15:event==="handoff"?.62:event==="start"?.55:event==="flip4"?.62:event==="flip3"?.42:event==="flip2"?.28:event==="flip1"?.19:event==="correct"?.32:event==="skip"?.16:.13;
 const ctx=new OfflineAudioContext(2,Math.ceil(sr*duration),sr),bus=ctx.createGain(),lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=3900;bus.gain.value=.62;bus.connect(lp);lp.connect(ctx.destination);
 // Mostly unpitched tactile feedback; tonal cues are short, rounded and in the EP key.
 const note=instruments(ctx,bus,new Map()),k=album.key;
 const material=album.theme==="metal"||album.theme==="gwent"?"bell":album.theme==="infernal"?"wood":"marimba";
 const hit=(p:number,t:number,a=.17,d=.18)=>note(material,p+k,t,d,a,.03);
 const paper=(at:number,d:number,level=1)=>{const b=ctx.createBuffer(1,Math.round(d*sr),sr),a=b.getChannelData(0),r=random(429+album.key+level*13),s=ctx.createBufferSource(),filter=ctx.createBiquadFilter();let smooth=0;for(let i=0;i<a.length;i++){const f=i/a.length,noise=r()*2-1;smooth=.7*smooth+.3*noise;a[i]=(noise-smooth*.9)*Math.sin(Math.PI*f)**2*.23}filter.type="bandpass";filter.frequency.value=album.theme==="original"?1150:1550;filter.Q.value=.55;s.buffer=b;s.connect(filter);filter.connect(bus);s.start(at)};
 if(event.startsWith("flip")){
  const level=Number(event.slice(-1));paper(0,.115+level*.025,level);note("wood",53,.075+level*.025,.085,.15+level*.015);
  if(level>1)hit(60,.115+level*.02,.10+level*.01,.12+level*.045);
  if(level===4){note("bass",43+k,.13,.29,.12);hit(67,.23,.10,.26)}
 }else if(event==="tap"){note("wood",57,0,.085,.22)}
 else if(event==="select"){note("wood",64,0,.075,.22);hit(60,.025,.10,.095)}
 else if(event==="back"){note("wood",48,0,.085,.18)}
 else if(event==="skip"){paper(0,.125);note("wood",53,.045,.08,.14)}
 else if(event==="correct"){hit(60,0,.24,.14);hit(64,.065,.18,.23)}
 else if(event==="start"){hit(60,0,.19,.15);hit(64,.095,.17,.17);hit(67,.19,.19,.29)}
 else if(event==="handoff"){hit(64,0,.15,.15);hit(67,.12,.19,.2);hit(60,.25,.16,.29)}
 else{hit(60,0,.18,.24);hit(64,.12,.18,.24);hit(67,.24,.17,.29);hit(72,.36,.15,.65);note("bass",48+k,.36,.54,.11)}
 const rendered=await ctx.startRendering();let peak=0;for(let c=0;c<2;c++)for(const v of rendered.getChannelData(c))peak=Math.max(peak,Math.abs(v));
 const g=Math.min(1.7,.32/Math.max(peak,.001));for(let c=0;c<2;c++){const a=rendered.getChannelData(c);for(let i=0;i<a.length;i++)a[i]*=g}
 return rendered
}
