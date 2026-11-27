import {test,expect} from "@playwright/test";
test("warm card uses upstream foil and preference applies to live game across reload",async({page})=>{
 await page.emulateMedia({reducedMotion:"no-preference"});await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();
 await page.getByRole("button",{name:/卡牌动效实验室/}).click();await page.getByRole("button",{name:/暖色收藏卡/}).click();await page.getByRole("button",{name:"困难",exact:true}).click();
 await page.getByRole("button",{name:/翻牌揭晓/}).click();await expect(page.locator(".warm-foil .holo-card[data-effect=prism]")).toHaveCount(1);await expect(page.getByTestId("vfx-word")).toHaveText("草木皆兵");
 await expect(page.getByRole("button",{name:/^收藏此卡组$|^取消收藏$/})).toHaveCount(0);await page.getByRole("button",{name:"应用到游戏"}).click();await expect(page.getByText("已应用到游戏")).toBeVisible();
 await page.getByRole("button",{name:"返回首页"}).click();await page.getByRole("button",{name:/Solo 模式/}).click();await page.getByLabel("难度",{exact:true}).selectOption("3");await page.getByRole("button",{name:/开始游戏/}).click();
 await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","warm");const word=await page.getByTestId("word").textContent();await page.reload();await page.getByRole("button",{name:/继续游戏/}).click();await expect(page.getByTestId("vfx-stage")).toHaveAttribute("data-theme","warm");await expect(page.getByTestId("word")).toHaveText(word||"");
});
