const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../index.js'), 'utf8');
new vm.Script(source);
function section(from, to) {
  const start = source.indexOf(from);
  assert.ok(start >= 0, from);
  const end = source.indexOf(to, start);
  assert.ok(end > start, to);
  return source.slice(start, end);
}
const code = section('function normalizeParagraphs(', 'function buildText(')
  + section('function softJoinGap(', 'function marginNoteParts(')
  + section('function snippetParagraphSlice(', '// Browser selection.toString()');
const api = vm.runInNewContext(code + ';({normalize, sourceParagraphParts, sourceTextParagraphs, snippetParagraphSlice})');
const parts = text => Array.from(api.sourceTextParagraphs(text));
const fixtures = [
  ['single BR', '第一段。\n第二段。', [[4, 'br']], ['第一段。', '第二段。']],
  ['block boundary', '第一段。\n第二段。', [[4, 'block']], ['第一段。', '第二段。']],
  ['double BR', '第一段。\n第二段。', [[4, 'block']], ['第一段。', '第二段。']],
  ['three explicit breaks', '甲\n乙\n丙', [[1, 'br'], [3, 'br']], ['甲', '乙', '丙']],
  ['HTML formatting whitespace', '第一\n段。', [], ['第一段。']],
  ['English HTML whitespace', 'first\nparagraph', [], ['first paragraph']],
  ['inline nodes without a boundary', '第一段。第二段。', [], ['第一段。第二段。']]
];
for (const [name, full, breaks, expected] of fixtures) {
  const selected = api.snippetParagraphSlice({full, breaks:new Map(breaks)});
  assert.deepEqual(parts(selected), expected, name);
}
assert.deepEqual(parts('甲\n乙'), ['甲', '乙'], 'editor single newline');
assert.deepEqual(parts('甲\r\n乙'), ['甲', '乙'], 'CRLF');
assert.deepEqual(parts('甲\n\n乙'), ['甲', '乙'], 'blank line');
assert.equal(api.sourceParagraphParts('甲\n\n乙').filter(p => p.blank).length, 1, 'keep blank spacer');
assert.equal(api.normalize('甲\n\n乙'), '甲\n乙', 'Canvas normalization unchanged');
const full='前缀第一段。\n第二段。后缀';
const partial=api.snippetParagraphSlice({full,breaks:new Map([[6,'br']])},2,11);
assert.deepEqual(parts(partial), ['第一段。', '第二段。'], 'partial cross-paragraph selection');
console.log('Passed 13 paragraph regression checks and full-source syntax check');
