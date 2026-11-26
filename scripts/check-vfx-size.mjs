import fs from "node:fs";import {gzipSync} from "node:zlib";
const names=fs.readdirSync("dist/assets").filter(n=>/^(VfxLab|vfx-particles)-.*\.(js|css)$/.test(n));
if(!names.some(n=>n.startsWith("VfxLab-"))||!names.some(n=>n.startsWith("vfx-particles-")))throw Error("Missing isolated VFX chunks");
let raw=0,gzip=0;for(const n of names){const b=fs.readFileSync("dist/assets/"+n),z=gzipSync(b).length;raw+=b.length;gzip+=z;console.log(n,b.length+" B raw",z+" B gzip")}
console.log("VFX lazy chunks total:",raw+" B raw",gzip+" B gzip");if(raw>160*1024||gzip>50*1024)throw Error("VFX size budget exceeded");
const sw=fs.readFileSync("dist/sw.js","utf8");for(const n of names)if(sw.includes('"assets/'+n+'"')||sw.includes('"'+n+'"'))throw Error("VFX chunk precached: "+n);
