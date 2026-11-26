import {test,expect} from "@playwright/test";
test("manual update feedback does not move the version row or home actions",async({page})=>{
 await page.goto("./");await expect(page.getByText("3290 道题")).toBeVisible();
 const footer=page.getByTestId("update-footer"),button=page.getByRole("button",{name:"检查更新",exact:true}),mode=page.getByRole("button",{name:/Solo 模式/});
 await footer.scrollIntoViewIfNeeded();
 const before=await Promise.all([footer.boundingBox(),button.boundingBox(),mode.boundingBox()]);
 await button.click();await expect(footer.getByRole("status")).toHaveText("已是最新版本");
 const after=await Promise.all([footer.boundingBox(),button.boundingBox(),mode.boundingBox()]);
 for(let i=0;i<before.length;i++){expect(before[i]).not.toBeNull();expect(after[i]).not.toBeNull();for(const key of ["x","y","width","height"] as const)expect(Math.abs(before[i]![key]-after[i]![key])).toBeLessThan(1)}
 const dimensions=await footer.evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width+1);
});
