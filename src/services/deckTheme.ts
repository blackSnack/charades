export const deckThemes=[{id:"original",name:"经典桌游",description:"原版黄色纸卡"},{id:"warm",name:"暖色收藏卡",description:"香槟、琥珀、黑金箔"},{id:"metal",name:"暖金液态金属",description:"动态金属轮廓"},{id:"balatro",name:"纸箔幻彩",description:"纸质 · 银箔 · 全息 · 负焰"},{id:"gwent",name:"古典工艺",description:"羊皮纸 · 银钢 · 纹章"},{id:"infernal",name:"熔铁余烬",description:"铜铁 · 热裂纹"},{id:"occult",name:"木刻秘仪",description:"旧纸 · 木刻 · 烛光"}] as const;
export type DeckThemeId=typeof deckThemes[number]["id"];
export type DeckQuality="off"|"low"|"high";
export type DeckPreference={theme:DeckThemeId;quality:DeckQuality;favorites:DeckThemeId[]};
const key="party-deck-theme-v1";
export function loadDeck():DeckPreference{try{const p=JSON.parse(localStorage.getItem(key)||"null");if(p&&["off","low","high"].includes(p.quality))return {theme:deckThemes.some(t=>t.id===p.theme)?p.theme:"original",quality:p.quality,favorites:Array.isArray(p.favorites)?p.favorites.filter((id:unknown)=>deckThemes.some(t=>t.id===id)):[]}}catch{}return {theme:"original",quality:"high",favorites:[]}}
export function saveDeck(p:DeckPreference){try{localStorage.setItem(key,JSON.stringify(p));return true}catch{return false}}
