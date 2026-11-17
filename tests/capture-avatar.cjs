const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const context={chat:[{name:'同名',is_user:false},{name:'用户',is_user:true}],characters:[{name:'同名',avatar:'first.png'},{name:'同名',avatar:'second.png'}],characterId:1,userAvatar:'persona.png'};
const code=s.slice(s.indexOf('function snippetCharAvatar('),s.indexOf('function snippetRoleOf('));
const api=vm.runInNewContext(code+';snippetCurrentCharacter',{ctx:()=>context,document:{querySelector:()=>null}});
assert.equal(api(0).avatar,'/characters/second.png');
context.characterId=99;assert.equal(api(0).avatar,'');
assert.equal(api(1).avatar,'/User Avatars/persona.png');
console.log('Passed capture-time duplicate character matching and persona avatar directory');
