const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const rec={id:'saved',text:'一段\n\n二段',roleName:'收藏角色',avatar:'/characters/saved.png'};
let opened;const chosen=new Set(['saved']);
const api=vm.runInNewContext(s.slice(s.indexOf('function snippetBeautifyChosen('),s.indexOf('function snippetRenderLibrary('))+';snippetBeautifyChosen',{
snippetStore:()=>[rec],snippetChosen:chosen,normalizeParagraphs:x=>x,closeSnippetBox(){},openById:(...args)=>opened=args
});
api();assert.equal(opened[0],null);assert.equal(opened[1],rec.text);assert.equal(opened[2],rec);
const begin=s.slice(s.indexOf('function openById('),s.indexOf('// 句子拾取匣'));
assert(begin.includes("st.savedRecord=savedRecord"));assert(begin.includes("else if (!loadMessage"));
console.log('Passed saved favorite entry without chat lookup, full text and identity forwarding');
