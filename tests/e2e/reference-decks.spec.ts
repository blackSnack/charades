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
   await expect(word).toHaveText("大熊猫");await expect(stage.getByTestId("reference-shader")).toHaveCount(0);
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
  const gallery=page.getByLabel("四级样式对照");await expect(gallery.locator(".reference-art")).toHaveCount(4);await expect(gallery.getByTestId("reference-shader")).toHaveCount(0);await expect(gallery.locator("[data-art-state=ready]")).toHaveCount(4);await gallery.screenshot({path:info.outputPath(id+"-comparison.png"),animations:"disabled"});
  await page.getByRole("button",{name:"收起四级对照"}).click();
 }
 writeFileSync(info.outputPath("reference-color-diagnostics.json"),JSON.stringify(diagnostics,null,2));
});
test("real WebGL effects animate only the actual rim for each reference family",async({page},info)=>{
 test.setTimeout(120000);await page.emulateMedia({reducedMotion:"no-preference"});
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();
 for(const [name,id] of themes){
  await page.getByRole("button",{name:new RegExp(name)}).click();
  for(const level of ["中等","困难","地狱"]){
   await page.getByRole("button",{name:level,exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();
   const canvas=page.getByTestId("reference-shader");await expect(canvas).toHaveAttribute("data-fx-state","active",{timeout:10000});await expect(canvas).toHaveAttribute("data-relief","active",{timeout:10000});
   // Read actual framebuffer, including the frames after the old delayed overlay appeared.
   const sample=()=>canvas.evaluate((c:HTMLCanvasElement)=>{
    const gl=c.getContext("webgl")!,w=c.width,h=c.height,cw=c.clientWidth,ch=c.clientHeight,buf=new Uint8Array(w*h*4);
    gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,buf);
    let edge=0,center=0,maxDepth=0,hash=0,sx=0,sy=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4,a=buf[i+3];if(a>5){
      edge++;hash=(hash+Math.imul(i+1,a+buf[i]))>>>0;
      const px=(x+.5)*cw/w,py=(y+.5)*ch/h;
      sx+=px;sy+=py;
      const r=Math.min(20,cw*.5,ch*.5),qx=Math.abs(px-cw*.5)-cw*.5+r,qy=Math.abs(py-ch*.5)-ch*.5+r;
      const depth=r-Math.hypot(Math.max(qx,0),Math.max(qy,0))-Math.min(Math.max(qx,qy),0);
      maxDepth=Math.max(maxDepth,depth);
      if(x>w*.2&&x<w*.8&&y>h*.2&&y<h*.8)center++;
     }
    }
    return {edge,center,maxDepth,hash,x:sx/Math.max(edge,1),y:sy/Math.max(edge,1),coverage:edge*cw*ch/(w*h)/(2*(cw+ch)-8*20+2*Math.PI*20)/3};
   });
   await expect.poll(async()=>(await sample()).edge).toBeGreaterThan(0);
   const first=await sample();expect(first.center).toBe(0);expect(first.maxDepth).toBeLessThanOrEqual(4);expect(first.coverage).toBeLessThan(.35);
   const stage=page.getByTestId("vfx-stage");
   await stage.screenshot({path:info.outputPath(id+"-"+level+"-flow-start.png"),animations:"disabled"});
   await expect.poll(async()=>{const next=await sample();return next.edge>0&&next.center===0&&next.maxDepth<=4&&next.coverage<.35&&Math.hypot(next.x-first.x,next.y-first.y)>18},{timeout:5000}).toBe(true);
   // A later screenshot and measurement catches the old ring appearing ~1s after reveal.
   await page.waitForTimeout(1100);
   const later=await sample();expect(later.edge).toBeGreaterThan(0);expect(later.center).toBe(0);expect(later.maxDepth).toBeLessThanOrEqual(4);expect(later.coverage).toBeLessThan(.35);
   await stage.screenshot({path:info.outputPath(id+"-"+level+"-gpu.png"),animations:"disabled"});
   console.log("Flow rim",JSON.stringify({theme:id,level,first,later}));
   await page.getByRole("button",{name:/重置卡背/}).click();await expect(canvas).toHaveCount(0);
  }
 }
 await page.getByRole("button",{name:"关闭",exact:true}).click();await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(page.getByTestId("reference-shader")).toHaveCount(0);await expect(page.getByTestId("vfx-word")).toHaveText("大熊猫");
});
test("reference deck is applied to real game and persisted",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:/木刻秘仪/}).click();await page.getByRole("button",{name:"关闭",exact:true}).click();await page.getByRole("button",{name:"应用到游戏"}).click();await page.getByRole("button",{name:"返回首页"}).click();await page.getByRole("button",{name:/Solo 模式/}).click();await page.getByRole("button",{name:/开始游戏/}).click();
 await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","occult");await expect(page.getByTestId("word")).toBeVisible();const text=await page.getByTestId("word").textContent();await page.reload();await page.getByRole("button",{name:/继续游戏/}).click();await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","occult");await expect(page.getByTestId("word")).toHaveText(text!);
});
