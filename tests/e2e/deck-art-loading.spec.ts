import {test,expect} from "@playwright/test";
test.use({serviceWorkers:"block"});
test("cold slow Gwent hell asset loads before reveal and is reused",async({page},info)=>{
 let release!:()=>void,requests=0;
 const gate=new Promise<void>(resolve=>{release=resolve});
 await page.route("**/deck-art/v1/gwent-4.webp",async route=>{requests++;await gate;await route.continue()});
 try{
  await page.goto("./");await page.getByRole("button",{name:"实验室",exact:true}).click();await page.getByRole("button",{name:/卡牌实验/}).click();
  await page.getByRole("button",{name:/古典工艺/}).click();
  await expect.poll(()=>requests).toBe(1); // before selecting Hell or revealing
  await page.getByRole("button",{name:"地狱",exact:true}).click();
  const stage=page.getByTestId("vfx-stage"),word=stage.getByTestId("vfx-word"),art=stage.locator(".reference-frame");
  await page.getByRole("button",{name:/翻牌揭晓/}).click();
  await expect(stage).toHaveAttribute("data-revealed","false");
  await expect(art).toHaveAttribute("data-art-state","loading");
  await expect(word).not.toBeVisible();
  await expect(stage.getByText("正在准备卡牌…")).toBeVisible();
  await page.waitForTimeout(1100); // deliberate delayed response regression
  await expect(stage).toHaveAttribute("data-revealed","false");
  await expect(art.locator(".reference-art-fallback")).toHaveCount(0);
  await stage.screenshot({path:info.outputPath("gwent-held-card-back.png")});
  release();
  await expect(art).toHaveAttribute("data-art-state","ready");await expect(stage).toHaveAttribute("data-revealed","true");
  await expect(word).toBeVisible();await stage.screenshot({path:info.outputPath("gwent-complete-first-reveal.png")});
  await page.getByRole("button",{name:/重置卡背/}).click();await expect(art).toHaveAttribute("data-art-state","ready");
  await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(stage).toHaveAttribute("data-revealed","true");expect(requests).toBe(1);
  await page.getByRole("button",{name:"应用到游戏"}).click();await page.getByRole("button",{name:"返回实验室"}).click();await page.getByRole("button",{name:"返回",exact:true}).click();await page.getByRole("button",{name:/Solo 模式/}).click();
  await page.getByLabel("难度",{exact:true}).selectOption("3");await page.getByRole("button",{name:/开始游戏/}).click();
  await expect(stage).toHaveAttribute("data-theme","gwent");await expect(art).toHaveAttribute("data-art-state","ready");await expect(stage).toHaveAttribute("data-revealed","true");
  await page.getByRole("button",{name:/下一题 \/ 跳过/}).click();await expect(art).toHaveAttribute("data-art-state","ready");await expect(stage).toHaveAttribute("data-revealed","true");expect(requests).toBe(1);
 }finally{release()}
});
test("failed asset stays in readable fallback until an explicit new reveal",async({page})=>{
 let fail=true;await page.route("**/deck-art/v1/gwent-4.webp",route=>fail?route.abort():route.continue());
 await page.goto("./");await page.getByRole("button",{name:"实验室",exact:true}).click();await page.getByRole("button",{name:/卡牌实验/}).click();await page.getByRole("button",{name:/古典工艺/}).click();await page.getByRole("button",{name:"地狱",exact:true}).click();
 const stage=page.getByTestId("vfx-stage"),art=stage.locator(".reference-frame");
 await page.getByRole("button",{name:/翻牌揭晓/}).click();
 await expect(art).toHaveAttribute("data-art-state","fallback");await expect(stage).toHaveAttribute("data-revealed","true");await expect(stage.getByTestId("vfx-word")).toBeVisible();await expect(stage.getByText("卡牌资源未加载")).toBeVisible();
 fail=false;await page.waitForTimeout(1100);await expect(art).toHaveAttribute("data-art-state","fallback");
 await page.getByRole("button",{name:/重置卡背/}).click();await expect(art).toHaveAttribute("data-art-state","ready");await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(stage).toHaveAttribute("data-revealed","true");
});
