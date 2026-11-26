import fs from "node:fs";
const root="public/question-bank/";
const m=JSON.parse(fs.readFileSync(root+"manifest.json","utf8"));
const ids=new Set(),words=new Set();
for(const c of m.categories){const rows=JSON.parse(fs.readFileSync(root+c.file,"utf8"));if(rows.length!==c.count)throw Error(c.id+" count mismatch");for(const q of rows){if(q.catId!==c.id||!q.word||q.len!==[...q.word].length||!Number.isInteger(q.level)||q.level<1||q.level>4||ids.has(q.id)||words.has(q.word.normalize("NFKC")))throw Error("Invalid question: "+q.id);ids.add(q.id);words.add(q.word.normalize("NFKC"))}}
console.log(ids.size+" unique questions, "+m.categories.length+" categories");
