const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const state={postypeAvatarMode:'custom',threadsReplyAvatarMode:'user',imessageAvatarMode:'custom',postypeAvatarImg:'old'};
const chat=[],st={};let saves=0;
const api=vm.runInNewContext(s.slice(s.indexOf('function beginMessageDraft('),s.indexOf('// 操作历史'))+';beginMessageDraft',{st,ctx:()=>({chat}),store:()=>({cur:state}),BASE:{postypeAvatarMode:'char',threadsReplyAvatarMode:'initial',imessageAvatarMode:'system'},FRESH_POST_FIELDS:['postypeAvatarImg'],clone:x=>x,persist:()=>saves++});
api(1);assert.equal(state.postypeAvatarMode,'char');assert.equal(state.imessageAvatarMode,'system');assert.equal(state.threadsReplyAvatarMode,'user');assert.equal(state.postypeAvatarImg,'');
api(1);assert.equal(saves,1);
console.log('Passed new-message avatar reset and same-message preservation');
