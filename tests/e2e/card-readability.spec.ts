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
