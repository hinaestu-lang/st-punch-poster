const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
{
  // 绑定在收藏上：别的聊天收藏来的句子各记各的
  const st={},cur={pubTitle:'',postypeAvatarImg:''},records=[{id:'r1'},{id:'r2'}];let saves=0;
  const BASE={pubTitle:'',postypeAvatarImg:''};
  const api=vm.runInNewContext(s.slice(s.indexOf('function beginMessageDraft('),s.indexOf('// 操作历史'))+';({beginMessageDraft,saveMessageDraft})',
    {st,ctx:()=>({chat:[]}),store:()=>({cur}),BASE,FRESH_POST_FIELDS:Object.keys(BASE),clone:x=>x,persist(){saves++;},snippetStore:()=>records});
  api.beginMessageDraft('saved:r1','saved:r1');cur.pubTitle='标题A';cur.postypeAvatarImg='data:x';
  api.beginMessageDraft('saved:r2','saved:r2');
  assert.equal(records[0].punchPoster.pubTitle,'标题A');assert.equal(cur.pubTitle,'');
  api.beginMessageDraft('saved:r1','saved:r1');assert.equal(cur.pubTitle,'标题A');assert.equal(cur.postypeAvatarImg,'');
  assert.equal(records[1].punchPoster,undefined);
  console.log('Passed per-favorite text drafts');
}
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
