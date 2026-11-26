import { get,set } from "idb-keyval";
import type {Bank,Category,Question} from "@/core/game";
const base=import.meta.env.BASE_URL+"question-bank/";
const key="party-deck-bank-v1";
export async function cachedBank(){try{return await get<Bank>(key)}catch{return undefined}}
export async function updateBank(current?:Bank):Promise<Bank>{
 const res=await fetch(base+"manifest.json",{cache:"no-store"});if(!res.ok)throw Error("题库索引下载失败");
 const m=await res.json() as {schemaVersion:number;bankVersion:string;categories:Category[]};
 if(m.schemaVersion!==1||!m.bankVersion||!Array.isArray(m.categories)||!m.categories.length)throw Error("题库索引无效");
 if(current?.version===m.bankVersion)return current;
 const parts=await Promise.all(m.categories.map(async c=>{
 if(!/^categories\/[a-z0-9-]+\.json$/.test(c.file))throw Error("非法题库路径");
 const r=await fetch(base+c.file+"?v="+encodeURIComponent(m.bankVersion),{cache:"no-store"});if(!r.ok)throw Error("题库下载失败");
 const data=await r.json() as Question[];
 if(!Array.isArray(data)||data.length!==c.count||data.some(x=>x.catId!==c.id||!x.id||!x.word||x.len!==[...x.word].length||!Number.isInteger(x.level)||x.level<1||x.level>4))throw Error("题库校验失败");
 return data
 }));
 const items=parts.flat();if(new Set(items.map(x=>x.id)).size!==items.length||new Set(items.map(x=>x.word.normalize("NFKC"))).size!==items.length)throw Error("题库重复");
 const bank={version:m.bankVersion,categories:m.categories,items};
 try{await set(key,bank)}catch{/* game can still run online */}
 return bank
}
