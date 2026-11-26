import {useCallback,useEffect,useRef,useState} from "react";
import {useRegisterSW} from "virtual:pwa-register/react";
import {APP_VERSION,fetchRelease,newerVersion,type ReleaseInfo} from "./version";
export function useAppUpdate(){
 const [registration,setRegistration]=useState<ServiceWorkerRegistration>(),[release,setRelease]=useState<ReleaseInfo|null>(null);
 const [dismissed,setDismissed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[checking,setChecking]=useState(false),[message,setMessage]=useState("");
 const running=useRef(false),manualRequested=useRef(false),timer=useRef<number|undefined>(undefined),detach=useRef<(()=>void)|null>(null),mounted=useRef(true);
 const {needRefresh:[needRefresh]}=useRegisterSW({onRegisteredSW:(_url,r)=>{if(r)setRegistration(r)}});
 const check=useCallback(async(manual=false)=>{
  if(manual){manualRequested.current=true;setChecking(true);setMessage("")}
  if(running.current||(!manual&&document.hidden))return;
  running.current=true;
  const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),8000);
  try{
   const latest=await fetchRelease(controller.signal);
   if(latest&&newerVersion(latest.version,APP_VERSION))setRelease(latest);
   if(registration&&!registration.installing&&!registration.waiting)await registration.update();
   if(manualRequested.current)setMessage(latest?newerVersion(latest.version,APP_VERSION)?"新版准备中…":"已是最新版本":"无法获取版本")
  }catch{if(manualRequested.current)setMessage("检查失败，请重试")}
  finally{clearTimeout(timeout);running.current=false;manualRequested.current=false;if(mounted.current)setChecking(false)}
 },[registration]);
 useEffect(()=>{mounted.current=true;const wake=()=>{if(!document.hidden)void check()};wake();const interval=window.setInterval(wake,60000);
 window.addEventListener("online",wake);window.addEventListener("focus",wake);document.addEventListener("visibilitychange",wake);
 return()=>{window.clearInterval(interval);window.removeEventListener("online",wake);window.removeEventListener("focus",wake);document.removeEventListener("visibilitychange",wake)}},[check]);
 useEffect(()=>()=>{mounted.current=false;clearTimeout(timer.current);detach.current?.()},[]);
 useEffect(()=>{if(needRefresh)setDismissed(false)},[needRefresh,release?.version]);
 const restart=async(persist:()=>boolean)=>{
  if(busy)return;setError("");
  if(!persist()){setError("无法保存当前进度，请稍后重试。");return}
  if(!needRefresh){setError("新版尚未准备完成，请稍后重试。");return}
  const sw=navigator.serviceWorker;
  const reg=registration??await sw.getRegistration();
  const waiting=reg?.waiting;
  if(!waiting){setError("新版尚未准备完成，请重新检查更新。");return}
  const previous=sw.controller;
  setBusy(true);
  // Register before sending the activation request. Do not rely on Workbox's
  // window-side classification of an update as internal/external.
  let finished=false;
  const cleanup=()=>{clearTimeout(timer.current);sw.removeEventListener("controllerchange",controlled);detach.current=null};
  const controlled=()=>{if(finished||!sw.controller||sw.controller===previous)return;finished=true;cleanup();window.location.reload()};
  detach.current?.();detach.current=cleanup;
  sw.addEventListener("controllerchange",controlled);
  timer.current=window.setTimeout(()=>{if(finished)return;finished=true;cleanup();setBusy(false);setError("更新尚未完成，请再次尝试。")},15000);
  try{waiting.postMessage({type:"SKIP_WAITING"});controlled()}catch{finished=true;cleanup();setBusy(false);setError("更新失败，请联网后重试。")}
 };
 return {ready:needRefresh,release,dismissed,busy,error,checking,message,check:()=>void check(true),later:()=>setDismissed(true),open:()=>setDismissed(false),restart};
}
