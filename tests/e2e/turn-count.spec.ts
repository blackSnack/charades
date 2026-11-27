import {test,expect} from "@playwright/test";
test("ten slots, red abandoned question and separate whole-turn abandonment",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();await page.getByRole("button",{name:/多人模式/}).click();
 await page.getByRole("button",{name:"2",exact:true}).click();
 await page.getByRole("button",{name:"10题",exact:true}).click();await page.getByRole("button",{name:"1次",exact:true}).click();
 await expect(page.getByText("2 人 · 每轮共 20 题")).toBeVisible();
 await page.getByRole("button",{name:/下一步/}).click();await page.getByRole("button",{name:/开始游戏/}).click();
 await page.getByRole("button",{name:/准备好了/}).click();
 const progress=page.getByTestId("turn-progress"),bar=page.getByRole("progressbar"),correct=page.getByRole("button",{name:"答对！",exact:true}),question=page.getByRole("button",{name:"放弃当前题",exact:true}),turn=page.getByRole("button",{name:"放弃本回合",exact:true});
 await expect(progress).toHaveText("0 / 10");await expect(question).toHaveCount(0);await expect(turn).toBeVisible();
 await page.getByRole("button",{name:/换题 · 剩余 1/}).click();
 await expect(progress).toHaveText("0 / 10");await expect(question).toBeVisible();await expect(turn).toBeVisible();
 await correct.click();await expect(progress).toHaveText("1 / 10");const old=await page.getByTestId("word").textContent();
 await question.click();await expect(progress).toHaveText("2 / 10");await expect(page.getByTestId("word")).not.toHaveText(old||"");await expect(bar).toHaveAttribute("aria-valuetext","已处理 2 / 10 题，答对 1 题，放弃 1 题");
 await expect(bar.locator(".segment").nth(0)).toHaveAttribute("data-outcome","correct");await expect(bar.locator(".segment").nth(1)).toHaveAttribute("data-outcome","abandoned");await expect(bar.locator(".segment").nth(1).locator("i")).toHaveCSS("background-color","rgb(201, 47, 69)");
 await page.reload();await page.getByRole("button",{name:/继续游戏/}).click();await expect(progress).toHaveText("2 / 10");await expect(bar.locator(".segment").nth(1)).toHaveAttribute("data-outcome","abandoned");
 for(let i=3;i<=9;i++){await correct.click();await expect(progress).toHaveText(i+" / 10");await expect(bar).toHaveAttribute("aria-valuenow",String(i));await expect(page.getByTestId("word")).toBeVisible();await expect(page.getByText("回合完成！")).toHaveCount(0)}
 await question.click();await expect(page.getByText("回合完成！")).toBeVisible();await expect(page.getByTestId("turn-result")).toHaveText("8 / 10");await expect(bar.locator("[data-outcome=abandoned]")).toHaveCount(2);await expect(bar).toHaveAttribute("aria-valuenow","10");await expect(page.getByTestId("word")).toHaveCount(0);
 await page.getByRole("button",{name:/准备好了/}).click();await expect(progress).toHaveText("0 / 10");await expect(question).toHaveCount(0);await expect(turn).toBeVisible();
 await correct.click();await correct.click();await expect(progress).toHaveText("2 / 10");
 await turn.click();await page.getByRole("button",{name:"继续答题"}).click();await expect(progress).toHaveText("2 / 10");
 await turn.click();await page.getByRole("button",{name:"确认放弃本回合"}).click();await expect(page.getByText("已放弃本回合")).toBeVisible();await expect(page.getByTestId("turn-result")).toHaveText("2 / 10");await expect(bar.locator("[data-outcome=pending]")).toHaveCount(8);
 await page.reload();await page.getByRole("button",{name:/继续游戏/}).click();await expect(page.getByText("已放弃本回合")).toBeVisible();await expect(page.getByTestId("turn-result")).toHaveText("2 / 10");
 await page.getByRole("button",{name:/准备好了/}).click();await expect(page.getByText("第 2 轮")).toBeVisible();await expect(progress).toHaveText("0 / 10");await expect(page.getByRole("button",{name:/换题 · 剩余 1/})).toBeVisible();
 await page.getByRole("button",{name:"结束",exact:true}).click();await page.getByRole("button",{name:"结束并查看结算"}).click();await expect(page.getByText("答对 8 · 换题 1 · 放弃 2 题")).toBeVisible();await expect(page.getByText("答对 2 · 换题 0 · 放弃 1 回合")).toBeVisible();
});
