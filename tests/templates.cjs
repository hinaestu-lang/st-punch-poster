const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'index.js'),'utf8');
const marker='const BUNDLED_TEMPLATE_CSS = ',start=source.indexOf(marker)+marker.length,end=source.indexOf(';\n',start);
const bundle=JSON.parse(source.slice(start,end)),ids=new Set();
for(const text of bundle){
const meta=JSON.parse(text.match(/@pk-template\s*([\s\S]*?)\s*@end-pk-template/)[1]);
assert(!ids.has(meta.id));ids.add(meta.id);assert(meta.html.includes('data-pk="body"'));
}
const templates=fs.readdirSync(path.join(root,'templates')).filter(x=>x.endsWith('.css'));
assert.equal(templates.length,bundle.length);
for(const name of templates)assert(bundle.some(text=>text.trim()===fs.readFileSync(path.join(root,'templates',name),'utf8').trim()),name+' differs from bundled CSS');
for(const name of ['index.js','style.css'])assert(fs.existsSync(path.join(root,name)));
console.log('Passed all '+bundle.length+' template registrations, unique IDs and exact standalone/bundled CSS consistency');
