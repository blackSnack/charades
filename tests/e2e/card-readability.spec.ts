import {test,expect} from "@playwright/test";
test("removed elemental preference migrates and all remaining cards prioritize the word",async({page},info)=>{
 await page.addInitScript(()=>localStorage.setItem("party-deck-theme-v1",JSON.stringify({theme:"gpu",quality:"high",favorites:["gpu","warm"]})));
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();
 await expect(page.getByText("当前游戏：经典桌游。",{exact:false})).toBeVisible();
 await expect(page.getByRole("button",{name:/元素卡/})).toHaveCount(0);
 for(const theme of ["经典桌游","暖色收藏卡","暖金液态金属"]){
  await page.getByRole("button",{name:new RegExp(theme)}).click();
  await page.getByRole("button",{name:"困难",exact:true}).click();
  await page.getByRole("button",{name:/翻牌揭晓/}).click();
  const word=page.getByTestId("vfx-word");
  await expect(word).toHaveText("草木皆兵");
  const m=await word.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement!.getBoundingClientRect(),card=e.closest(".vfx-front")!.getBoundingClientRect();return {size:parseFloat(getComputedStyle(e).fontSize),width:r.width,zone:p.width,height:p.height,card:card.height,scroll:e.scrollWidth,client:e.clientWidth}});
  expect(m.size).toBeGreaterThanOrEqual(45);expect(m.width/m.zone).toBeGreaterThan(.80);expect(m.height/m.card).toBeGreaterThan(.60);expect(m.scroll).toBeLessThanOrEqual(m.client+1);
  await page.screenshot({path:info.outputPath(theme+"-readability.png")});
 }
});
test("metal overlay disabled by reduced motion or off",async({page})=>{
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:/暖金液态金属/}).click();await page.getByRole("button",{name:"地狱",exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(page.getByTestId("metal-rim")).toHaveCount(0);await expect(page.getByTestId("vfx-word")).toBeVisible();
});

test("WebGL unavailable leaves metal deck readable",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type.includes("webgl"))return null;return Reflect.apply(original,this,[type,...args])} as typeof original;
  if(typeof OffscreenCanvas!=="undefined"){const offscreen=OffscreenCanvas.prototype.getContext;OffscreenCanvas.prototype.getContext=function(this:OffscreenCanvas,type:string,...args:unknown[]){if(type.includes("webgl"))return null;return Reflect.apply(offscreen,this,[type,...args])} as typeof offscreen}
 });
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:/暖金液态金属/}).click();await page.getByRole("button",{name:"地狱",exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();
 await page.waitForFunction(()=>{const e=document.querySelector(".vfx-flipper");return !!e&&Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m11+1)<.01});
 await expect(page.getByTestId("metal-rim")).toHaveCount(0);
 await expect(page.getByTestId("vfx-word")).toHaveText("沆瀣一气");
 await page.getByRole("button",{name:/重置卡背/}).click();await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-revealed","false");
});
test("default gameplay shares fitted question typography",async({page},info)=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();await page.getByRole("button",{name:/Solo 模式/}).click();
 await page.getByLabel("字数筛选",{exact:true}).selectOption("exact");await page.getByLabel("字数",{exact:true}).selectOption("4");await page.getByRole("button",{name:/开始游戏/}).click();
 const word=page.getByTestId("word");await expect(word).toBeVisible();await expect(word).toHaveClass("question-word-text");const dims=await word.evaluate(e=>{const zone=e.parentElement!,card=zone.closest(".question-default")!,style=getComputedStyle(card);return {font:parseFloat(getComputedStyle(e).fontSize),width:e.getBoundingClientRect().width,available:zone.clientWidth,availableHeight:zone.clientHeight,cardInner:card.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),columns:style.gridTemplateColumns,rows:style.gridTemplateRows,word:e.textContent}});console.log("Default card geometry",JSON.stringify(dims));expect(dims.available/dims.cardInner).toBeGreaterThan(.95);expect(dims.font).toBeGreaterThanOrEqual(45);expect(dims.width/dims.available).toBeGreaterThan(.8);
 await page.screenshot({path:info.outputPath("default-game.png")});
 // Real viewport change: the same current word must grow/shrink with its zone.
 const size=page.viewportSize()!;
 if(info.project.name==="phone"){
  const before=await word.textContent();
  await page.setViewportSize({width:844,height:390});
  await expect.poll(()=>word.evaluate(e=>{const p=e.parentElement!;return Math.abs(parseFloat(getComputedStyle(e).fontSize)-Math.max(16,Math.min(160,.96*p.clientWidth/4,.94*p.clientHeight/1.14)))})).toBeLessThan(1);
  await expect.poll(()=>word.evaluate(e=>e.getBoundingClientRect().width/e.parentElement!.clientWidth)).toBeGreaterThan(.8);
  await expect(word).toHaveText(before||"");
  await page.setViewportSize(size);
  await expect.poll(()=>word.evaluate(e=>Math.abs(parseFloat(getComputedStyle(e).fontSize)-.96*e.parentElement!.clientWidth/4))).toBeLessThan(1);
 }
});
