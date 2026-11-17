const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../index.js'),'utf8');
const code=source.slice(source.indexOf('function cssExportAvatar('),source.indexOf('async function cssTemplateExport('));
let rasterCount=0;
const computedValues={'width':'34px','height':'34px','display':'block','position':'relative','border-radius':'50%','z-index':'1'};
const css=Object.assign(Object.keys(computedValues),{
  getPropertyValue:p=>computedValues[p],objectFit:'cover',objectPosition:'50% 50%'
});
const document={createElement(tag){
  if(tag==='canvas')return {getContext:()=>({drawImage(){rasterCount++;}}),toDataURL:()=> 'data:image/png;base64,avatar'};
  return {tagName:'SPAN',style:{values:{},setProperty(p,v){this.values[p]=v;}},setAttribute(){}};
}};
const api=vm.runInNewContext(code+';cssExportAvatar',{document,window:{getComputedStyle:()=>css},Map});
const cache=new Map();
for(let i=0;i<8;i++){
  let replacement;
  const copy={className:'pk-avatar-photo',replaceWith:n=>{replacement=n;}};
  const node={currentSrc:'/avatar.png'};
  api(node,copy,{naturalWidth:512,naturalHeight:512},cache);
  assert.equal(replacement.tagName,'SPAN');
  assert.equal(replacement.className,'pk-avatar-photo');
  assert.equal(replacement.style.values.width,'34px');
  assert.equal(replacement.style.values.height,'34px');
  assert.equal(replacement.style.values.position,'relative');
  assert.equal(replacement.style.values['border-radius'],'50%');
  assert.equal(replacement.style.values['background-size'],'cover');
  assert.equal(replacement.style.values['background-position'],'50% 50%');
  assert.equal(replacement.style.values['background-image'],'url("data:image/png;base64,avatar")');
}
assert.equal(rasterCount,1,'repeated avatars share one raster resource');
assert.equal(cache.size,1);
console.log('Passed 8-avatar export serialization and resource reuse checks');
