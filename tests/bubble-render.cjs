const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const document={createElement:()=>({style:{values:{},setProperty(k,v,priority){this.values[k]=[v,priority]}}})};
const render=vm.runInNewContext(s.slice(s.indexOf('function bubbleRenderBilingual('),s.indexOf('function bubbleBilingual('))+';bubbleRenderBilingual',{document});
let nodes;render({replaceChildren(...n){nodes=n;}},{original:'안녕',translation:'你好'});
assert.equal(nodes.length,2);assert.equal(nodes[0].textContent,'안녕');assert.equal(nodes[1].textContent,'你好');
for(const n of nodes)assert.equal(n.style.values.display.join(','),'block,important');
assert(nodes[1].style.values['border-top'][0].includes('dashed'));
console.log('Passed generated bilingual block layout and divider without template stylesheet dependency');
