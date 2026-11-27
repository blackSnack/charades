import type {Album,Scene,Voice} from "./score";
export type Role="lead"|"harmony"|"bass"|"rhythm";
export const roles:Role[]=["lead","harmony","bass","rhythm"];
export const targetRms:Record<Role,number>={lead:.040,harmony:.014,bass:.011,rhythm:.0045};
type Note=[number,number,number,number]; // beat in 4/4, pitch, length, phrase dynamics
type Bar={chord:number;melody:Note[]};
export const chords=[
 {root:36,notes:[52,55,57],tones:[0,4,7,9]}, // C6
 {root:45,notes:[48,52,55],tones:[9,0,4,7]}, // Am7
 {root:38,notes:[53,57,60],tones:[2,5,9,0]}, // Dm7
 {root:43,notes:[50,55,59],tones:[7,11,2]}, // G (no exposed tritone)
 {root:41,notes:[48,53,57],tones:[5,9,0]}, // F
 {root:40,notes:[47,52,55],tones:[4,7,11]}, // Em
];
const b=(chord:number,melody:Note[]):Bar=>({chord,melody});
// Each phrase is written against its own harmony; the second eight bars answer
// with a changed rhythmic texture, not a different chord table under the same notes.
export const phrases:Bar[][]=[
 [
 b(0,[[.5,64,.85,.83],[1.5,67,.8,.94],[2.5,69,1.15,.81]]),
 b(1,[[0,67,1.25,.80],[1.75,64,.65,.73],[2.5,60,1,.68]]),
 b(2,[[.5,65,.85,.78],[1.5,69,1.3,.89]]),
 b(3,[[0,67,1.4,.78],[2,62,1,.68]]),
 b(4,[[.5,65,.8,.78],[1.5,69,.7,.87],[2.5,72,1,.86]]),
 b(0,[[0,69,1.4,.77],[2,67,.75,.73],[3,64,.65,.68]]),
 b(2,[[.5,65,1,.79],[2,62,1.3,.68]]),
 b(3,[[0,59,1.2,.70],[1.5,62,.75,.73],[2.5,67,.9,.68]]),
 ],
 [
 b(0,[[0,67,1.3,.83],[1.75,64,1.1,.73]]),
 b(5,[[.5,64,.8,.77],[1.5,67,.75,.88],[2.5,71,1,.78]]),
 b(1,[[0,69,1.4,.83],[2,67,.7,.72],[3,64,.65,.71]]),
 b(3,[[.5,62,1.2,.76],[2,59,1.25,.66]]),
 b(4,[[0,60,.85,.71],[1,65,.8,.83],[2,69,1.4,.87]]),
 b(0,[[.5,67,1.4,.79],[2.5,64,.8,.69]]),
 b(2,[[0,65,1.15,.79],[1.5,62,.8,.70],[2.5,65,.8,.71]]),
 b(3,[[0,62,1.1,.74],[1.5,59,.8,.69],[2.5,67,1,.66]]),
 ],
 [
 b(0,[[0,60,.8,.76],[1,64,.8,.84],[2,67,1.5,.88]]),
 b(4,[[.5,69,.85,.88],[1.5,65,.85,.79],[2.5,60,1,.71]]),
 b(1,[[0,64,1.15,.78],[1.5,67,.8,.83],[2.5,69,1,.86]]),
 b(3,[[0,67,1.4,.79],[2,62,1.25,.69]]),
 b(0,[[.5,60,.8,.74],[1.5,64,.7,.83],[2.5,67,1.1,.88]]),
 b(4,[[0,69,1.3,.85],[1.75,72,.65,.83],[2.5,69,.9,.76]]),
 b(2,[[.5,65,1,.81],[2,62,1.25,.72]]),
 b(3,[[0,59,1,.67],[1.5,62,.8,.73],[2.5,67,1,.69]]),
 ],
 [
 b(0,[[.5,64,1.05,.82],[2,67,1.4,.86]]),
 b(1,[[0,69,.85,.85],[1,67,.8,.77],[2,64,1.4,.71]]),
 b(4,[[.5,65,1.2,.8],[2,69,1.1,.84]]),
 b(3,[[0,62,1.5,.75],[2,59,1.25,.67]]),
 b(0,[[.5,64,.8,.79],[1.5,67,.7,.85],[2.5,69,1.15,.87]]),
 b(5,[[0,71,.85,.81],[1,67,.8,.76],[2,64,1.4,.71]]),
 b(2,[[.5,65,1,.8],[2,62,1.3,.71]]),
 b(3,[[0,62,1.1,.74],[1.5,59,.8,.68],[2.5,67,1,.65]]),
 ],
];
export type ScheduledNote={role:Role;voice:Voice;pitch:number;start:number;duration:number;velocity:number;pan:number;bar:number;chord:number};
export function planMusic(album:Album,scene:Scene){
 const play=scene==="play",beat=60/album.tempo[play?1:0],meter=album.groove==="waltz"?3:4,scale=meter/4,barSeconds=meter*beat;
 const notes:ScheduledNote[]=[],phrase=phrases[album.progression];
 for(let bar=0;bar<16;bar++){
  const {chord,melody}=phrase[bar%8],c=chords[chord],start=bar*barSeconds;
  const phraseGain=bar%8===7?.83:bar%8===4?1.04:1;
  const resting=!play&&(bar===3||bar===11);
  const lead=resting?[]:melody.map(([b,p,d,v],i)=>{
   const at=b*scale*beat+((album.groove==="swing"&&b%1===.5)?.075*beat:0);
   const next=i<melody.length-1?melody[i+1][0]*scale*beat:barSeconds;
   return {at,p,d:Math.min(d*scale*beat*(play?.94:1.02),next-at-.025,barSeconds-at-.035),v}
  });
  const add=(role:Role,voice:Voice,pitch:number,at:number,duration:number,velocity:number,pan=0)=>{
   const d=Math.min(duration,barSeconds-at-.025);if(d<=.035)return;
   notes.push({role,voice,pitch:pitch+album.key,start:start+at,duration:d,velocity:velocity*phraseGain,pan,bar,chord})
  };
  lead.forEach(n=>add("lead",album.lead,n.p,n.at,n.d,n.v,.07));
  // Deliberately keep all accompaniment voices below the melody's register.
  const lowLead=lead.length?Math.min(...lead.map(n=>n.p)):67;
  const pitches=c.notes.map(p=>p>=lowLead-4?p-12:p);
  // Sparse two-note arpeggios instead of chords with a simultaneous full attack.
  const pattern=meter===3?[.12,1.12,2.12]:album.groove==="bossa"?[.18,1.65,2.75]:album.groove==="funk"&&play?[.22,1.7,3.15]:[.18,2.1];
  pattern.forEach((b,i)=>{
   let at=b*beat;
   // Give the melody attack priority. Never land accompaniment within 70 ms of it.
   for(const n of lead)if(Math.abs(n.at-at)<.075||Math.abs(n.at-(at+.048))<.075)at=n.at+.085;
   const behind=lead.some(n=>at>=n.at-.06&&at<n.at+n.d);
   const ordered=i%2===0?[pitches[0],pitches[1]]:[pitches[1],pitches[2]];
   ordered.forEach((p,j)=>add("harmony",album.chord,p,at+j*.048,beat*(play?.85:1.2),(behind?.56:.76)*(j===0?1:.76),-.16));
  });
  const bassPattern=meter===3?[0,2]:play&&album.groove==="bossa"?[0,1.65,2.8]:[0,2];
  bassPattern.forEach((b,i)=>add("bass","bass",c.root+(i%2?7:0),b*beat+.025,beat*(i===0?1.35:.8),i===0?.82:.59,0));
  if(play){const perc=album.groove==="folk"||album.groove==="chamber"?"wood":"brush";for(let b=1;b<meter;b+=2)add("rhythm",perc,67,b*beat+.045,.115,.70,.15);if(album.groove==="bossa"||album.groove==="funk")for(let b=0;b<meter;b++)add("rhythm","brush",79,(b+.5)*beat+.035,.085,.38,-.15)}
  else if(album.groove==="bossa"||album.groove==="swing")add("rhythm","brush",67,beat+.06,.11,.40,.12);
 }
 return {notes,seconds:16*barSeconds,barSeconds}
}
// Active-window RMS, not sample peak. Silence and phrase rests do not distort the
// relative faders. Windowed measurement preserves note-to-note expressive dynamics.
export function activeRms(channels:Float32Array[],rate:number){
 const size=Math.max(1,Math.floor(rate*.2)),powers:number[]=[];
 for(let at=0;at<channels[0].length;at+=size){let sum=0,count=0;for(const c of channels)for(let i=at;i<Math.min(at+size,c.length);i++){sum+=c[i]*c[i];count++}powers.push(sum/Math.max(1,count))}
 const max=Math.max(...powers,0);if(max<1e-12)return 0;
 const active=powers.filter(p=>p>max*.012);return Math.sqrt(active.reduce((s,p)=>s+p,0)/active.length)
}
