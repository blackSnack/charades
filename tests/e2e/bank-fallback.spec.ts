import {test,expect} from "@playwright/test";
test("cached bank survives failed refresh; toast does not change layout and recovery is silent",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();
 const footer=page.getByTestId("update-footer");const before=await footer.boundingBox();
 let fail=true;
 await page.route("**/question-bank/manifest.json",route=>fail?route.fulfill({status:503,body:"unavailable"}):route.continue());
 await page.evaluate(()=>window.dispatchEvent(new Event("online")));
 const toast=page.getByTestId("bank-toast");await expect(toast).toBeVisible();await expect(toast).toContainText("已使用本地题库");
 await expect(page.getByText("3290 道题")).toBeVisible();
 const after=await footer.boundingBox();for(const key of ["x","y","width","height"] as const)expect(Math.abs(before![key]-after![key])).toBeLessThan(1);
 fail=false;await toast.getByRole("button",{name:"重试"}).click();await expect(toast).toHaveCount(0);
 await page.getByRole("button",{name:/Solo 模式/}).click();await expect(page.getByRole("button",{name:/开始游戏/})).toBeEnabled();
});
test("first load without bank offers recovery instead of misleading empty filter",async({page})=>{
 let fail=true;await page.route("**/question-bank/manifest.json",route=>fail?route.fulfill({status:503,body:"unavailable"}):route.continue());
 await page.goto("./");await expect(page.getByTestId("bank-toast")).toContainText("暂无可用题库");
 await page.getByRole("button",{name:/Solo 模式/}).click();await expect(page.getByRole("button",{name:"重新加载题库"})).toBeEnabled();
 fail=false;await page.getByRole("button",{name:"重新加载题库"}).click();await expect(page.getByRole("button",{name:/开始游戏/})).toBeEnabled();
});
