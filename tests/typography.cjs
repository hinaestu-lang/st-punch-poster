const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/../index.js','utf8');new vm.Script(source);
const a=source.indexOf('function cssBindSharedTypography('),b=source.indexOf('function cssFillTemplate(',a);
function node(key){return {key,style:{values:{},setProperty(k,v,priority){this.values[k]={v,priority};}}};}
const user=node('user'),title=node('title'),author=node('author'),note=node('note'),extra=node('signature-extra');
extra.remove=()=>extra.removed=true;
const nodes=[user,title,author,note,extra];
const root={querySelectorAll(selector){if(selector.includes('.ps-signature-extra'))return [extra];return nodes.filter(n=>!n.removed&&selector.includes('[data-pk="'+n.key+'"]'));}};
const bind=vm.runInNewContext(source.slice(a,b)+';cssBindSharedTypography',{cssReadableInk:(_,ink)=>ink});
bind(root,{ink:'#eef5fc'},'Example Font','paper_prose_left');
for(const n of [user,title,author]){assert.equal(n.style.values.color.v,'#eef5fc');assert.equal(n.style.values['font-family'].v,'Example Font');assert.equal(n.style.values['-webkit-text-fill-color'].v,'#eef5fc');}
bind(root,{ink:'#332211'},'Second Font','ao3_work');
assert.equal(title.style.values['font-family'].v,'Second Font');assert.equal(title.style.values.color.v,'#332211');
assert.equal(extra.removed,undefined,'other templates retain notes');
bind(root,{ink:'#222222'},'Third Font','app_postype');assert.equal(extra.removed,true);
const arr=JSON.parse(source.match(/^const BUNDLED_TEMPLATE_CSS = (.*);$/m)[1]);
const ps=arr.find(t=>t.includes('"id": "app_postype"'));
assert.ok(!ps.includes('ps-signature-extra'));assert.ok(!ps.includes('data-pk=\\\"signature-extra'));
console.log('Passed title/user typography, WebKit text fill, AO3 authored headings and legacy POSTYPE note removal checks');

