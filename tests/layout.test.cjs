const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const fn=html.slice(html.indexOf('  function computeBarBreaks('),html.indexOf('  // rows of 4'));
const context=vm.createContext({});vm.runInContext(fn,context);
function doc(count,{dense=[],sections=[],pickup=false,chords=false}={}){
 const measures=Array.from({length:count},(_,i)=>({
  getAttribute:k=>k==='implicit'&&i===0&&pickup?'yes':k==='number'?String(i+1):null,
  querySelector:q=>q==='rehearsal'&&sections.includes(i)?{}:null,
  querySelectorAll:q=>q==='note'?Array.from({length:dense.includes(i)?8:chords?6:2},(_,n)=>({querySelector:()=>chords&&n%3!==0?{}:null})):[]
 }));return {querySelectorAll:()=>[{querySelectorAll:()=>measures}]};
}
const breaks=(d,n=4)=>[...context.computeBarBreaks(d,n).set].sort((a,b)=>a-b);
test('chord tones do not split simple four-bar phrases',()=>assert.deepEqual(breaks(doc(8,{chords:true})),[4]));
test('crowded block splits 2+2 without shifting next phrase',()=>assert.deepEqual(breaks(doc(12,{dense:[0]})),[2,4,8]));
test('section restarts phrasing',()=>assert.deepEqual(breaks(doc(12,{sections:[6]})),[4,6,10]));
test('pickup does not offset first full phrase',()=>assert.deepEqual(breaks(doc(9,{pickup:true})),[1,5]));
test('two-bar mode and short ending',()=>assert.deepEqual(breaks(doc(7),2),[2,4,6]));
test('all embedded scripts parse',()=>{for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);});
test('manual recovery still blurs before synchronous focus',()=>{
 const body=html.match(/  function recoverPedalInput\(\) \{([\s\S]*?)\n  \}/)[1];
 const calls=[],status={};let focused=true;
 const anchor={value:'x',blur(){calls.push('blur');focused=false;}};
 const c=vm.createContext({awaitingRecoveryKey:false,document:{activeElement:anchor},hwKbAnchor:anchor,logPedal(){},primeHardwareKeyboard(){calls.push('focus');focused=true;},isPrimed:()=>focused,$:()=>status});
 vm.runInContext(body,c);assert.equal(c.awaitingRecoveryKey,true);assert(calls.indexOf('blur')<calls.indexOf('focus'));assert.match(status.textContent,/press a pedal/);
});
