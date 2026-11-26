const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
// 一个双语气泡：显示时被拆成原文 / 译文两行，编辑时要换回「原文（译文）」
const bubble={textContent:'rendered',childNodes:[],classList:{add(){}},style:{setProperty(){}},focus(){},getRootNode:()=>({getSelection:()=>null})};
const body={classList:{add(){}},style:{setProperty(){}},querySelectorAll:()=>[bubble]};
const ov={querySelector:()=>({}),classList:{remove(){},add(){}}};
const st={ov,paraText:'안녕（你好）',base:'안녕（你好）',custom:null};
const code=s.slice(s.indexOf('function beginInlineEdit('),s.indexOf('function finishInlineEdit('));
const api=vm.runInNewContext(code+';beginInlineEdit',{st,panel(){},cssActive:()=>true,inlineCssBody:()=>body,cur:()=>({pageSkin:'css:bubble_chat'}),
  editableCssTargets:()=>[bubble],bubbleMessageNodes:()=>[bubble],inlineTargetsText:()=>'',
  sourceParagraphParts:t=>t.split(/\n+/).map(text=>({text,blank:!text.trim()})),document:{createRange:()=>({selectNodeContents(){},collapse(){}}),getSelection:()=>null}});
api();assert.equal(bubble.textContent,'안녕（你好）');assert(st.inlineEditing);assert.deepEqual(st.inlineBodies,[bubble]);
console.log('Passed bilingual edit initialization with canonical translation markers');
