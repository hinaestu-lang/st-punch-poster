const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync(require('node:path').join(__dirname,'../index.js'),'utf8');
const fn=vm.runInNewContext(s.slice(s.indexOf('function cssStabilizeCardEdges('),s.indexOf('function cssFillTemplate('))+';cssStabilizeCardEdges');
for(const [id,selector] of [['threads_profile','.thp-thread-chip'],['ios_quote_menu','.iosq-card']]){
const styles={},el={style:{setProperty(k,v){styles[k]=v;}}};
fn({querySelectorAll:q=>q===selector?[el]:[]},id);assert.equal(styles['box-shadow'],'none');assert.equal(styles.filter,'none');if(id==='ios_quote_menu')assert.equal(styles.border,'1px solid #e5e5e5');
}
let calls=0;fn({querySelectorAll(){calls++;return[];}},'ao3_work');assert.equal(calls,0);
console.log('Passed targeted card edge cleanup for bundled and legacy templates without affecting other layouts');
