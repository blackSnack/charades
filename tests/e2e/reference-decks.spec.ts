import {test,expect} from "@playwright/test";
const themes=[["纸箔幻彩","balatro"],["古典工艺","gwent"],["熔铁余烬","infernal"],["木刻秘仪","occult"]] as const;
const levels=["简单","中等","困难","地狱"] as const;
test("all sixteen reference cards have distinct vector art and readable live words",async({page},info)=>{
 test.setTimeout(120000);
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();
 await page.getByRole("button",{name:"关闭",exact:true}).click();
 for(const [name,id] of themes){
  await page.getByRole("button",{name:new RegExp(name)}).click();
  const materials=new Set<string>();
  for(const [i,level] of levels.entries()){
   await page.getByRole("button",{name:level,exact:true}).click();
   await page.getByRole("button",{name:/翻牌揭晓/}).click();
   const stage=page.getByTestId("vfx-stage"),word=stage.getByTestId("vfx-word"),art=stage.locator(".reference-frame");
   await expect(art).toHaveAttribute("data-reference",id);await expect(stage).toHaveAttribute("data-level",String(i+1));
   await expect(word).toHaveText("大熊猫");await expect(stage.locator("canvas")).toHaveCount(0);
   await expect.poll(()=>word.evaluate(e=>{const p=e.parentElement!,s=getComputedStyle(e);return p.clientWidth>0&&parseFloat(s.fontSize)>=45&&e.getBoundingClientRect().width/p.clientWidth>.8&&e.scrollWidth<=e.clientWidth+1})).toBe(true);
   materials.add((await art.getAttribute("data-material"))!);
   await stage.screenshot({path:info.outputPath(id+"-"+(i+1)+"-static.png"),animations:"disabled"});
  }
  expect(materials.size).toBe(4);
  await page.getByRole("button",{name:"四级对照"}).click();
  const gallery=page.getByLabel("四级样式对照");await expect(gallery.locator(".reference-art")).toHaveCount(4);await expect(gallery.locator("canvas")).toHaveCount(0);await gallery.screenshot({path:info.outputPath(id+"-comparison.png"),animations:"disabled"});
  await page.getByRole("button",{name:"收起四级对照"}).click();
 }
});
test("real WebGL effects animate only the actual rim for each reference family",async({page},info)=>{
 test.setTimeout(120000);await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();
 for(const [name,id] of themes){
  await page.getByRole("button",{name:new RegExp(name)}).click();
  for(const level of ["中等","困难","地狱"]){
   await page.getByRole("button",{name:level,exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();
   const canvas=page.getByTestId("reference-shader");await expect(canvas).toHaveAttribute("data-fx-state","active",{timeout:10000});
   const sample=()=>canvas.evaluate((c:HTMLCanvasElement)=>{const gl=c.getContext("webgl")!;const w=c.width,h=c.height,buf=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);let edge=0,center=0,hash=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,a=buf[i+3];if(a){edge++;hash=(hash+Math.imul(i+1,a+buf[i]))>>>0;if(x>w*.2&&x<w*.8&&y>h*.2&&y<h*.8)center++}}return {edge,center,hash}});
   const first=await sample();expect(first.edge).toBeGreaterThan(0);expect(first.center).toBe(0);
   await expect.poll(async()=>{const next=await sample();return next.edge>0&&next.center===0&&next.hash!==first.hash}).toBe(true);
   await page.getByTestId("vfx-stage").screenshot({path:info.outputPath(id+"-"+level+"-gpu.png"),animations:"disabled"});
   await page.getByRole("button",{name:/重置卡背/}).click();await expect(canvas).toHaveCount(0);
  }
 }
 await page.getByRole("button",{name:"关闭",exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(page.getByTestId("reference-shader")).toHaveCount(0);await expect(page.getByTestId("vfx-word")).toHaveText("大熊猫");
});
test("reference deck is applied to real game and persisted",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:/木刻秘仪/}).click();await page.getByRole("button",{name:"关闭",exact:true}).click();await page.getByRole("button",{name:"应用到游戏"}).click();await page.getByRole("button",{name:"返回首页"}).click();await page.getByRole("button",{name:/Solo 模式/}).click();await page.getByRole("button",{name:/开始游戏/}).click();
 await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","occult");await expect(page.getByTestId("word")).toBeVisible();const text=await page.getByTestId("word").textContent();await page.reload();await page.getByRole("button",{name:/继续游戏/}).click();await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","occult");await expect(page.getByTestId("word")).toHaveText(text!);
});
