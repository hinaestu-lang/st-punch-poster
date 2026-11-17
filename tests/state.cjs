const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.js'),'utf8');
new vm.Script(source);
function section(from,to){
  const start=source.indexOf(from),end=source.indexOf(to,start);
  assert.ok(start>=0&&end>start,from);
  return source.slice(start,end);
}

// Reload and history restoration must retain independent rule switches.
const es={'punch-poster':{cur:{pkSharedCopyV32:true,reps:[
  {from:'A',to:'甲',enabled:false},{from:'B',to:'乙'},null
]}}};
const settings={ctx:()=>({extensionSettings:es}),MODULE:'punch-poster',BASE:{}};
vm.createContext(settings);
vm.runInContext(section('const normalizedCur =','const persist ='),settings);
assert.equal(settings.store().cur.reps[0].enabled,false);
assert.equal(settings.store().cur.reps[1].enabled,true);
assert.equal(settings.store().cur.reps.length,2);
es['punch-poster'].cur=JSON.parse(JSON.stringify(settings.store().cur));
assert.equal(settings.store().cur.reps[0].enabled,false,'undo/import normalization');

// Paper palettes must be reversible, preserving authored inline styles and UI.
function node(native,inline=''){
  const values=new Map(inline?[['background-color',{value:inline,priority:'important'}]]:[]);
  return {native,style:{
    getPropertyValue:k=>values.get(k)?.value||'',
    getPropertyPriority:k=>values.get(k)?.priority||'',
    setProperty:(k,value,priority)=>values.set(k,{value,priority}),
    removeProperty:k=>values.delete(k)
  }};
}
const root=node('white'),paper=node('white','white'),sidebar=node('gray');
root.querySelectorAll=()=>[paper,sidebar];root.contains=n=>[root,paper,sidebar].includes(n);
const color=n=>n.style.getPropertyValue('background-color')||n.native;
const palette={window:{getComputedStyle:n=>({backgroundColor:color(n)})}};
vm.createContext(palette);
vm.runInContext(section('const cssPaperStyles=','function cssFillTemplate('),palette);
palette.cssApplyPaperColor(root,{cssPaperOverride:true,paperColor:'gray'});
assert.equal(color(paper),'gray');
palette.cssApplyPaperColor(root,{cssPaperOverride:true,paperColor:'pink'});
assert.equal(color(root),'pink');assert.equal(color(paper),'pink');
assert.equal(color(sidebar),'gray','same colour in a separate UI panel stays independent');
palette.cssApplyPaperColor(root,{cssPaperOverride:false});
assert.equal(color(root),'white');assert.equal(color(paper),'white');
assert.equal(paper.style.getPropertyPriority('background-color'),'important');
assert.equal(root.style.getPropertyValue('background-color'),'','remove temporary inline override');

// Independent pending text values must survive rapid focus changes.
const current={reps:[{from:'old',to:'old'}]};let timerCalls=0;
const edits={cur:()=>current,setKey:(k,v)=>current[k]=v,clearTimeout:()=>{},
  setTimeout:()=>++timerCalls,keyboardIsOpen:()=>true,persist:()=>{},buildText:()=>{},schedule:()=>{},historyPush:()=>{}};
vm.createContext(edits);
vm.runInContext('let fieldTimer=0;const pendingFields=new Map();'+section('function flushField()','function syncKeyboardViewport('),edits);
edits.queueField({type:'setting',key:'pubTitle',value:'旧标题'});
edits.queueField({type:'setting',key:'pubAuthor',value:'作者'});
edits.queueField({type:'setting',key:'pubTitle',value:'新标题'});
edits.queueField({type:'replacement',index:0,side:'from',value:'原词'});
edits.queueField({type:'replacement',index:0,side:'to',value:'替换词'});
assert.equal(timerCalls,0,'no timer during keyboard input');
edits.flushField();
assert.equal(current.pubTitle,'新标题');assert.equal(current.pubAuthor,'作者');
assert.equal(current.reps[0].from,'原词');assert.equal(current.reps[0].to,'替换词');

// Safari's final composition event can still carry isComposing=true.
const handlers={};let queued;
const input={dataset:{k:'pubTitle'},value:'已选中的中文'};
const ime={ov:{addEventListener:(type,fn)=>handlers[type]=fn},compositionFields:new Set([input]),
  keyboardTarget:n=>n===input,clearTimeout:()=>{},fieldTimer:0,
  queueField:entry=>queued=entry,keyboardRenderPending:false};
vm.createContext(ime);
vm.runInContext(section('  const typedField =','  ov.addEventListener(\'input\', e=>{'),ime);
handlers.compositionend({target:input,isComposing:true,composedPath:()=>[input]});
assert.equal(queued.value,'已选中的中文');assert.equal(ime.compositionFields.size,0);

// Dismissing a cancelled IME session cannot permanently block paints.
const keyboard={st:{ov:{classList:{contains:()=>true,remove:()=>{}},style:{removeProperty:()=>{}}}},
  compositionFields:new Set([input]),keyboardCoolingUntil:0,keyboardRevealPending:true,
  keyboardFrame:0,keyboardRenderPending:false};
vm.createContext(keyboard);
vm.runInContext(section('function keyboardDismiss()','function syncVisualViewport('),keyboard);
keyboard.keyboardDismiss();assert.equal(keyboard.compositionFields.size,0);
assert.equal(keyboard.keyboardRevealPending,false);

// Safari Back/Forward restoration resumes the extension rather than a disposed UI.
let disposed=0;
const lifecycle={window:{__pkDispose:()=>disposed++}};
const onPageHide=vm.runInNewContext(section('  const onPageHide =','  window.__pkDispose =')+';onPageHide',lifecycle);
onPageHide({persisted:true});assert.equal(disposed,0);
onPageHide({persisted:false});assert.equal(disposed,1);
console.log('Passed settings persistence, reversible palettes, pending fields and IME regression checks');
