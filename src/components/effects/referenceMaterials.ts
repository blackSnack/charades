import type {DeckThemeId} from "@/services/deckTheme";
export const referenceIds=["balatro","gwent","infernal","occult"] as const;
export type ReferenceId=typeof referenceIds[number];
export function isReference(id:DeckThemeId):id is ReferenceId{return referenceIds.some(x=>x===id)}
// Colors sampled by visual inspection of the four approved comparison boards.
// Every row is an independent material, not merely a different glow intensity.
export type Material={paper:string;shade:string;ink:string;rim:string;mid:string;light:string;accent:string;label:string;edge:number;mode:number;particles:number;name:string};
type Entry=[string,string,string,string,string,string,string,string,number,number,number,string];
const rows:Record<ReferenceId,Entry[]>={
 balatro:[
 ["#eee1ce","#d4bda4","#2f2927","#a18773","#d5bc9e","#f8ebd9","#89624f","#946c53",5,0,0,"温润纸质"],
 ["#d4cdcd","#a5a6ad","#24282d","#6c737f","#a6acb8","#f4f3ef","#79818f","#555d6b",7,1,0,"雅致银箔"],
 ["#d9d3df","#b6b0ce","#292633","#8a849e","#b8b2d8","#f7eee8","#9a8eb8","#675873",8,2,0,"低饱和全息"],
 ["#a99b9d","#352a31","#211a1d","#362329","#774442","#bc8271","#a04e44","#68332d",9,3,6,"负焰深色"]],
 gwent:[
 ["#e8d6b5","#c6ae88","#32251a","#80694f","#c4a982","#f3e1bd","#9b8055","#b49a72",5,0,0,"基础羊皮纸"],
 ["#e4d1ad","#bca681","#30271f","#474744","#888987","#c9c7bc","#9a8b6f","#6c604c",10,1,0,"标准银钢"],
 ["#e7d7b6","#c0a986","#2b231a","#41454c","#89919b","#e0c58c","#ba9b57","#3d5267",13,4,0,"精制银金"],
 ["#ddc6a1","#b89a75","#302016","#38291e","#8c673c","#dfbe7c","#ba9255","#692b2b",16,4,3,"大师古金"]],
 infernal:[
 ["#ecd3ab","#c9a67c","#35271d","#78513c","#a67c54","#e8bb87","#a4784b","#675045",9,0,0,"旧铜铁路"],
 ["#e9cda6","#c4a17d","#35251e","#383234","#645756","#aa8980","#a16b4b","#523932",12,5,4,"烟熏铁"],
 ["#ebd1ac","#c19a70","#34241a","#4a3028","#92704b","#d8aa6b","#a95b3f","#732b2c",14,5,8,"暗铜红钢"],
 ["#edcfab","#c29b76","#2f211b","#29262a","#574447","#9c7770","#d26d43","#612720",16,6,14,"焦铁熔裂"]],
 occult:[
 ["#e5cda4","#b69a72","#34271c","#71553b","#ab8559","#edcda0","#6f5138","#b69a70",6,0,0,"林中纸札"],
 ["#e1c59a","#af8c61","#38271b","#60432e","#92704c","#e2c99e","#b7a079","#c7a576",12,7,0,"旧纸骨饰"],
 ["#dfbb90","#b3865e","#34241a","#3e291e","#775036","#b18b5c","#9c713f","#9a6d44",14,7,4,"黑木符文"],
 ["#d7af83","#ad805b","#32231a","#2c1e19","#684338","#c5ae89","#9a4034","#792e28",16,8,7,"古木仪式"]]
};
export function material(id:ReferenceId,level:number):Material{
 const [paper,shade,ink,rim,mid,light,accent,label,edge,mode,particles,name]=rows[id][level];
 return {paper,shade,ink,rim,mid,light,accent,label,edge,mode,particles,name};
}
