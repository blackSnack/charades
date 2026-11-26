export const deckThemes=[{id:"original",name:"经典桌游",description:"原版黄色纸卡"},{id:"warm",name:"暖色收藏卡",description:"香槟、琥珀、黑金箔"},{id:"classic",name:"元素卡 · 经典",description:"流光、SVG 与 Canvas 粒子"},{id:"gpu",name:"元素卡 · WebGL",description:"雷电与火焰增强"}] as const;
export type DeckThemeId=typeof deckThemes[number]["id"];
export type DeckQuality="off"|"low"|"high";
export type DeckPreference={theme:DeckThemeId;quality:DeckQuality;favorites:DeckThemeId[]};
const key="party-deck-theme-v1";
export function loadDeck():DeckPreference{try{const p=JSON.parse(localStorage.getItem(key)||"null");if(p&&deckThemes.some(t=>t.id===p.theme)&&["off","low","high"].includes(p.quality))return {theme:p.theme,quality:p.quality,favorites:Array.isArray(p.favorites)?p.favorites.filter((id:unknown)=>deckThemes.some(t=>t.id===id)):[]}}catch{}return {theme:"original",quality:"high",favorites:[]}}
export function saveDeck(p:DeckPreference){try{localStorage.setItem(key,JSON.stringify(p));return true}catch{return false}}
