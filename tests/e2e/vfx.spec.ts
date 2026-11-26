import {test,expect} from "@playwright/test";
test("VFX is lazy and four difficulty previews can be replayed",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();
 const requested=await page.evaluate(()=>performance.getEntriesByType("resource").map(x=>x.name));expect(requested.some(n=>/\/(VfxLab|vfx-particles)-/.test(n))).toBe(false);
 await page.getByRole("button",{name:/卡牌动效实验室/}).click();await expect(page.getByRole("heading",{name:"卡牌动效实验室"})).toBeVisible();
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
 await page.getByRole("button",{name:"返回首页"}).click();await expect(page.getByRole("button",{name:/Solo 模式/})).toBeVisible();
});
