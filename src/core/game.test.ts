import {describe,it,expect} from "vitest";
import {fresh,step,filter,defaults,levelAt,turnOutcomes,turnProcessed,type Question,type GameConfig} from "./game";
const pool:Question[]=Array.from({length:40},(_,i)=>({id:String(i),word:"题"+i,catId:"a",cat:"测试",level:1+Math.floor(i/10),len:[...("题"+i)].length}));
const config:GameConfig={mode:"multi",names:["甲","乙"],target:5,limit:1,pool,progressive:true,fixed:0,pace:1,bankVersion:"test"};
describe("game",()=>{
it("rotates only after correct target, upgrades after full round",()=>{let g=fresh(config);for(let r=1;r<=4;r++){for(let p=0;p<2;p++){g=step(g,"begin",g.shown).state;expect(g.round).toBe(r);expect(levelAt(g)).toBe(r);expect(g.player).toBe(p);expect(g.left).toBe(1);for(let i=0;i<5;i++)g=step(g,"correct",g.shown).state;expect(g.phase).toBe("handoff");expect(g.current).toBeNull()}}});
it("skip is not progress, duplicate input ignored",()=>{let g=step(fresh(config),"begin",0).state;const old=g.shown;g=step(g,"skip",old).state;expect(g.done).toBe(0);expect(g.left).toBe(0);expect(step(g,"skip",g.shown).state).toBe(g);expect(step(g,"correct",old).state).toBe(g)});
it("solo never repeats before exhausting deck",()=>{let g=fresh({...config,mode:"solo",names:[],progressive:false});const seen=new Set<string>();for(let i=0;i<40;i++){expect(seen.has(g.current!.word)).toBe(false);seen.add(g.current!.word);g=step(g,"next",g.shown).state}expect(seen.size).toBe(40)});
it("exact length and fixed difficulty",()=>{const r=filter(pool,{...defaults,lenType:"exact",len:3,diff:"2"});expect(r.length).toBe(10);expect(r.every(q=>q.level===2&&q.len===3)).toBe(true)});
});

describe("ten-question turn and abandonment",()=>{
 for(const target of [5,10,15,20]){
  for(const limit of [0,1,3,5,-1]){
   it(`requires exactly ${target} correct answers with skip limit ${limit}`,()=>{
    let g=step(fresh({...config,target,limit}),"begin",0).state;
    for(let i=0;i<Math.max(0,limit);i++){g=step(g,"skip",g.shown).state;expect(g.done).toBe(0)}
    if(limit===-1){g=step(g,"skip",g.shown).state;expect(g.left).toBe(-1)}
    for(let i=0;i<target;i++){
     expect(g.phase).toBe("play");expect(g.done).toBe(i);expect(g.current).not.toBeNull();
     const instance=g.shown;const result=step(g,"correct",instance);g=result.state;
     expect(g.done).toBe(i+1);expect(g.stats[0].correct).toBe(i+1);
     expect(result.events.includes("TURN_COMPLETED")).toBe(i+1===target);
     expect(step(g,"correct",instance).state).toBe(g);
    }
    expect(g.phase).toBe("handoff");expect(g.current).toBeNull();expect(g.stats[0].turns).toBe(1);
    g=step(g,"begin",g.shown).state;expect(g.player).toBe(1);expect(g.done).toBe(0);expect(g.left).toBe(limit);
   });
  }
 }
 it("whole turn abandonment is always available, keeps score and resets next turn",()=>{
  let g=step(fresh({...config,target:10,limit:1}),"begin",0).state;
  expect(step(g,"abandon-question",g.shown).state).toBe(g);
  g=step(g,"correct",g.shown).state;
  const r=step(g,"abandon",g.shown);g=r.state;
  expect(r.events).toContain("TURN_ABANDONED");expect(r.events).not.toContain("TURN_COMPLETED");
  expect(g.done).toBe(1);expect(g.stats[0]).toEqual({correct:1,skip:0,turns:1,abandoned:1});expect(g.phase).toBe("handoff");expect(g.turnAbandoned).toBe(true);expect(g.current).toBeNull();expect(turnOutcomes(g)).toEqual(["correct"]);
  expect(step(g,"abandon",g.shown).state).toBe(g);
  g=step(g,"begin",g.shown).state;expect(g.player).toBe(1);expect(g.done).toBe(0);expect(g.left).toBe(1);expect(g.turnAbandoned).toBe(false);expect(turnOutcomes(g)).toEqual([]);
  const second=step(g,"abandon",g.shown);expect(second.events).toContain("ROUND_COMPLETED");
  g=step(second.state,"begin",second.state.shown).state;expect(g.round).toBe(2);expect(levelAt(g)).toBe(2);
 });
 it("zero and unlimited skip limits both permit whole turn abandonment, solo does not",()=>{
  const zero=step(fresh({...config,limit:0}),"begin",0).state;expect(step(zero,"abandon",zero.shown).state.phase).toBe("handoff");
  const unlimited=step(fresh({...config,limit:-1}),"begin",0).state;expect(step(unlimited,"abandon",unlimited.shown).state.phase).toBe("handoff");expect(step(unlimited,"abandon-question",unlimited.shown).state).toBe(unlimited);
  const solo=fresh({...config,mode:"solo",names:[],limit:0});expect(step(solo,"abandon",solo.shown).state).toBe(solo);expect(step(solo,"abandon-question",solo.shown).state).toBe(solo);
 });
 for(const target of [5,10,15,20]){
  it(`abandoned questions consume one of ${target} slots, not a correct answer`,()=>{
   let g=step(fresh({...config,target,limit:1}),"begin",0).state;
   g=step(g,"correct",g.shown).state;
   g=step(g,"skip",g.shown).state;expect(turnProcessed(g)).toBe(1);expect(g.left).toBe(0);
   const id=g.shown;const abandoned=step(g,"abandon-question",id);g=abandoned.state;
   expect(abandoned.events).toContain("QUESTION_ABANDONED");expect(g.phase).toBe("play");expect(g.shown).toBe(id+1);expect(g.done).toBe(1);expect(turnOutcomes(g)).toEqual(["correct","abandoned"]);
   expect(step(g,"abandon-question",id).state).toBe(g);
   for(let i=2;i<target-1;i++){g=step(g,"correct",g.shown).state;expect(g.phase).toBe("play")}
   g=step(g,"abandon-question",g.shown).state;expect(g.phase).toBe("handoff");expect(g.turnAbandoned).toBe(false);expect(turnProcessed(g)).toBe(target);expect(g.done).toBe(target-2);expect(g.stats[0].questionAbandoned).toBe(2);expect(g.stats[0].abandoned).toBeUndefined();
   const saved=JSON.parse(JSON.stringify(g));expect(turnOutcomes(saved)).toEqual(turnOutcomes(g));
   g=step(saved,"begin",saved.shown).state;expect(turnProcessed(g)).toBe(0);expect(g.left).toBe(1);
  });
 }
 it("old saves reconstruct green slots and replay clears abandoned state",()=>{
  let g=step(fresh({...config,limit:0}),"begin",0).state;
  g=step(g,"correct",g.shown).state;delete g.outcomes;
  expect(turnOutcomes(g)).toEqual(["correct"]);
  g=step(g,"abandon-question",g.shown).state;expect(turnOutcomes(g)).toEqual(["correct","abandoned"]);
  g=step(g,"abandon",g.shown).state;const replay=fresh(g);expect(replay.turnAbandoned).toBe(false);expect(turnProcessed(replay)).toBe(0);expect(replay.stats[0].questionAbandoned).toBeUndefined();
 });
});
