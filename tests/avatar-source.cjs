const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const st={savedRecord:{roleName:'收藏角色',avatar:''}};
const context={characters:[{name:'收藏角色',avatar:'saved.png'},{name:'当前角色',avatar:'other.png'}],characterId:1,name2:'当前角色',chat:[]};
const source=s.slice(s.indexOf('function postypeAvatarSrc('),s.indexOf('function render(preview)'));
const api=vm.runInNewContext(source+';postypeAvatarSrc',{st,ctx:()=>context,snippetRoleOf:r=>({name:r.roleName,key:r.roleKey||'char:'+r.roleName}),document:{querySelectorAll:()=>[]}});
assert.equal(api({}),'/characters/saved.png');
st.savedRecord.avatar='/stale.png';assert.equal(api({}),'/characters/saved.png');
st.savedRecord=null;assert.equal(api({}),'/characters/other.png');
assert.equal(api({postypeAvatarMode:'custom',postypeAvatarImg:'/custom.png'}),'/custom.png');
context.characters.push({name:'收藏角色',avatar:'duplicate.png'});st.savedRecord={roleName:'收藏角色',avatar:''};assert.equal(api({}),'');st.savedRecord.avatar='/characters/duplicate.png';assert.equal(api({}),'/characters/duplicate.png');
st.savedRecord={roleName:'当前角色',roleKey:'user:当前角色',avatar:'/User%20Avatars/persona.png'};assert.equal(api({}),'/User%20Avatars/persona.png');
st.savedRecord=null;st.speaker='收藏角色';context.characters.pop();assert.equal(api({}),'/characters/saved.png');
console.log('Passed saved, duplicate-name, persona and group-speaker avatar source checks');

