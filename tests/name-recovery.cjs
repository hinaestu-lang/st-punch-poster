const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const st={savedRecord:{messageId:0,text:'选中文字',roleName:'角色',sourceChat:''}};
const c={name1:'原用户',getCurrentChatId:()=> 'chat-id',chat:[{name:'角色',mes:'原文选中文字结束'}]};
const api=vm.runInNewContext(s.slice(s.indexOf('function names()'),s.indexOf('// 本地繁简'))+';names',{st,ctx:()=>c,snippetRoleOf:r=>({name:r.roleName}),normalize:x=>x});
assert.equal(api().user,'原用户');c.chat[0].mes='其他文字';assert.equal(api().user,'');st.savedRecord.sourceChat='chat-id';assert.equal(api().user,'原用户');
console.log('Passed API chat identity and verified legacy source-message recovery');
