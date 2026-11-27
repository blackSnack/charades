import {test,expect} from "@playwright/test";
import {writeFileSync} from "node:fs";
import {sourcePalette,deltaE} from "./reference-palette";
const themes=[["纸箔幻彩","balatro"],["古典工艺","gwent"],["熔铁余烬","infernal"],["木刻秘仪","occult"]] as const;
const levels=["简单","中等","困难","地狱"] as const;
test("all sixteen reference cards have distinct reference plates and readable live words",async({page},info)=>{
 test.setTimeout(120000);
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();
 await page.getByRole("button",{name:"关闭",exact:true}).click();
 const diagnostics:unknown[]=[];
 for(const [name,id] of themes){
  await page.getByRole("button",{name:new RegExp(name)}).click();
  const materials=new Set<string>();
  for(const [i,level] of levels.entries()){
   await page.getByRole("button",{name:level,exact:true}).click();
   await page.getByRole("button",{name:/翻牌揭晓/}).click();
   const stage=page.getByTestId("vfx-stage"),word=stage.getByTestId("vfx-word"),art=stage.locator(".reference-frame");
   await expect(art).toHaveAttribute("data-reference",id);await expect(art).toHaveAttribute("data-art-state","ready");await expect(stage).toHaveAttribute("data-level",String(i+1));
   await expect(word).toHaveText("大熊猫");await expect(stage.getByTestId("reference-shine")).toHaveCount(0);
   await expect.poll(()=>word.evaluate(e=>{const p=e.parentElement!,s=getComputedStyle(e);return p.clientWidth>0&&parseFloat(s.fontSize)>=45&&e.getBoundingClientRect().width/p.clientWidth>.8&&e.scrollWidth<=e.clientWidth+1}),{message:"Text fit "+id+" "+level}).toBe(true);
   materials.add((await art.getAttribute("data-material"))!);
   await stage.screenshot({path:info.outputPath(id+"-"+(i+1)+"-static.png"),animations:"disabled"});
   // Capture the rendered art separately from the live word for palette diagnostics.
   const content=stage.locator(".vfx-front-content");await content.evaluate(e=>{(e as HTMLElement).style.visibility="hidden"});
   let image:Buffer;try{image=await stage.locator(".vfx-front").screenshot({animations:"disabled"})}finally{await content.evaluate(e=>{(e as HTMLElement).style.visibility=""})}
   const observed=await page.evaluate(async data=>{const im=new Image();im.src="data:image/png;base64,"+data;await im.decode();const c=document.createElement("canvas");c.width=im.width;c.height=im.height;const g=c.getContext("2d")!;g.drawImage(im,0,0);const pixels=g.getImageData(0,0,c.width,c.height).data;
    const median=(x0:number,x1:number,y0:number,y1:number)=>{const a=[[],[],[]] as number[][];for(let y=Math.floor(c.height*y0);y<Math.floor(c.height*y1);y++)for(let x=Math.floor(c.width*x0);x<Math.floor(c.width*x1);x++){const k=(y*c.width+x)*4;for(let z=0;z<3;z++)a[z].push(pixels[k+z])}return a.map(v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)])};
    return [median(.30,.70,.27,.34),median(.02,.045,.30,.70)];
   },image.toString("base64"));
   const target=sourcePalette[id][i];diagnostics.push({theme:id,level:i+1,source:target,observed,paperDeltaE:deltaE(observed[0],target[0]),rimDeltaE:deltaE(observed[1],target[1])});

  }
  expect(materials.size).toBe(4);
  await page.getByRole("button",{name:"四级对照"}).click();
  const gallery=page.getByLabel("四级样式对照");await expect(gallery.locator(".reference-art")).toHaveCount(4);await expect(gallery.getByTestId("reference-shine")).toHaveCount(0);await expect(gallery.locator("[data-art-state=ready]")).toHaveCount(4);await gallery.screenshot({path:info.outputPath(id+"-comparison.png"),animations:"disabled"});
  await page.getByRole("button",{name:"收起四级对照"}).click();
 }
 writeFileSync(info.outputPath("reference-color-diagnostics.json"),JSON.stringify(diagnostics,null,2));
});
test("upstream Shine Border softly sweeps a one pixel mask without changing the card face",async({page},info)=>{
 test.setTimeout(120000);await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:"完整",exact:true}).click();
 for(const [name,id] of themes){
  await page.getByRole("button",{name:new RegExp(name)}).click();
  await page.getByRole("button",{name:"简单",exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(page.getByTestId("reference-shine")).toHaveCount(0);
  for(const level of ["中等","困难","地狱"]){
   await page.getByRole("button",{name:level,exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();
   const shine=page.getByTestId("reference-shine"),stage=page.getByTestId("vfx-stage"),face=stage.locator(".vfx-front");
   await expect(shine).toBeVisible();await page.waitForFunction(()=>{const e=document.querySelector(".vfx-flipper");return !!e&&Math.abs(new DOMMatrixReadOnly(getComputedStyle(e).transform).m11+1)<.01});
   await expect(shine).toHaveCSS("padding-top","1px");await expect(shine).toHaveCSS("background-size","300% 300%");
   await expect.poll(()=>shine.evaluate(e=>e.getAnimations().length)).toBeGreaterThan(0);
   const position=await shine.evaluate(e=>getComputedStyle(e).backgroundPosition);
   await expect.poll(()=>shine.evaluate(e=>getComputedStyle(e).backgroundPosition)).not.toBe(position);
   // Capture stable browser pixels at several actual animation phases. No synthetic rendering.
   await shine.evaluate(e=>{e.getAnimations().forEach(a=>a.pause());(e as HTMLElement).style.visibility="hidden"});
   const base=await face.screenshot({scale:"css"});
   await shine.evaluate(e=>{(e as HTMLElement).style.visibility=""});
   const phases=[1800,4100,7300];let lit=0;const frames:string[]=[];
   for(const time of phases){
    await shine.evaluate((e,t)=>{e.getAnimations().forEach(a=>{a.currentTime=t})},time);
    const img=await face.screenshot({scale:"css",path:info.outputPath(id+"-"+level+"-shine-"+time+".png")});
    const result=await page.evaluate(async({before,after})=>{
     async function decode(data:string){const im=new Image();im.src="data:image/png;base64,"+data;await im.decode();const c=document.createElement("canvas");c.width=im.width;c.height=im.height;const g=c.getContext("2d")!;g.drawImage(im,0,0);return {w:c.width,h:c.height,p:g.getImageData(0,0,c.width,c.height).data}}
     const a=await decode(before),b=await decode(after);let changed=0,center=0,maxDepth=0;
     for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){const i=(y*a.w+x)*4;if(Math.max(Math.abs(a.p[i]-b.p[i]),Math.abs(a.p[i+1]-b.p[i+1]),Math.abs(a.p[i+2]-b.p[i+2]))>5){changed++;const r=Math.min(20,a.w/2,a.h/2),qx=Math.abs(x+.5-a.w/2)-a.w/2+r,qy=Math.abs(y+.5-a.h/2)-a.h/2+r;maxDepth=Math.max(maxDepth,r-Math.hypot(Math.max(qx,0),Math.max(qy,0))-Math.min(Math.max(qx,qy),0));if(x>a.w*.2&&x<a.w*.8&&y>a.h*.2&&y<a.h*.8)center++}}
     return {changed,center,maxDepth};
    },{before:base.toString("base64"),after:img.toString("base64")});
    expect(result.center).toBe(0);expect(result.maxDepth).toBeLessThanOrEqual(3);lit+=result.changed;frames.push(img.toString("base64"));console.log("Shine pixels",JSON.stringify({id,level,time,...result}));
   }
   expect(lit).toBeGreaterThan(10);expect(new Set(frames).size).toBeGreaterThan(1);
   await page.getByRole("button",{name:/重置卡背/}).click();await expect(shine).toHaveCount(0);
  }
 }
 await page.getByRole("button",{name:"关闭",exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(page.getByTestId("reference-shine")).toHaveCount(0);await expect(page.getByTestId("vfx-word")).toHaveText("大熊猫");
});
test("reference deck is applied to real game and persisted",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:/木刻秘仪/}).click();await page.getByRole("button",{name:"关闭",exact:true}).click();await page.getByRole("button",{name:"应用到游戏"}).click();await page.getByRole("button",{name:"返回首页"}).click();await page.getByRole("button",{name:/Solo 模式/}).click();await page.getByRole("button",{name:/开始游戏/}).click();
 await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","occult");await expect(page.getByTestId("word")).toBeVisible();const text=await page.getByTestId("word").textContent();await page.reload();await page.getByRole("button",{name:/继续游戏/}).click();await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","occult");await expect(page.getByTestId("word")).toHaveText(text!);
});
