const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.js'),'utf8');
function section(from,to){const a=source.indexOf(from),b=source.indexOf(to,a);assert.ok(a>=0&&b>a);return source.slice(a,b);}
function text(value){return {nodeType:3,textContent:value};}
function element(tag,children=[],options={}){
  const node={nodeType:1,tagName:tag.toUpperCase(),children,...options,
    hasAttribute:name=>name==='style'&&!!options.display,
    closest(){let el=this;while(el){if(el.hidden||['SCRIPT','STYLE'].includes(el.tagName))return el;el=el.parentElement;}return null;},
    contains(other){return other===this||this.children.some(child=>child===other||child.contains?.(other));},
    get textContent(){return this.children.map(child=>child.textContent).join('');}
  };
  children.forEach(child=>child.parentElement=node);return node;
}
const document={createTreeWalker(body){
  const nodes=[];const visit=n=>{for(const child of n.children||[]){nodes.push(child);visit(child);}};visit(body);
  let i=0;return {nextNode:()=>nodes[i++]||null};
}};
const window={NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},getComputedStyle:node=>{
  let whiteSpace='normal';for(let el=node;el;el=el.parentElement)if(el.whiteSpace){whiteSpace=el.whiteSpace;break;}
  return {display:node.display||(['P','DIV'].includes(node.tagName)?'block':'inline'),whiteSpace};
}};
const api=vm.runInNewContext(section('function normalizeParagraphs(','function normalize(t)')+
  section('function softJoinGap(','function sourceParagraphParts(')+
  section('function snippetNodeText(','function snippetParagraphIndex(')+
  ';({snippetNodeText,snippetParagraphSlice,snippetRangeParagraphText})',{window,document});
const fixtures=[
  ['text after a closed block',[element('p',[text('甲')]),text('乙')],'甲\n\n乙'],
  ['nested block exit',[text('甲'),element('div',[text('乙')]),text('丙')],'甲\n\n乙\n\n丙'],
  ['styled span paragraphs',[element('span',[text('甲')],{display:'block'}),element('span',[text('乙')],{display:'block'})],'甲\n\n乙'],
  ['ordinary inline nodes',[text('甲'),element('em',[text('乙')]),text('丙')],'甲乙丙'],
  ['explicit BR',[text('甲'),element('br'),text('乙')],'甲\n乙'],
  ['pre-wrap line breaks',[element('span',[text('甲\n乙')],{whiteSpace:'pre-wrap'})],'甲\n乙'],
  ['HTML source whitespace',[element('p',[text('甲')]),text('\n  '),element('p',[text('乙')])],'甲\n\n乙']
];
for(const [name,children,expected] of fixtures){
  const body=element('div',children),parsed=api.snippetNodeText(body);
  assert.equal(api.snippetParagraphSlice(parsed),expected,name);
  for(const chunk of parsed.chunks)assert.equal(parsed.full.slice(chunk.start,chunk.end),chunk.node.textContent,name+' offsets');
}
const first=text('前缀甲'),last=text('乙后缀');
const body=element('div',[element('p',[first]),last]);
const range={collapsed:false,startContainer:first,startOffset:2,endContainer:last,endOffset:1,intersectsNode:()=>true};
assert.equal(api.snippetRangeParagraphText(range,body).text,'甲\n\n乙','partial selection across a block exit');
console.log('Passed 8 DOM traversal/selection fixtures and stable source offset checks');
