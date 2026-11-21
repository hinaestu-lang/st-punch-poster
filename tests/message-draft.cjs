const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const chat=[{mes:'a'},{mes:'b'}],st={},cur={pubTitle:'',pubAuthor:'',threadsReplyTime:'1天',postypeAvatarImg:''};let saves=0;
const BASE={pubTitle:'',pubAuthor:'',threadsReplyTime:'1天',postypeAvatarImg:''};
const c={chat,saveChat(){saves++;}};
const api=vm.runInNewContext(s.slice(s.indexOf('function beginMessageDraft('),s.indexOf('// 操作历史'))+';({beginMessageDraft,saveMessageDraft})',
  {st,ctx:()=>c,store:()=>({cur}),BASE,FRESH_POST_FIELDS:Object.keys(BASE),clone:x=>x,persist(){},snippetStore:()=>[]});
api.beginMessageDraft(0);cur.pubTitle='标题A';cur.postypeAvatarImg='data:x';
api.beginMessageDraft(1);
assert.equal(JSON.stringify(chat[0].extra.punchPoster),'{"pubTitle":"标题A"}');assert.equal(cur.pubTitle,'');assert.equal(saves,1);
api.saveMessageDraft();assert.equal(chat[1].extra,undefined);assert.equal(saves,1);
api.beginMessageDraft(0);assert.equal(cur.pubTitle,'标题A');assert.equal(cur.postypeAvatarImg,'');
console.log('Passed per-message text drafts');
{
  // 绑定在聊天上：同一个聊天里换消息，文字沿用
  const chat=[{mes:'a'},{mes:'b'}],st={},meta={},cur={pubTitle:'',postypeAvatarImg:''};let metaSaves=0;
  const BASE={pubTitle:'',postypeAvatarImg:''};
  const c={chat,chatMetadata:meta,saveMetadata(){metaSaves++;}};
  const api=vm.runInNewContext(s.slice(s.indexOf('function beginMessageDraft('),s.indexOf('// 操作历史'))+';({beginMessageDraft,saveMessageDraft})',
    {st,ctx:()=>c,store:()=>({cur}),BASE,FRESH_POST_FIELDS:Object.keys(BASE),clone:x=>x,persist(){},snippetStore:()=>[]});
  api.beginMessageDraft(0,'chat');cur.pubTitle='同一个故事';cur.postypeAvatarImg='data:x';
  api.beginMessageDraft(1,'chat');
  assert.equal(cur.pubTitle,'同一个故事');assert.equal(cur.postypeAvatarImg,'');assert.equal(meta.punchPoster.pubTitle,'同一个故事');assert.equal(metaSaves,1);
  console.log('Passed per-chat text drafts');
}
