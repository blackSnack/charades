import {test,expect} from "@playwright/test";
test("ten correct answers, exhausted skips and abandon handoff with restored score",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();await page.getByRole("button",{name:/多人模式/}).click();
 await page.getByRole("button",{name:"2",exact:true}).click();
 await page.getByRole("button",{name:"10题",exact:true}).click();await page.getByRole("button",{name:"1次",exact:true}).click();
 await expect(page.getByText("2 人 · 每轮共 20 题")).toBeVisible();
 await page.getByRole("button",{name:/下一步/}).click();await page.getByRole("button",{name:/开始游戏/}).click();
 await page.getByRole("button",{name:/准备好了/}).click();
 const progress=page.getByTestId("turn-progress"),bar=page.getByRole("progressbar"),correct=page.getByRole("button",{name:"答对！",exact:true}),abandon=page.getByRole("button",{name:"放弃",exact:true});
 await expect(progress).toHaveText("0 / 10");await expect(abandon).toHaveCount(0);
 await page.getByRole("button",{name:/换题 · 剩余 1/}).click();
 await expect(progress).toHaveText("0 / 10");await expect(abandon).toBeVisible();
 for(let i=1;i<=9;i++){await correct.click();await expect(progress).toHaveText(i+" / 10");await expect(bar).toHaveAttribute("aria-valuenow",String(i));await expect(page.getByTestId("word")).toBeVisible();await expect(page.getByText("回合完成！")).toHaveCount(0)}
 await correct.click();await expect(page.getByText("回合完成！")).toBeVisible();await expect(page.getByTestId("turn-result")).toHaveText("10 / 10");await expect(page.getByTestId("word")).toHaveCount(0);
 await page.getByRole("button",{name:/准备好了/}).click();await expect(progress).toHaveText("0 / 10");await expect(abandon).toHaveCount(0);
 await correct.click();await correct.click();await expect(progress).toHaveText("2 / 10");
 await page.getByRole("button",{name:/换题 · 剩余 1/}).click();await expect(abandon).toBeVisible();
 await abandon.click();await page.getByRole("button",{name:"继续答题"}).click();await expect(progress).toHaveText("2 / 10");
 await abandon.click();await page.getByRole("button",{name:"确认放弃"}).click();await expect(page.getByText("已放弃本回合")).toBeVisible();await expect(page.getByTestId("turn-result")).toHaveText("2 / 10");await expect(page.getByTestId("word")).toHaveCount(0);
 await page.reload();await page.getByRole("button",{name:/继续游戏/}).click();await expect(page.getByText("已放弃本回合")).toBeVisible();await expect(page.getByTestId("turn-result")).toHaveText("2 / 10");
 await page.getByRole("button",{name:/准备好了/}).click();await expect(page.getByText("第 2 轮")).toBeVisible();await expect(progress).toHaveText("0 / 10");await expect(page.getByRole("button",{name:/换题 · 剩余 1/})).toBeVisible();
 await page.getByRole("button",{name:"结束",exact:true}).click();await page.getByRole("button",{name:"结束并查看结算"}).click();await expect(page.getByText("答对 2 · 换题 1 · 放弃 1 回合")).toBeVisible();
});
