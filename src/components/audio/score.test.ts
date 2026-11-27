import {describe,expect,it} from "vitest";
import {albums,effects,loopSeconds} from "./score";
import {deckThemes} from "../../services/deckTheme";
describe("audio EP catalogue",()=>{
 it("covers every existing deck theme with unique IDs and two musical states",()=>{
  expect(albums).toHaveLength(12);expect(new Set(albums.map(a=>a.id)).size).toBe(12);
  for(const t of deckThemes)expect(albums.some(a=>a.theme===t.id)).toBe(true);
  for(const a of albums){expect(a.tempo[1]).toBeGreaterThan(a.tempo[0]);expect(loopSeconds(a,"lounge")).toBeGreaterThan(loopSeconds(a,"play"));expect(loopSeconds(a,"play")).toBeGreaterThan(20)}
 });
 it("includes the four existing difficulty levels and twelve event previews",()=>{expect(effects).toHaveLength(12);expect(effects.filter(([id])=>id.startsWith("flip"))).toHaveLength(4)});
});
