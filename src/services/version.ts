declare const __APP_VERSION__:string;
export const APP_VERSION=__APP_VERSION__;
export type ReleaseInfo={version:string;notes:string[]};
export function newerVersion(remote:string,local:string):boolean{
 if(!/^\d+\.\d+\.\d+$/.test(remote)||!/^\d+\.\d+\.\d+$/.test(local))return false;
 const a=remote.split(".").map(Number),b=local.split(".").map(Number);
 for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return false
}
export function parseRelease(value:unknown):ReleaseInfo|null{
 if(!value||typeof value!=="object")return null;
 const x=value as Record<string,unknown>;
 if(typeof x.version!=="string"||!/^\d+\.\d+\.\d+$/.test(x.version)||!Array.isArray(x.notes)||x.notes.some(n=>typeof n!=="string"))return null;
 return {version:x.version,notes:x.notes.slice(0,8) as string[]}
}
export async function fetchRelease(signal:AbortSignal):Promise<ReleaseInfo|null>{
 const r=await fetch(import.meta.env.BASE_URL+"version.json",{cache:"no-store",signal,headers:{Accept:"application/json"}});
 if(!r.ok)return null;return parseRelease(await r.json())
}
