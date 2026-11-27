export type Question={id:string;word:string;catId:string;cat:string;level:number;len:number};
export type Category={id:string;name:string;file:string;count:number};
export type Bank={version:string;categories:Category[];items:Question[]};
export type Config={count:number;names:string[];target:number;limit:number;selected:string[]|null;lenType:"any"|"exact"|"max";len:number;diff:string;pace:number};
export type GameConfig={mode:"solo"|"multi";names:string[];target:number;limit:number;pool:Question[];progressive:boolean;fixed:number;pace:number;bankVersion:string};
export type QuestionOutcome="correct"|"abandoned";
export type Game=GameConfig&{player:number;round:number;done:number;turnSkips:number;left:number;phase:"play"|"ready"|"handoff"|"result";decks:Record<number,Question[]>;cycles:Record<number,number>;shown:number;last:string;current:Question|null;turnAbandoned?:boolean;outcomes?:QuestionOutcome[];stats:{correct:number;skip:number;turns:number;abandoned?:number;questionAbandoned?:number}[]};
export type Action="begin"|"finish"|"next"|"skip"|"correct"|"abandon"|"abandon-question";
export const levels=["混合","简单","中等","困难","地狱"];
export const defaults:Config={count:3,names:Array(8).fill(""),target:10,limit:3,selected:null,lenType:"any",len:3,diff:"0",pace:2};
export const filter=(items:Question[],c:Config)=>[...new Map(items.filter(x=>(c.selected===null||c.selected.includes(x.catId))&&(c.lenType==="any"||(c.lenType==="exact"?x.len===c.len:x.len<=c.len))&&(c.diff==="p"||c.diff==="0"||x.level===+c.diff)).map(x=>[x.word.normalize("NFKC"),x])).values()];
export const counts=(p:Question[])=>[1,2,3,4].map(l=>p.filter(x=>x.level===l).length);
export const eligible=(p:Question[],c:Config)=>p.length>0&&(c.diff!=="p"||counts(p).every(n=>n>0));
export const levelAt=(s:Game,r=s.round)=>s.progressive?Math.min(4,1+Math.floor((r-1)/s.pace)):s.fixed;
function shuffle(a:Question[]){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function draw(s:Game){const l=levelAt(s);let q=s.decks[l]||[];if(!q.length){q=shuffle(s.pool.filter(x=>!l||x.level===l));if(q.length>1&&q[0].word===s.last)[q[0],q[1]]=[q[1],q[0]];s.cycles[l]=(s.cycles[l]||0)+1}if(!q.length)throw Error("empty deck");s.current=q.shift()!;s.last=s.current.word;s.decks[l]=q;s.shown++;return s}
// v3.1.4 and earlier only stored correct answers; reconstruct green slots for old saves.
export const turnOutcomes=(g:Game):QuestionOutcome[]=>g.outcomes??Array.from({length:g.done},()=>"correct");
export const turnProcessed=(g:Game)=>g.outcomes?.length??g.done;
export function fresh(c:GameConfig):Game{const s:Game={...c,player:0,round:1,done:0,outcomes:[],turnAbandoned:false,turnSkips:0,left:c.limit,phase:c.mode==="solo"?"play":"ready",decks:{},cycles:{},shown:0,last:"",current:null,stats:c.names.map(()=>({correct:0,skip:0,turns:0}))};return c.mode==="solo"?draw(s):s}
export function step(old:Game,action:Action,instance:number){const s=structuredClone(old);const events:string[]=[];if(action==="begin"&&(s.phase==="ready"||s.phase==="handoff")){if(s.phase==="handoff"){s.player=(s.player+1)%s.names.length;if(!s.player){const before=levelAt(s);s.round++;if(levelAt(s)>before)events.push("LEVEL_UP")}s.done=0;s.outcomes=[];s.turnSkips=0;s.left=s.limit;s.turnAbandoned=false}s.phase="play";draw(s);events.push("QUESTION_CHANGED");return {state:s,events}}
if(action==="finish"&&s.phase!=="result"){s.phase="result";s.current=null;return {state:s,events:["GAME_ENDED"]}}
if(s.phase!=="play"||instance!==s.shown)return {state:old,events};
if(action==="next"&&s.mode==="solo"){draw(s);events.push("QUESTION_CHANGED")}
else if(action==="skip"&&s.mode==="multi"&&s.left!==0){if(s.left>0)s.left--;s.stats[s.player].skip++;s.turnSkips++;draw(s);events.push("QUESTION_SKIPPED","QUESTION_CHANGED")}
else if(action==="abandon"&&s.mode==="multi"){
 endTurn(s,events,true);
}
else if(s.mode==="multi"&&turnProcessed(s)<s.target&&(action==="correct"||(action==="abandon-question"&&s.left===0))){
 const outcomes=turnOutcomes(s);
 if(action==="correct"){
  s.done++;s.stats[s.player].correct++;outcomes.push("correct");events.push("ANSWER_CORRECT");
 }else{
  const stats=s.stats[s.player];stats.questionAbandoned=(stats.questionAbandoned??0)+1;
  outcomes.push("abandoned");events.push("QUESTION_ABANDONED");
 }
 s.outcomes=outcomes;
 if(turnProcessed(s)===s.target)endTurn(s,events,false);
 else{draw(s);events.push("QUESTION_CHANGED")}
}else return {state:old,events};return {state:s,events}}

// A completed rotation counts all ended turns, including voluntarily abandoned ones.
// Normal completion requires exactly target resolved slots, correct or abandoned.
function endTurn(s:Game,events:string[],abandoned:boolean){
 const stats=s.stats[s.player];stats.turns++;s.turnAbandoned=abandoned;
 if(abandoned){stats.abandoned=(stats.abandoned??0)+1;events.push("TURN_ABANDONED")}
 else events.push("TURN_COMPLETED");
 s.current=null;s.phase="handoff";
 if(s.player===s.names.length-1)events.push("ROUND_COMPLETED");
}
