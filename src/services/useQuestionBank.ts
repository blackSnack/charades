import {useCallback,useEffect,useRef,useState} from "react";
import type {Bank} from "@/core/game";
import {cachedBank,updateBank} from "./bank";
type Notice={message:string};
export function useQuestionBank(){
 const [bank,setBank]=useState<Bank>(),[loading,setLoading]=useState(true),[issue,setIssue]=useState(false),[notice,setNotice]=useState<Notice|null>(null);
 const latest=useRef<Bank|undefined>(undefined),running=useRef(false),active=useRef(false),reported=useRef(false),request=useRef<AbortController|null>(null);
 const refresh=useCallback(async(manual=false)=>{
  if(running.current||!active.current)return;
  running.current=true;setLoading(true);
  const controller=new AbortController();request.current=controller;const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
   latest.current=latest.current??await cachedBank();
   if(!active.current)return;
   if(latest.current)setBank(latest.current);
   if(latest.current&&!navigator.onLine){setIssue(false);return}
   latest.current=await updateBank(latest.current,controller.signal);
   if(active.current){setBank(latest.current);setIssue(false);setNotice(null);reported.current=false}
  }catch(error){
   if(!active.current)return;
   const cached=!!latest.current;setIssue(!cached);
   if((!cached||navigator.onLine)&&(manual||!reported.current)){
    reported.current=true;
    setNotice({message:cached?"暂时无法连接或校验在线题库，已使用本地题库，可正常游戏。":"暂无可用题库，请联网后重试。"});
    console.warn("Question bank refresh failed:",error instanceof Error?error.message:String(error));
   }
  }finally{window.clearTimeout(timeout);request.current=null;running.current=false;if(active.current)setLoading(false)}
 },[]);
 useEffect(()=>{active.current=true;void refresh();const wake=()=>{if(!document.hidden)void refresh()};window.addEventListener("online",wake);document.addEventListener("visibilitychange",wake);
 return()=>{active.current=false;request.current?.abort();window.removeEventListener("online",wake);document.removeEventListener("visibilitychange",wake)}},[refresh]);
 return {bank,loading,issue,notice,dismiss:()=>setNotice(null),retry:()=>void refresh(true)};
}
