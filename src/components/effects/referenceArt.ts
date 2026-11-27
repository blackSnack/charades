import type {ReferenceId} from "./referenceMaterials";

// Only the selected family is warmed. Keep decoded images across card mounts,
// share in-flight requests, and evict failures so the next attempt can retry.
const plates=new Map<string,Promise<HTMLImageElement>>();
export function loadReferencePlate(id:ReferenceId,level:number){
 const name=id+"-"+(level+1),cached=plates.get(name);if(cached)return cached;
 const image=new Image();image.decoding="async";
 const promise=new Promise<HTMLImageElement>((resolve,reject)=>{
  let done=false;
  const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);image.onload=null;image.onerror=null;if(ok)resolve(image);else reject(new Error("Card art unavailable: "+name))};
  const timer=window.setTimeout(()=>finish(false),8000);
  image.onerror=()=>finish(false);
  image.onload=()=>{if(typeof image.decode==="function"){void image.decode().then(()=>finish(true),()=>finish(false))}else finish(true)};
  image.src=import.meta.env.BASE_URL+"deck-art/v1/"+name+".webp";
 });
 plates.set(name,promise);
 void promise.catch(()=>{if(plates.get(name)===promise)plates.delete(name)});
 return promise;
}
export function preloadReferenceDeck(id:ReferenceId){
 return Promise.allSettled([0,1,2,3].map(level=>loadReferencePlate(id,level)));
}
