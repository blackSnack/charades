import {test,expect,type Locator} from "@playwright/test";

// Verify the fit after layout and ResizeObserver have converged, without a
// fixed sleep or changing any of the original readability thresholds.
async function fittedGeometry(word:Locator){
 return word.evaluate(async e=>{
  const measure=()=>{
   const zone=e.parentElement!,card=zone.closest(".question-default")!,style=getComputedStyle(card),stage=card.parentElement!,stageStyle=getComputedStyle(stage);
   const count=Array.from(e.textContent||"").length;
   const cols=count<=4?Math.max(1,count):Math.min(6,Math.ceil(count/2)),rows=Math.ceil(count/cols);
   const font=parseFloat(getComputedStyle(e).fontSize),available=zone.clientWidth,availableHeight=zone.clientHeight;
   const expected=Math.max(16,Math.min(160,.96*available/cols,.94*availableHeight/(rows*1.14)));
   const expectedCard=stageStyle.display==="grid"?(stage.clientWidth-parseFloat(stageStyle.columnGap))*1.65/2.65:stage.clientWidth;
   return {font,expected,width:e.getBoundingClientRect().width,available,availableHeight,cardInner:card.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),cardWidth:card.getBoundingClientRect().width,expectedCard,word:e.textContent};
  };
  const first=measure();await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));
  const last=measure();return {...last,stable:Math.abs(first.font-last.font)<.5&&first.available===last.available&&first.availableHeight===last.availableHeight};
 });
}
async function assertFitted(word:Locator){
 await expect.poll(async()=>{const d=await fittedGeometry(word);return d.stable&&Math.abs(d.font-d.expected)<1&&Math.abs(d.cardWidth-d.expectedCard)<2&&d.available/d.cardInner>.95&&d.font>=45&&d.width/d.available>.8},{timeout:2000,message:"Question text must converge to the actual final card geometry"}).toBe(true);
 const d=await fittedGeometry(word);console.log("Settled card geometry",JSON.stringify(d));expect(d.font).toBeGreaterThanOrEqual(45);expect(d.width/d.available).toBeGreaterThan(.8);expect(d.available/d.cardInner).toBeGreaterThan(.95);
}
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
 const word=page.getByTestId("word");await expect(word).toBeVisible();await expect(word).toHaveClass("question-word-text");await assertFitted(word);
 await page.screenshot({path:info.outputPath("default-game.png")});
 // Repeated next-question mounts must not inherit stale setup measurements.
 for(let i=0;i<3;i++){await page.getByRole("button",{name:/下一题 \/ 跳过/}).click();await assertFitted(word)}
 // Real viewport change: the same current word must grow/shrink with its zone.
 const size=page.viewportSize()!;
 if(info.project.name==="phone"){
  const before=await word.textContent();
  await page.setViewportSize({width:844,height:390});
  await assertFitted(word);
  await expect(word).toHaveText(before||"");
  await page.setViewportSize(size);
  await assertFitted(word);
 }
});
