import {test,expect} from "@playwright/test";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import type {AddressInfo} from "node:net";

test("installed app detects a new release, defers and restarts without losing game",async({page})=>{
 const root=resolve("dist"),latest=JSON.parse(await readFile(resolve(root,"version.json"),"utf8"));
 // An older version of the same shell served with a minimal real, active worker.
 // Once published, the server serves the unmodified production build and Workbox worker.
 const oldVersion="0.0.1";let published=false;
 const oldWorker='self.addEventListener("install",()=>self.skipWaiting());self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));';
 const server=createServer(async(req,res)=>{
  try{
   const url=new URL(req.url||"/","http://localhost");
   const rel=url.pathname.replace(/^\/charades\//,"")||"index.html";
   const file=resolve(root,rel);if(!file.startsWith(root+sep)){res.writeHead(404).end();return}
   const mime:Record<string,string>={".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json",".webmanifest":"application/manifest+json",".svg":"image/svg+xml",".png":"image/png"};
   res.setHeader("Content-Type",mime[extname(file)]||"application/octet-stream");res.setHeader("Cache-Control","no-store");
   if(!published&&rel==="sw.js"){res.end(oldWorker);return}
   if(!published&&rel==="version.json"){res.end(JSON.stringify({version:oldVersion,notes:[]}));return}
   const data=await readFile(file);
   if(!published&&/^assets\/index-.*\.js$/.test(rel)){res.end(data.toString().replaceAll(JSON.stringify(latest.version),JSON.stringify(oldVersion)));return}
   res.end(data)
  }catch{res.writeHead(404).end()}
 });
 await new Promise<void>(r=>server.listen(0,"127.0.0.1",r));
 try{
  const url="http://127.0.0.1:"+(server.address() as AddressInfo).port+"/charades/";
  await page.goto(url);await expect(page.getByTestId("app-version")).toHaveText("v"+oldVersion);
  await expect(page.getByText("3290 道题")).toBeVisible();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await page.getByRole("button",{name:/Solo 模式/}).click();
  await page.getByRole("button",{name:/开始游戏/}).click();
  await expect(page.getByTestId("word")).toBeVisible();
  const word=await page.getByTestId("word").textContent();
  published=true;
  await page.evaluate(()=>window.dispatchEvent(new Event("online")));
  await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.waiting);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button",{name:"暂停"}).click();
  const dialog=page.getByRole("dialog",{name:"发现新版本"});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("v"+oldVersion+" → v"+latest.version)).toBeVisible();
  await dialog.getByRole("button",{name:"稍后更新"}).click();await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId("app-version")).toHaveText("v"+oldVersion);
  await page.getByRole("button",{name:"新版本已就绪 · 更新"}).click();
  await dialog.getByRole("button",{name:"重启并更新"}).click();
  await expect(page.getByTestId("app-version")).toHaveText("v"+latest.version,{timeout:20000});
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button",{name:/继续游戏/}).click();await expect(page.getByTestId("word")).toHaveText(word||"");
 }finally{await page.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()))}
});
