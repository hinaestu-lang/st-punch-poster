const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const parse=vm.runInNewContext(s.slice(s.indexOf('function bubbleBilingual('),s.indexOf('function cssFillTemplate('))+';bubbleBilingual');
for(const text of ['“안녕。”（你好。）','Hello (你好)','こんにちは（你好）'])assert(parse(text));
for(const text of ['只有中文（旁白）','Hello world','안녕하세요','user抱着枕头（哭）'])assert.equal(parse(text),null);
assert.equal(parse('안녕（你好）').translation,'你好');
console.log('Passed bilingual and monolingual bubble fixtures');
