import {test,expect} from "@playwright/test";
test("VFX is lazy and four difficulty previews can be replayed",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();
 const requested=await page.evaluate(()=>performance.getEntriesByType("resource").map(x=>x.name));expect(requested.some(n=>/\/(VfxLab|vfx-metal|vfx-foil)-/.test(n))).toBe(false);
 await page.getByRole("button",{name:"实验室",exact:true}).click();await page.getByRole("button",{name:/卡牌实验/}).click();await page.getByRole("button",{name:/暖金液态金属/}).click();await expect(page.getByRole("heading",{name:"卡牌动效实验室"})).toBeVisible();
 const stage=page.getByTestId("vfx-stage");
 for(const [i,name] of ["简单","中等","困难","地狱"].entries()){
  await page.getByRole("button",{name,exact:true}).click();
  await expect(stage).toHaveAttribute("data-level",String(i+1));
  await expect(stage).toHaveAttribute("data-revealed","false");
  await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(stage).toHaveAttribute("data-revealed","true");
  await expect(page.getByTestId("vfx-word")).toHaveText(["大熊猫","金鸡独立","草木皆兵","沆瀣一气"][i]);
  await page.getByRole("button",{name:/重置卡背/}).click();await expect(stage).toHaveAttribute("data-revealed","false");
 }
 await page.getByRole("button",{name:"关闭",exact:true}).click();await expect(page.getByRole("button",{name:"关闭",exact:true})).toHaveAttribute("aria-pressed","true");
 await page.getByRole("button",{name:"返回实验室"}).click();await page.getByRole("button",{name:"返回",exact:true}).click();await expect(page.getByRole("button",{name:/Solo 模式/})).toBeVisible();
});

test("real animation renders and cached lab reopens offline",async({page,context},testInfo)=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();
 await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
 await page.reload();await expect(page.getByText("3290 道题")).toBeVisible();
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const keysBefore=await page.evaluate(async()=>{const keys=await caches.keys();return (await Promise.all(keys.map(async k=>(await (await caches.open(k)).keys()).map(r=>r.url)))).flat()});
 expect(keysBefore.some(n=>/\/(VfxLab|vfx-metal|vfx-foil)-/.test(n))).toBe(false);
 await page.getByRole("button",{name:"实验室",exact:true}).click();await page.getByRole("button",{name:/卡牌实验/}).click();await page.getByRole("button",{name:/暖金液态金属/}).click();
 await page.getByRole("button",{name:"地狱",exact:true}).click();
 await page.getByRole("button",{name:/翻牌揭晓/}).click();
 await expect(page.getByTestId("metal-rim")).toBeVisible();
 await expect.poll(()=>page.locator(".metal-fx-canvas").evaluate((el:HTMLCanvasElement)=>{
 const c=el.getContext("2d");if(!c||!el.width||!el.height)return false;
 const bytes=c.getImageData(0,0,el.width,el.height).data;
 let edge=false;for(let i=3;i<bytes.length;i+=4)if(bytes[i]>0){edge=true;break}
 const center=c.getImageData(Math.floor(el.width/2),Math.floor(el.height/2),1,1).data[3];
 return edge&&center===0
 }),{timeout:10000}).toBe(true);
 await page.waitForFunction(()=>{const el=document.querySelector(".vfx-flipper");return !!el&&Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m11+1)<.01});
 await page.screenshot({path:testInfo.outputPath("hell-card.png")});
 await page.waitForFunction(async()=>{const c=await caches.open("party-deck-vfx-v1");const urls=(await c.keys()).map(x=>x.url);return urls.some(n=>/\/VfxLab-.*\.js$/.test(n))&&urls.some(n=>/\/VfxLab-.*\.css$/.test(n))&&urls.some(n=>/\/vfx-metal-.*\.js$/.test(n))&&urls.some(n=>/\/vfx-foil-.*\.js$/.test(n))});
 await context.setOffline(true);
 try{await page.reload();await expect(page.getByText("3290 道题")).toBeVisible();await page.getByRole("button",{name:"实验室",exact:true}).click();await page.getByRole("button",{name:/卡牌实验/}).click();await page.getByRole("button",{name:/暖金液态金属/}).click();await expect(page.getByRole("heading",{name:"卡牌动效实验室"})).toBeVisible()}finally{await context.setOffline(false)}
});
