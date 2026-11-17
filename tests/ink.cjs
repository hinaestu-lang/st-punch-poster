const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const fn=vm.runInNewContext(s.slice(s.indexOf('function sharedCopy('),s.indexOf('function sigLines('))+';sharedCopy',{names:()=>({user:'',char:'角色'}),Date});
assert.equal(fn({}).title,'');assert.equal(fn({pubTitle:'手填标题'}).title,'手填标题');
const block=s.slice(s.indexOf('    const makeBubble='),s.indexOf('    const appendRows=',s.indexOf('    const makeBubble=')));
const make=vm.runInNewContext(block+';makeBubble',{document:{createElement:()=>({style:{values:{},setProperty(k,v){this.values[k]=v;}},appendChild(node){this.child=node;}})}});
for(const side of ['in','out']){const row=make('文字',side);assert.equal(row.child.style.values.color,'#ffffff');assert.equal(row.child.style.values['-webkit-text-fill-color'],'#ffffff');}
console.log('Passed empty-title fallback and incoming/outgoing bubble text fill');

const st={savedRecord:{sourceChat:'original',roleName:'角色'}},context={chatId:'original',name1:'原聊天用户'};
const names=vm.runInNewContext(s.slice(s.indexOf('function names()'),s.indexOf('// 本地繁简'))+';names',{st,ctx:()=>context,snippetRoleOf:r=>({name:r.roleName})});
assert.equal(names().user,'原聊天用户');context.chatId='another';assert.equal(names().user,'');st.savedRecord.userName='已存姓名';assert.equal(names().user,'已存姓名');
console.log('Passed original-chat name recovery without cross-chat fallback');
