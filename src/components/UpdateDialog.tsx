import {useEffect,useRef} from "react";
import {RefreshCw} from "lucide-react";
import {Button} from "@/components/ui/button";
import {APP_VERSION,type ReleaseInfo} from "@/services/version";
export default function UpdateDialog({release,busy,error,onLater,onRestart}:{release:ReleaseInfo|null;busy:boolean;error:string;onLater:()=>void;onRestart:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;if(el&&!el.open)el.showModal();return()=>{if(el?.open)el.close()}},[]);
 return <dialog ref={ref} aria-labelledby="update-title" className="fixed inset-0 m-auto w-[min(90vw,420px)] max-h-[85dvh] overflow-y-auto rounded-2xl border-2 border-border bg-background p-5 text-foreground shadow-shadow backdrop:bg-black/50" onCancel={e=>{e.preventDefault();if(!busy)onLater()}}>
 <div className="grid gap-4"><div className="flex items-center gap-2"><RefreshCw size={24}/><h2 id="update-title" className="text-xl font-black">发现新版本</h2></div>
 <div className="rounded-base border-2 border-border bg-[#CCB8FF] p-3 font-bold">v{APP_VERSION} → {release?"v"+release.version:"新版本"}</div>
 <p className="text-sm">新版资源已准备完成。重启后将自动使用新版本，游戏进度和本地题库不会被清除。</p>
 {release?.notes.length?<ul className="list-disc space-y-1 pl-5 text-sm">{release.notes.map((note,i)=><li key={i}>{note}</li>)}</ul>:null}
 {error&&<p role="alert" className="error">{error}</p>}
 <Button size="lg" className="min-h-12 bg-[#80D9A8]" disabled={busy} onClick={onRestart}>{busy?"正在重启更新…":"重启并更新"}</Button>
 <Button variant="neutral" className="min-h-11" disabled={busy} onClick={onLater}>稍后更新</Button></div></dialog>
}
