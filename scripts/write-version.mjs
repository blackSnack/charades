import fs from "node:fs";
const pkg=JSON.parse(fs.readFileSync("package.json","utf8")),release=JSON.parse(fs.readFileSync("release-notes.json","utf8"));
if(!/^\d+\.\d+\.\d+$/.test(pkg.version)||release.version!==pkg.version||!Array.isArray(release.notes)||!release.notes.length||release.notes.some(n=>typeof n!=="string"||!n.trim()))throw Error("Version and release notes must match");
fs.writeFileSync("dist/version.json",JSON.stringify(release)+"\n");
console.log("Release metadata:",release.version);
