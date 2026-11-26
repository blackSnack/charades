import type {CSSProperties} from "react";
export default function QuestionWord({word,testId="word"}:{word:string;testId?:string}){
 const count=Math.max(1,[...word].length);
 const columns=count<=4?count:Math.min(6,Math.ceil(count/2));
 const rows=Math.ceil(count/columns);
 return <strong className="question-word-text" data-testid={testId} style={{"--word-cols":columns,"--word-rows":rows} as CSSProperties}>{word}</strong>
}
