const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const pick=(a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
const code=pick('const REPS_DIFF_MAX','// 把「替换后显示的文字」')+pick('function cssBodyLines(','function editableCssTargets(');
const api=vm.runInNewContext(code+';({inlineEditedRendered})',{});
// 段首的全角缩进在显示时被修掉，编辑别处后要原样保留
const R='第一段。\n\n　　第二段有缩进。\n第三段。';
const D='第一段。\n\n第二段有缩进。\n第三段。';
assert.equal(api.inlineEditedRendered(R,D,'第一段。\n\n第二段有缩进啊。\n第三段。'),'第一段。\n\n　　第二段有缩进啊。\n第三段。');
// 没改动时原样返回
assert.equal(api.inlineEditedRendered(R,D,D),R);
// 删掉一个字
assert.equal(api.inlineEditedRendered(R,D,'第一。\n\n第二段有缩进。\n第三段。'),'第一。\n\n　　第二段有缩进。\n第三段。');
console.log('Passed inline edit keeps paragraph layout');
