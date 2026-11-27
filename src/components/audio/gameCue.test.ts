import {describe,expect,it} from "vitest";
import {gameCue} from "./useGameAudio";
import type {Game} from "../../core/game";
describe("committed game audio cues",()=>{
 it("prioritizes semantic events over card noise",()=>{
  const g={current:{level:4}} as Game;
  expect(gameCue(["ANSWER_CORRECT","QUESTION_CHANGED"],g)).toBe("correct");
  expect(gameCue(["QUESTION_SKIPPED","QUESTION_CHANGED"],g)).toBe("skip");
  expect(gameCue(["TURN_COMPLETED","ANSWER_CORRECT"],g)).toBe("handoff");
  expect(gameCue(["GAME_ENDED"],g)).toBe("finish");
  expect(gameCue(["QUESTION_CHANGED"],g)).toBe("flip4");
  expect(gameCue([],g)).toBeUndefined();
 });
});
