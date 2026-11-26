import type {Config,Game} from "@/core/game";
const key="party-deck-react-v1";
export function load():{cfg:Config;game:Game|null}|null{try{const s=JSON.parse(localStorage.getItem(key)||"null");return s?.schema===1?s:null}catch{return null}}
export function save(cfg:Config,game:Game|null){try{localStorage.setItem(key,JSON.stringify({schema:1,cfg,game}));return true}catch{return false}}
