import {useLayoutEffect,useRef,type CSSProperties} from "react";

export default function QuestionWord({word,testId="word"}:{word:string;testId?:string}){
 const ref=useRef<HTMLElement>(null);
 const count=Math.max(1,[...word].length);
 const columns=count<=4?count:Math.min(6,Math.ceil(count/2));
 const rows=Math.ceil(count/columns);
 // Measure the actual untransformed content area. A flip/translate animation
 // must not change the font size, and a cached container-query size must not
 // carry over from portrait to landscape.
 useLayoutEffect(()=>{
  const text=ref.current,zone=text?.parentElement;
  if(!text||!zone)return;
  const fit=()=>{
   const width=zone.clientWidth,height=zone.clientHeight;
   if(!width||!height)return;
   const size=Math.max(16,Math.min(160,.96*width/columns,.94*height/(rows*1.14)));
   text.style.setProperty("--word-fit-size",size+"px");
  };
  let live=true;
  const refresh=()=>{if(live)fit()};
  fit();
  // The parent shell changes from setup/home to playing in the same commit.
  // Child layout effects can see the previous ancestor width. Refit after
  // the complete commit and immediately before the first painted frame.
  queueMicrotask(refresh);
  const frame=requestAnimationFrame(refresh);
  const observer=new ResizeObserver(refresh);
  observer.observe(zone);
  return()=>{live=false;cancelAnimationFrame(frame);observer.disconnect()};
 },[word,columns,rows]);
 return <strong ref={ref} className="question-word-text" data-testid={testId} style={{"--word-cols":columns,"--word-rows":rows} as CSSProperties}>{word}</strong>
}
