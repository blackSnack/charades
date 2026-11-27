import fs from "node:fs";import {gzipSync} from "node:zlib";
const names=fs.readdirSync("dist/assets").filter(n=>/^(VfxLab|vfx-metal|vfx-foil)-.*\.(js|css)$/.test(n));
if(!names.some(n=>n.startsWith("VfxLab-"))||!names.some(n=>n.startsWith("vfx-metal-"))||!names.some(n=>n.startsWith("vfx-foil-")))throw Error("Missing isolated VFX chunks");
let raw=0,gzip=0;for(const n of names){const b=fs.readFileSync("dist/assets/"+n),z=gzipSync(b).length;raw+=b.length;gzip+=z;console.log(n,b.length+" B raw",z+" B gzip")}
console.log("VFX lazy chunks total:",raw+" B raw",gzip+" B gzip");if(raw>160*1024||gzip>50*1024)throw Error("VFX size budget exceeded");
const sw=fs.readFileSync("dist/sw.js","utf8");for(const n of names)if(sw.includes('"assets/'+n+'"')||sw.includes('"'+n+'"'))throw Error("VFX chunk precached: "+n);

const html=fs.readFileSync("dist/index.html","utf8");for(const n of names)if(html.includes(n))throw Error("Experimental asset eagerly linked from index.html: "+n);

const art=JSON.parse(fs.readFileSync("dist/deck-art/v1/manifest.json","utf8"));
if(Object.keys(art).length!==16)throw Error("Missing sixteen art plates");
let artBytes=0;for(const [id,v] of Object.entries(art)){
 for(const suffix of [".webp","-map.webp"]){const name=id+suffix,b=fs.statSync("dist/deck-art/v1/"+name).size;artBytes+=b;if(sw.includes('"deck-art/v1/'+name+'"')||html.includes(name))throw Error("Eager art asset: "+name)}
 if(v.platePixelAgreementOutsideWord<.95)throw Error("Art preservation regression: "+id)
}
if(artBytes>2*1024*1024)throw Error("Art asset budget exceeded");
console.log("Lazy art plates/maps total: "+artBytes+" B, source comparison recorded in manifest.json");
