import type {DeckThemeId} from "@/services/deckTheme";

export type Scene="lounge"|"play";
type Voice="guitar"|"rhodes"|"marimba"|"bass"|"pizz"|"harp"|"bell"|"wood"|"brush"|"kick";
type Groove="bossa"|"swing"|"folk"|"waltz"|"funk"|"chamber";
export type Album={id:string;theme:DeckThemeId;title:string;description:string;tempo:[number,number];key:number;groove:Groove;lead:Voice;chord:Voice;accent:Voice;palette:string;progression:number};
export const albums:Album[]=[
 {id:"ep01",theme:"original",title:"午后微风",description:"尼龙吉他 · Bossa Nova · 沙锤",tempo:[84,112],key:0,groove:"bossa",lead:"guitar",chord:"rhodes",accent:"marimba",palette:"#F2D18C",progression:0},
 {id:"ep02",theme:"original",title:"咖啡与桌游",description:"暖电钢琴 · 轻爵士 · 拨弦贝斯",tempo:[78,108],key:2,groove:"swing",lead:"rhodes",chord:"guitar",accent:"marimba",palette:"#D9B99B",progression:1},
 {id:"ep03",theme:"original",title:"周末开盒",description:"木琴 · 原声民谣 · 木质节拍",tempo:[88,116],key:5,groove:"folk",lead:"marimba",chord:"guitar",accent:"pizz",palette:"#B8D5A2",progression:2},
 {id:"ep04",theme:"warm",title:"琥珀时光",description:"电钢琴 · 温柔拨弦 · 暖金泛音",tempo:[82,110],key:0,groove:"bossa",lead:"rhodes",chord:"harp",accent:"bell",palette:"#E3BE7D",progression:1},
 {id:"ep05",theme:"warm",title:"蜂蜜小夜曲",description:"原声吉他 · 轻三拍 · 竖琴",tempo:[87,120],key:5,groove:"waltz",lead:"guitar",chord:"pizz",accent:"harp",palette:"#E9CD99",progression:2},
 {id:"ep06",theme:"metal",title:"流金律动",description:"复古电钢琴 · 轻 Funk · 金属点缀",tempo:[86,118],key:3,groove:"funk",lead:"rhodes",chord:"guitar",accent:"bell",palette:"#DEC27E",progression:3},
 {id:"ep07",theme:"balatro",title:"纸箔游乐场",description:"木琴 · 切分拨弦 · 闪亮钟琴",tempo:[90,120],key:2,groove:"funk",lead:"marimba",chord:"rhodes",accent:"bell",palette:"#C6B9E6",progression:2},
 {id:"ep08",theme:"gwent",title:"工匠的茶会",description:"拨奏弦乐 · 古典吉他 · 室内乐",tempo:[80,112],key:0,groove:"chamber",lead:"pizz",chord:"guitar",accent:"harp",palette:"#CFB98F",progression:3},
 {id:"ep09",theme:"gwent",title:"黄铜八音盒",description:"竖琴 · 轻圆舞曲 · 金属钟鸣",tempo:[84,114],key:5,groove:"waltz",lead:"harp",chord:"pizz",accent:"bell",palette:"#D6BC84",progression:0},
 {id:"ep10",theme:"infernal",title:"炉火旁的朋友",description:"温暖吉他 · 木质节奏 · 低音拨弦",tempo:[78,108],key:3,groove:"folk",lead:"guitar",chord:"rhodes",accent:"wood",palette:"#E2AD89",progression:1},
 {id:"ep11",theme:"occult",title:"烛光与木刻",description:"轻竖琴 · 拨奏弦乐 · 柔和木琴",tempo:[76,106],key:2,groove:"chamber",lead:"harp",chord:"pizz",accent:"marimba",palette:"#C8C5A3",progression:3},
 {id:"ep12",theme:"occult",title:"星光小游戏",description:"钟琴 · 柔和电钢琴 · 梦幻拨弦",tempo:[82,114],key:0,groove:"swing",lead:"bell",chord:"rhodes",accent:"harp",palette:"#D1C4E4",progression:0},
];
export const effects=[["tap","按键"],["select","选择"],["back","返回"],["start","开始"],["correct","答对"],["skip","换题"],["handoff","玩家轮换"],["finish","结算"],["flip1","简单翻牌"],["flip2","中等翻牌"],["flip3","困难翻牌"],["flip4","地狱翻牌"]] as const;
export type Effect=typeof effects[number][0];
const sr=24000,tau=2*Math.PI;
const chords=[
 [48,60,64,67,71,74],[45,57,60,64,67,71],[50,62,65,69,72,76],[43,55,59,62,65,69],
 [41,53,57,60,64,67],[52,64,67,71,74,77],[47,59,62,65,69,72],[46,58,62,65,69,72]
];
const progressions=[[0,1,2,3,4,0,2,3,0,1,2,3,4,5,2,3],[0,5,1,1,2,3,0,3,4,5,1,1,2,3,0,3],[0,4,1,3,0,4,2,3,0,4,1,3,4,0,2,3],[0,1,4,3,5,1,2,3,0,4,0,3,4,1,2,3]];
function random(seed:number){let x=seed|0;return()=>{x=(Math.imul(x,1664525)+1013904223)|0;return (x>>>0)/4294967296}}
function frequency(note:number){return 440*Math.pow(2,(note-69)/12)}
function sample(ctx:BaseAudioContext,voice:Voice,note:number){
 const length=voice==="bass"?1.5:voice==="rhodes"?2.2:voice==="harp"?2.2:voice==="bell"?1.8:voice==="brush"?.12:voice==="wood"?.13:voice==="kick"?.16:1.6;
 const b=ctx.createBuffer(1,Math.ceil(length*ctx.sampleRate),ctx.sampleRate),a=b.getChannelData(0),f=frequency(note),r=random(note*101+voice.length*17);
 let filtered=0;const delay=Math.max(2,Math.round(ctx.sampleRate/f));const line=new Float32Array(delay);
 for(let i=0;i<delay;i++)line[i]=(r()*2-1)*.7;
 for(let i=0;i<a.length;i++){
  const t=i/ctx.sampleRate,p=tau*f*t,noise=r()*2-1;
  let v=0;
  if(voice==="guitar"||voice==="pizz"||voice==="harp"||voice==="bass"){
   const k=i%delay,next=(k+1)%delay,old=line[k];line[k]=(old+line[next])*(voice==="bass"?.4995:voice==="harp"?.4991:.4975);
   const env=Math.exp(-t*(voice==="pizz"?4.4:voice==="bass"?1.6:voice==="harp"?1.8:2.4));
   const harmonic=Math.sin(p)+.31*Math.sin(2*p)*Math.exp(-t*3)+.14*Math.sin(3*p)*Math.exp(-t*8);
   v=(harmonic*.55+old*(voice==="bass"?.16:.36))*env;
  }else if(voice==="rhodes"){
   v=(Math.sin(p+.9*Math.exp(-t*4)*Math.sin(2*p))+.19*Math.sin(2.003*p)*Math.exp(-t*2.7))*.57*Math.exp(-t*1.65);
  }else if(voice==="marimba"){
   v=(Math.sin(p)*Math.exp(-t*5)+.22*Math.sin(3.99*p)*Math.exp(-t*17)+.09*Math.sin(9.03*p)*Math.exp(-t*35))*.67;
  }else if(voice==="bell"){
   v=(Math.sin(p)*Math.exp(-t*3.4)+.24*Math.sin(2.01*p)*Math.exp(-t*5.7)+.09*Math.sin(3.76*p)*Math.exp(-t*11))*.62;
  }else if(voice==="kick"){v=Math.sin(tau*(52*t+2.7*(1-Math.exp(-t*42))))*Math.exp(-t*30)*.7}
  else {filtered=.78*filtered+.22*noise;v=voice==="brush"?(noise-filtered)*Math.exp(-t*37)*.35:(filtered*.35+Math.sin(p)*.28)*Math.exp(-t*44)}
  const attack=Math.min(1,t/(voice==="rhodes"?.012:.004)),end=Math.min(1,(a.length-i)/(ctx.sampleRate*.028));a[i]=v*attack*end;
 }
 return b;
}
function instruments(ctx:BaseAudioContext,output:AudioNode){
 const cache=new Map<string,AudioBuffer>();
 return (voice:Voice,note:number,at:number,duration:number,velocity:number,pan=0)=>{
  const key=voice+":"+note;let b=cache.get(key);if(!b){b=sample(ctx,voice,note);cache.set(key,b)}
  const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;
  g.gain.setValueAtTime(velocity,at);g.gain.setValueAtTime(velocity,at+Math.min(duration,b.duration)*.8);g.gain.linearRampToValueAtTime(0,at+Math.min(duration,b.duration));
  s.connect(g);if(typeof ctx.createStereoPanner==="function"){const p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(output)}else g.connect(output);
  s.start(at);s.stop(at+Math.min(duration,b.duration)+.005);
 };
}
export function loopSeconds(album:Album,scene:Scene){return 16*(album.groove==="waltz"?3:4)*60/album.tempo[scene==="lounge"?0:1]}
export async function renderMusic(album:Album,scene:Scene):Promise<AudioBuffer>{
 const play=scene==="play",beat=60/album.tempo[play?1:0],meter=album.groove==="waltz"?3:4,seconds=loopSeconds(album,scene),frames=Math.round(seconds*sr),tail=Math.ceil(2.4*sr);
 const ctx=new OfflineAudioContext(2,frames+tail,sr),bus=ctx.createGain();bus.gain.value=.78;bus.connect(ctx.destination);
 const note=instruments(ctx,bus),r=random(71+album.key*11+album.progression*51),prog=progressions[album.progression];
 const n=(v:Voice,p:number,t:number,d:number,a:number,pan=0)=>note(v,p,Math.max(0,t),d,a*(.91+r()*.16),pan);
 for(let bar=0;bar<16;bar++){
  const c=chords[prog[bar]].map(x=>x+album.key),start=bar*meter*beat;
  const swing=album.groove==="swing"?.66:.5;
  const bassPattern=meter===3?[0,2]:album.groove==="bossa"?[0,1.5,2,3.5]:album.groove==="funk"?[0,.75,2,2.75,3.5]:play?[0,1,2,3]:[0,2];
  bassPattern.forEach((b,i)=>n("bass",i%2===0?c[0]-12:c[0]-5,start+b*beat,beat*.78,.21,-.08));
  const harmony=meter===3?[0,1,2]:album.groove==="bossa"?[.5,1.5,2.5,3.5]:album.groove==="funk"?[.5,1.25,2.5,3.25]:album.groove==="swing"?[0,1+swing,3]:[0,2];
  harmony.forEach((b,i)=>{
   const pitches=[c[2],c[3],c[4],c[5]];
   pitches.forEach((p,j)=>n(album.chord,p,start+b*beat+j*.011,beat*(meter===3?.9:play?.8:1.35),.055+(i%2===0?.008:0),-.27+j*.09));
  });
  const rhythm=meter===3?[0,.75,1.5,2.25]:bar%4===3?[0,1.5,2.5]:bar%2?[.5,1.5,2,3.5]:[0,.75,1.5,2.5,3.25];
  const motif=bar%4===0?[3,4,3,2,1]:bar%4===1?[2,3,5,4,2]:bar%4===2?[1,2,3,5,4]:[3,2,1,2,3];
  if(play||bar%4!==2)rhythm.forEach((b,i)=>{
   if(!play&&i===rhythm.length-1&&bar%2===0)return;
   const p=c[motif[i]%c.length]+(motif[i]<3?12:0);
   n(album.lead,p,start+b*beat+(i%2?r()*.012:0),beat*(i===rhythm.length-1?1.1:.7),album.lead==="bell"?.093:.16,.24);
  });
  if(play||bar%4===3){const offset=meter===3?2:3;n(album.accent,c[4]+12,start+offset*beat,beat*.68,.075,.42);if(play)n(album.accent,c[2]+12,start+(offset+.5)*beat,beat*.46,.055,.34)}
  for(let b=0;b<meter;b++){
   if(b===0||(play&&b===2))n("kick",36,start+b*beat,.15,play?.085:.045);
   if(b%2===1||meter===3&&b===2)n(album.groove==="folk"||album.groove==="chamber"?"wood":"brush",76,start+b*beat,.11,play?.12:.07,.2);
   if(play||album.groove==="bossa")n("brush",82,start+(b+swing)*beat,.095,play?.085:.045,-.2);
  }
 }
 const rendered=await ctx.startRendering(),out=ctx.createBuffer(2,frames,sr);
 let peak=0;for(let ch=0;ch<2;ch++){const from=rendered.getChannelData(ch),to=out.getChannelData(ch);for(let i=0;i<frames;i++){to[i]=from[i]+(i<tail?from[frames+i]:0);peak=Math.max(peak,Math.abs(to[i]))}}
 const gain=peak>.78?.78/peak:1;for(let ch=0;ch<2;ch++){const a=out.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]*=gain}
 return out;
}
export async function renderEffect(album:Album,event:Effect):Promise<AudioBuffer>{
 const ctx=new OfflineAudioContext(2,Math.round(sr*(event==="finish"?2.5:1.25)),sr),bus=ctx.createGain();bus.gain.value=.7;bus.connect(ctx.destination);
 const note=instruments(ctx,bus),k=album.key;
 const accent=album.theme==="original"?"marimba":album.theme==="infernal"?"wood":album.theme==="occult"?"harp":"bell";
 const hit=(p:number,t:number,a=.36,d=.45)=>note(accent,p+k,t,d,a,.05);
 const paper=(at:number,d=.16)=>{const b=ctx.createBuffer(1,Math.round(d*sr),sr),a=b.getChannelData(0),r=random(429+album.key),s=ctx.createBufferSource(),filter=ctx.createBiquadFilter();let smooth=0;for(let i=0;i<a.length;i++){const f=i/a.length;const noise=r()*2-1;smooth=.7*smooth+.3*noise;a[i]=(noise-smooth)*Math.sin(Math.PI*f)**2*.38}filter.type="bandpass";filter.frequency.value=album.theme==="original"?1500:2300;filter.Q.value=.7;s.buffer=b;s.connect(filter);filter.connect(bus);s.start(at)};
 if(event.startsWith("flip")){
  const level=Number(event.slice(-1));paper(0,.15+level*.045);note("wood",58,.12+level*.035,.12,.19);
  if(level>1)hit(72,.16+level*.035,.26,.4);
  if(level>2){hit(76,.26,.23,.55);hit(79,.34,.19,.62)}
  if(level===4){note("bass",36,.18,.5,.28);hit(84,.43,.22,.72)}
 }else if(event==="tap"){note("wood",72,0,.07,.37);note(album.chord,60,0,.065,.09)}
 else if(event==="select"){hit(72,0,.32,.13);hit(76,.065,.16,.13)}
 else if(event==="back"||event==="skip"){hit(69,0,.22,.14);hit(64,.09,.19,.18)}
 else if(event==="correct"){hit(72,0,.30,.18);hit(76,.09,.30,.22);hit(79,.17,.34,.38)}
 else if(event==="start"||event==="handoff"){[60,64,67,72].forEach((p,i)=>hit(p,i*.12,.31,.38))}
 else {[60,64,67,72,76,79,84].forEach((p,i)=>hit(p,i*.12,.28,.7));[60,64,67,72].forEach(p=>note(album.chord,p+k,.84,.9,.13))}
 return ctx.startRendering();
}
