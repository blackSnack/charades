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
  fit();
  const observer=new ResizeObserver(fit);
  observer.observe(zone);
  return()=>observer.disconnect();
 },[word,columns,rows]);
 return <strong ref={ref} className="question-word-text" data-testid={testId} style={{"--word-cols":columns,"--word-rows":rows} as CSSProperties}>{word}</strong>
}
