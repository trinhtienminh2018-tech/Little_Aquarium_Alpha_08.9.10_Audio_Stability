/** Preload -> commit as a single browser frame, with a full-scene transition.
 * Handles rapid clicks by discarding obsolete prepared snapshots.
 */
export class SceneTransition {
  constructor({root,prepare,commit,documentRef=document,duration=480}={}){
    this.root=root;this.prepare=prepare;this.commit=commit;this.doc=documentRef;
    this.duration=duration;this.version=0;this.pendingKey=null;
    this.currentKey=null;this.pending=null;
  }
  initialize(key){this.currentKey=key;}
  request(key,model){
    if(key===this.pendingKey)return this.pending||Promise.resolve(false);
    if(key===this.currentKey){this.version++;this.pendingKey=null;return Promise.resolve(false);}
    const revision=++this.version;
    this.pendingKey=key;
    this.pending=(async()=>{
      let prepared;
      try{prepared=await this.prepare(model);}catch(error){
        if(revision===this.version){this.pendingKey=null;console.error('Scene preload failed',error);}
        return false;
      }
      if(revision!==this.version)return false;
      const atomicCommit=()=>{
        if(revision!==this.version)return;
        this.root.classList.add('scene-atomic-commit');
        this.commit(prepared,model);
        this.currentKey=key;
        this.pendingKey=null;
      };
      // Eye comfort: commit the fully preloaded scene atomically. Never use
      // the browser's cross-faded view snapshots: overlapping bright layers
      // can create a prolonged flash during daypart changes.
      atomicCommit();
      // Hold the no-per-layer-transition class through the next paint.
      if(typeof requestAnimationFrame==='function'){
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      }
      if(revision===this.version)this.root.classList.remove('scene-atomic-commit');
      return revision===this.version;
    })();
    return this.pending;
  }
}
