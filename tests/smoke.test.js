import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {SceneTransition} from '../public/js/scene-transition.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'public/index.html'),'utf8');
const main=readFileSync(resolve(root,'public/js/main.js'),'utf8');
test('unique HTML element ids',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'duplicate DOM IDs');
});
test('one coral motion slider, wired and persisted',()=>{
 assert.equal((html.match(/id="coral-motion-control"/g)||[]).length,1);
 assert.equal((html.match(/id="coral-motion-out"/g)||[]).length,1);
 assert.doesNotMatch(html,/id="coral-motion-strength"/);
 assert.doesNotMatch(main,/coral-motion-strength/);
 assert.match(main,/world\.coralMotion=clamp/);
});
test('daypart scene transition commits only after preloading',async()=>{
 const cls=new Set();const events=[];
 const root={classList:{add:c=>cls.add(c),remove:c=>cls.delete(c)}};
 const tx=new SceneTransition({root,documentRef:{},prepare:async m=>{events.push('prepared');return m;},commit:()=>events.push('committed')});
 tx.initialize('day');
 assert.equal(await tx.request('sunset',{time:'sunset'}),true);
 assert.deepEqual(events,['prepared','committed']);
 assert.equal(tx.currentKey,'sunset');
 assert.equal(cls.has('scene-atomic-commit'),false);
});
test('rapid daypart requests discard stale preloads',async()=>{
 const commits=[];let finishDay,finishNight;
 const promises={sunset:new Promise(r=>finishDay=r),night:new Promise(r=>finishNight=r)};
 const tx=new SceneTransition({root:{classList:{add(){},remove(){}}},documentRef:{},prepare:m=>promises[m.time],commit:(_prepared,m)=>commits.push(m.time)});
 tx.initialize('day');
 const a=tx.request('sunset',{time:'sunset'});const b=tx.request('night',{time:'night'});
 finishNight('n');finishDay('s');
 await Promise.all([a,b]);
 assert.deepEqual(commits,['night']);
 assert.equal(tx.currentKey,'night');
});
test('no View Transition crossfade enabled',()=>{
 const transition=readFileSync(resolve(root,'public/js/scene-transition.js'),'utf8');
 assert.doesNotMatch(transition,/\.startViewTransition\s*\(/);
});
