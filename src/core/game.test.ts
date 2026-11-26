import {describe,it,expect} from "vitest";
import {fresh,step,filter,defaults,levelAt,type Question,type GameConfig} from "./game";
const pool:Question[]=Array.from({length:40},(_,i)=>({id:String(i),word:"题"+i,catId:"a",cat:"测试",level:1+Math.floor(i/10),len:[...("题"+i)].length}));
const config:GameConfig={mode:"multi",names:["甲","乙"],target:5,limit:1,pool,progressive:true,fixed:0,pace:1,bankVersion:"test"};
describe("game",()=>{
it("rotates only after correct target, upgrades after full round",()=>{let g=fresh(config);for(let r=1;r<=4;r++){for(let p=0;p<2;p++){g=step(g,"begin",g.shown).state;expect(g.round).toBe(r);expect(levelAt(g)).toBe(r);expect(g.player).toBe(p);expect(g.left).toBe(1);for(let i=0;i<5;i++)g=step(g,"correct",g.shown).state;expect(g.phase).toBe("handoff");expect(g.current).toBeNull()}}});
it("skip is not progress, duplicate input ignored",()=>{let g=step(fresh(config),"begin",0).state;const old=g.shown;g=step(g,"skip",old).state;expect(g.done).toBe(0);expect(g.left).toBe(0);expect(step(g,"skip",g.shown).state).toBe(g);expect(step(g,"correct",old).state).toBe(g)});
it("solo never repeats before exhausting deck",()=>{let g=fresh({...config,mode:"solo",names:[],progressive:false});const seen=new Set<string>();for(let i=0;i<40;i++){expect(seen.has(g.current!.word)).toBe(false);seen.add(g.current!.word);g=step(g,"next",g.shown).state}expect(seen.size).toBe(40)});
it("exact length and fixed difficulty",()=>{const r=filter(pool,{...defaults,lenType:"exact",len:3,diff:"2"});expect(r.length).toBe(10);expect(r.every(q=>q.level===2&&q.len===3)).toBe(true)});
});
