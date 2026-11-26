import {test,expect} from "@playwright/test";
test("GPU aura issues real WebGL2 draw calls for thunder and fire, then disposes",async({page},info)=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.addInitScript(()=>{
  let draws=0;Object.defineProperty(window,"__gpuDraws",{get:()=>draws});
  if(typeof WebGL2RenderingContext==="undefined")return;
  const proto=WebGL2RenderingContext.prototype as unknown as Record<string,Function>;
  for(const name of ["drawArrays","drawElements","drawArraysInstanced","drawElementsInstanced"]){
   const original=proto[name];if(typeof original!=="function")continue;
   proto[name]=function(this:WebGL2RenderingContext,...args:unknown[]){const result=original.apply(this,args);draws++;return result};
  }
 });
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();
 const stage=page.getByTestId("vfx-stage");
 for(const level of ["困难","地狱"]){
  const before=await page.evaluate(()=>(window as unknown as {__gpuDraws:number}).__gpuDraws);
  await page.getByRole("button",{name:level,exact:true}).click();
  await page.getByRole("button",{name:/翻牌揭晓/}).click();
  await expect(stage).toHaveAttribute("data-gpu","active",{timeout:10000});
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__gpuDraws:number}).__gpuDraws),{timeout:10000}).toBeGreaterThan(before+1);
  await page.screenshot({path:info.outputPath(level==="地狱"?"gpu-fire.png":"gpu-thunder.png")});
  await page.getByRole("button",{name:/重置卡背/}).click();await expect(page.locator("canvas.vfx-gpu-canvas")).toHaveCount(0);
 }
});
test("unsupported WebGL2 falls back to classic effects",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type==="webgl2")return null;return Reflect.apply(original,this,[type,...args])} as typeof original;
 });
 await page.goto("./");await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:"地狱",exact:true}).click();
 await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-gpu","fallback");
 await expect(page.getByText("WebGL2 不可用 · 已降级")).toBeVisible();await expect(page.locator(".vfx-flames")).toHaveCount(1);
});
