import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from '../public/js/audio.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){
  const old=globalThis.Audio;
  const created=[];
  class FakeAudio{
    constructor(src){this.src=src;this.paused=true;this.volume=0;this.playCount=0;this.pending=null;created.push(this);}
    addEventListener(){}
    play(){this.playCount++;this.paused=false;return new Promise((resolve,reject)=>{this.pending={resolve,reject};});}
    pause(){this.paused=true;}
  }
  globalThis.Audio=FakeAudio;
  const w={audioOn:true,weather:0,time:0,musicOn:false,piano:false,windowOpen:false,volume:.6,water:.28,nature:.22,music:.8};
  const notices=[];
  const audio=new AudioEngine(w,msg=>notices.push(msg));
  return {audio,w,notices,created,restore:()=>globalThis.Audio=old};
}
test('repeated sync does not call play on an already pending or running track',async()=>{
  const s=setup();try{
    s.audio.sync();s.audio.sync();
    assert.ok(s.created.length>0);
    assert.ok(s.created.every(a=>a.playCount===1));
    for(const a of s.created)a.pending.resolve();
    await flush();s.audio.sync();
    assert.ok(s.created.every(a=>a.playCount===1));
  }finally{s.restore();}
});
test('an interrupted play while disabling audio does not show a technical error',async()=>{
  const s=setup();try{
    s.audio.sync();const pending=s.created.map(a=>a.pending);
    s.w.audioOn=false;s.audio.sync();
    for(const p of pending)p.reject(Object.assign(new Error('play interrupted by pause'),{name:'AbortError'}));
    await flush();
    assert.equal(s.notices.length,0);
    assert.ok(s.created.every(a=>a.paused));
  }finally{s.restore();}
});
