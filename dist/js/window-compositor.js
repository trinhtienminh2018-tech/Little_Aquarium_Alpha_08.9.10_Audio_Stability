/** A single transparent outside layer, composited from a consistent aperture.
 * Auto-clock mode crossfades between the supplied source-art dayparts.
 * Manual changes use the same fade without touching LED/wood/aquarium.
 */
export const OUTSIDE_VARIANTS=['day','sunset','night','storm-day','storm-sunset','storm-night'];
export function sceneFor(world) {
  if(world.weather===2) return world.time===2?'storm-night':world.time===1?'storm-sunset':'storm-day';
  return world.time===2?'night':world.time===1?'sunset':'day';
}
const ROOT='/assets/layers/';
const valid=k=>OUTSIDE_VARIANTS.includes(k);
function loadImage(src){
  const image=new Image(); image.decoding='async'; image.src=src;
  return image.decode ? image.decode().then(()=>image) : new Promise((resolve,reject)=>{
    image.onload=()=>resolve(image);image.onerror=reject;
    if(image.complete&&image.naturalWidth)resolve(image);
  });
}
function bufferCanvas(width,height){
  const el=document.createElement('canvas');el.width=width;el.height=height;
  return [el,el.getContext('2d',{alpha:true})];
}
export class WindowCompositor {
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});
    this.cache=new Map();this.current=null;this.requested=null;this.revision=0;
    this.matte=loadImage(ROOT+'manual-window-render-matte.png');
    [this.fromCanvas,this.fromCtx]=bufferCanvas(canvas.width,canvas.height);
    [this.toCanvas,this.toCtx]=bufferCanvas(canvas.width,canvas.height);
    this.raf=0;this.hasPainted=false;
    this.firstFrame=new Promise((resolve,reject)=>{this.resolveFirstFrame=resolve;this.rejectFirstFrame=reject;});
  }
  whenFirstPainted(){return this.firstFrame;}
  loadScene(key){
    if(!valid(key))throw Error('Unsupported outside scene: '+key);
    if(!this.cache.has(key))this.cache.set(key,loadImage(ROOT+'manual-outside-'+key+'.webp'));
    return this.cache.get(key);
  }
  /** Pre-render a complete next panorama without altering the displayed canvas.
   * Never share the transition canvas with an in-progress fade: that created
   * leaked/mismatched frames during rapid daypart changes.
   */
  async prepareBlend(fromKey,toKey=fromKey,weight=0){
    if(!valid(fromKey)||!valid(toKey))throw Error('Unsupported outside scene');
    const amount=fromKey===toKey?0:Math.max(0,Math.min(1,weight));
    const [a,b,matte]=await Promise.all([this.loadScene(fromKey),this.loadScene(toKey),this.matte]);
    const [buffer,ctx]=bufferCanvas(this.canvas.width,this.canvas.height);
    ctx.drawImage(a,0,0,this.canvas.width,this.canvas.height);
    if(amount>0){ctx.globalAlpha=amount;ctx.drawImage(b,0,0,this.canvas.width,this.canvas.height);ctx.globalAlpha=1;}
    ctx.globalCompositeOperation='destination-in';
    ctx.drawImage(matte,0,0,this.canvas.width,this.canvas.height);
    ctx.globalCompositeOperation='source-over';
    return {buffer,signature:`${fromKey}/${toKey}/${amount.toFixed(4)}`};
  }
  /** Synchronous replacement: no unmasked or half-lit middle frame. */
  commitPrepared(prepared){
    ++this.revision;
    if(this.raf)cancelAnimationFrame(this.raf);
    this.raf=0;
    this.ctx.globalAlpha=1;
    this.ctx.globalCompositeOperation='source-over';
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ctx.drawImage(prepared.buffer,0,0);
    this.requested=prepared.signature;
    this.current=prepared.signature;
    if(!this.hasPainted){this.hasPainted=true;this.resolveFirstFrame();}
  }
  show(key){return this.showBlend(key,key,0);}
  async showBlend(fromKey,toKey=fromKey,weight=0,{immediate=false}={}){
    if(!valid(fromKey)||!valid(toKey))throw Error('Unsupported outside scene');
    weight=Math.max(0,Math.min(1,weight));
    if(fromKey===toKey)weight=0;
    // Avoid unnecessary frame work at the same time of day.
    const signature=`${fromKey}/${toKey}/${weight.toFixed(4)}`;
    if(signature===this.requested)return this.whenFirstPainted();
    this.requested=signature;
    const revision=++this.revision;
    try{
      const [a,b,matte]=await Promise.all([this.loadScene(fromKey),this.loadScene(toKey),this.matte]);
      if(revision!==this.revision)return;
      const c=this.toCtx,w=this.canvas.width,h=this.canvas.height;
      c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
      c.clearRect(0,0,w,h);c.drawImage(a,0,0,w,h);
      if(weight>0){c.globalAlpha=weight;c.drawImage(b,0,0,w,h);c.globalAlpha=1;}
      // Apply the exact same one mask to both panoramas, before the transition.
      c.globalCompositeOperation='destination-in';c.drawImage(matte,0,0,w,h);
      c.globalCompositeOperation='source-over';
      if(this.raf)cancelAnimationFrame(this.raf);
      this.current=signature;
      if(!this.hasPainted||immediate){
        this.ctx.clearRect(0,0,w,h);this.ctx.drawImage(this.toCanvas,0,0);
        this.hasPainted=true;this.resolveFirstFrame();return true;
      }
      // Capture the CURRENT visible frame, even if a prior fade was interrupted.
      this.fromCtx.clearRect(0,0,w,h);this.fromCtx.drawImage(this.canvas,0,0);
      const started=performance.now(),duration=1600,display=this.ctx;
      const animate=now=>{
        if(revision!==this.revision)return;
        const t=Math.min(1,Math.max(0,(now-started)/duration));
        const ease=t*t*(3-2*t);
        display.clearRect(0,0,w,h);
        display.globalAlpha=1;display.drawImage(this.fromCanvas,0,0);
        display.globalAlpha=ease;display.drawImage(this.toCanvas,0,0);
        display.globalAlpha=1;
        this.raf=t<1?requestAnimationFrame(animate):0;
      };
      this.raf=requestAnimationFrame(animate);
    }catch(err){if(revision===this.revision){this.requested=null;console.error('Window compositor failed',err);if(!this.hasPainted)this.rejectFirstFrame(err);}}
  }
}
