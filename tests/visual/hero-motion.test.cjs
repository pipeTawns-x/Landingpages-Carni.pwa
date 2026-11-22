const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.resolve(__dirname,'../../js/modules/ui/hero-video.js'),'utf8');
const modulePromise=import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
function emitter(extra={}) { const listeners={}; return Object.assign(extra,{addEventListener:(n,f)=>{listeners[n]=f;},removeEventListener:n=>delete listeners[n],fire:n=>listeners[n]?.()}); }
async function setup(reduced=false) {
 const {initHeroVideo}=await modulePromise;
 const media=emitter({matches:reduced});
 const document=emitter({hidden:false});
 let observer,plays=0,pauses=0;
 const video=emitter({paused:true,removeAttribute:()=>{},play:()=>{plays++;video.paused=false;return Promise.resolve();},pause:()=>{pauses++;video.paused=true;}});
 const button=emitter({hidden:true,textContent:'',setAttribute:()=>{}});
 const window={matchMedia:()=>media,IntersectionObserver:class {constructor(fn){observer=fn;}observe(){}disconnect(){}}};
 const cleanup=initHeroVideo(video,button,{window,document});
 return {media,document,video,button,cleanup,intersect:value=>observer([{isIntersecting:value}]),plays:()=>plays,pauses:()=>pauses};
}
test('offscreen video waits, visible video plays, hidden tab pauses',async()=>{const f=await setup();assert.equal(f.plays(),0);f.intersect(true);assert.equal(f.plays(),1);f.document.hidden=true;f.document.fire('visibilitychange');assert.equal(f.video.paused,true);});
test('reduced motion prevents automatic playback and reacts to preference changes',async()=>{const f=await setup(true);f.intersect(true);assert.equal(f.plays(),0);f.media.matches=false;f.media.fire('change');assert.equal(f.plays(),1);f.media.matches=true;f.media.fire('change');assert.equal(f.video.paused,true);});
test('manual pause survives leaving the viewport and returning',async()=>{const f=await setup();f.intersect(true);f.button.fire('click');f.intersect(false);f.intersect(true);assert.equal(f.plays(),1);assert.equal(f.button.textContent,'Reproducir video');});
test('manual playback can be requested with reduced motion',async()=>{const f=await setup(true);f.intersect(true);f.button.fire('click');assert.equal(f.plays(),1);assert.equal(f.button.hidden,false);});
test('rejected autoplay remains an actionable paused state',async()=>{const f=await setup();f.video.play=()=>Promise.reject(new Error('autoplay blocked'));f.intersect(true);await new Promise(r=>setImmediate(r));assert.equal(f.button.textContent,'Reproducir video');});
test('cleanup pauses and removes listeners',async()=>{const f=await setup();f.intersect(true);f.cleanup();const count=f.plays();f.button.fire('click');assert.equal(f.plays(),count);assert.equal(f.video.paused,true);});
