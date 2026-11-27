import {test,expect} from "@playwright/test";
test("unified lab offers audio candidates, local review and real playback",async({page})=>{
 await page.goto("./");await page.getByRole("button",{name:"实验室",exact:true}).click();
 await expect(page.getByRole("button",{name:/卡牌实验/})).toBeVisible();
 await page.getByRole("button",{name:/音频实验/}).click();
 await page.getByLabel("卡组主题").selectOption("all");await expect(page.getByTestId("audio-ep")).toHaveCount(12);
 await page.getByLabel("卡组主题").selectOption("original");await expect(page.getByTestId("audio-ep")).toHaveCount(3);
 await page.getByRole("button",{name:"午后微风 试听"}).click();
 await expect(page.getByRole("status").filter({hasText:"正在试听：午后微风"})).toBeVisible({timeout:20000});
 await page.getByRole("button",{name:"停止",exact:true}).click();await expect(page.getByRole("button",{name:"午后微风 试听"})).toBeVisible();
 await page.getByTestId("audio-ep").first().getByRole("button",{name:"选为此主题候选"}).click();
 await page.getByTestId("audio-ep").first().getByLabel("试听反馈").fill("温暖");
 await page.getByRole("button",{name:"游戏音乐",exact:true}).click();await expect(page.getByText("112 BPM",{exact:false})).toBeVisible();
 await page.getByRole("button",{name:"音效",exact:true}).click();await page.getByRole("button",{name:"午后微风 答对"}).click();
 await page.getByRole("button",{name:"返回实验室"}).click();await expect(page.getByRole("heading",{name:"实验室"})).toBeVisible();
 await page.getByRole("button",{name:/音频实验/}).click();await expect(page.getByTestId("audio-ep").first().getByRole("button",{name:"已选为此主题候选"})).toBeVisible();await expect(page.getByTestId("audio-ep").first().getByLabel("试听反馈")).toHaveValue("温暖");
});
