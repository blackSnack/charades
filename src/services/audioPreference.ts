export type AudioProfile={lounge:string;play:string;sfx:string;enabled:boolean;music:number;effects:number};
const key="party-deck-game-audio-v1";
const validId=(x:unknown):x is string=>typeof x==="string"&&/^ep(0[1-9]|1[0-2])$/.test(x);
export function loadAudio():AudioProfile|null{try{const p=JSON.parse(localStorage.getItem(key)||"null");if(p&&validId(p.lounge)&&validId(p.play)&&validId(p.sfx)&&typeof p.enabled==="boolean"&&typeof p.music==="number"&&typeof p.effects==="number"&&p.music>=0&&p.music<=1&&p.effects>=0&&p.effects<=1)return p}catch{}return null}
export function saveAudio(p:AudioProfile){try{localStorage.setItem(key,JSON.stringify(p));return true}catch{return false}}
