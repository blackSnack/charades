import {describe,expect,it} from "vitest";
import {albums} from "./score";
import {planMusic,chords,roles,targetRms,activeRms} from "./arrangement";
describe("written arrangement and role balance",()=>{
 it("all 24 loops share consonant harmony, lower accompaniment, bounded notes and separated attacks",()=>{
  for(const a of albums)for(const scene of ["lounge","play"] as const){
   const p=planMusic(a,scene);expect(p.notes.length).toBeGreaterThan(40);
   for(const n of p.notes){
    expect(n.duration).toBeGreaterThan(0);expect(n.start+n.duration).toBeLessThanOrEqual((n.bar+1)*p.barSeconds+.00001);
    if(n.role==="lead")expect(chords[n.chord].tones).toContain(((n.pitch-a.key)%12+12)%12);
    if(n.role==="harmony"){
     const lead=p.notes.filter(l=>l.role==="lead"&&l.bar===n.bar);
     for(const l of lead){expect(n.pitch).toBeLessThan(l.pitch);expect(Math.abs(n.start-l.start)).toBeGreaterThan(.03)}
    }
   }
  }
 });
 it("keeps accompaniment and transients behind the lead by explicit RMS targets",()=>{
  expect(20*Math.log10(targetRms.harmony/targetRms.lead)).toBeLessThan(-8);
  expect(20*Math.log10(targetRms.bass/targetRms.lead)).toBeLessThan(-10);
  expect(20*Math.log10(targetRms.rhythm/targetRms.lead)).toBeLessThan(-18);
  expect(roles).toHaveLength(4);
 });
 it("measures active RMS independently of silent phrases",()=>{
  const a=new Float32Array(1000);a.fill(.25,200,400);expect(activeRms([a,a],1000)).toBeCloseTo(.25,5);
  expect(activeRms([new Float32Array(1000)],1000)).toBe(0);
 });
});
