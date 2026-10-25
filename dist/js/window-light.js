/** Alpha 08.9.3 — selective loading of the user's painted sunlight layers.
 * Does NOT redraw artificial rectangular spill. Rendering geometry remains
 * identical to 08.9.2d; only image request timing changes.
 */
const W=1536,H=1024;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

export function windowLightWeights({time=0,weather=0,realtime=false,from=0,to=0,blend=0,strength=85,windowOpen=false}={}){
  const weights=[0,0,0];
  if(realtime){
    const f=clamp(Math.trunc(from),0,2),t=clamp(Math.trunc(to),0,2),v=clamp(Number(blend)||0);
    weights[f]+=1-v;weights[t]+=v;
  }else weights[clamp(Math.trunc(time),0,2)]=1;
  const intensity=clamp(Number(strength)||0,0,100)/100;
  const storm=weather===2?.34:1;
  const aperture=windowOpen?1.08:1;
  return {
    day:clamp(weights[0]*.96*intensity*storm*aperture),
    sunset:clamp(weights[1]*1.03*intensity*storm*aperture),
    moon:clamp(weights[2]*.88*intensity*(weather===2?.45:1)*aperture),
  };
}

const PATHS=Object.freeze({
  day:'/assets/window-light/window-light-day.png',
  sunset:'/assets/window-light/window-light-sunset.png',
  moon:'/assets/window-light/window-light-moon.png',
  shadow:'/assets/window-light/window-light-frame-shadow.png',
  closed:'/assets/layers/manual-weather-closed-mask.png',
  open:'/assets/layers/manual-weather-open-mask.png',
});

/** Pure helper used by the runtime and tests: no unrelated artwork is fetched. */
export function windowLightAssetPlan(w,windowOpen=false){
  const day=w.day>0.0001,sunset=w.sunset>0.0001,moon=w.moon>0.0001;
  if(!(day||sunset||moon))return [];
  const plan=[windowOpen?'open':'closed'];
  if(day)plan.push('day');
  if(sunset)plan.push('sunset');
  if(moon)plan.push('moon');
  plan.push('shadow');
  return plan;
}

function radial(ctx,x,y,rx,ry,rgb,amount){
  ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
  const g=ctx.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,`rgba(${rgb},${amount})`);
  g.addColorStop(.34,`rgba(${rgb},${amount*.72})`);
  g.addColorStop(.73,`rgba(${rgb},${amount*.15})`);
  g.addColorStop(1,`rgba(${rgb},0)`);
  ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
function ray(ctx,start,end,halfwidth,color,alpha){
  const dx=end.x-start.x,dy=end.y-start.y;
  const len=Math.max(1,Math.hypot(dx,dy)),nx=-dy/len,ny=dx/len;
  ctx.save();ctx.beginPath();
  ctx.moveTo(start.x+nx*halfwidth*.35,start.y+ny*halfwidth*.35);
  ctx.lineTo(start.x-nx*halfwidth*.35,start.y-ny*halfwidth*.35);
  ctx.lineTo(end.x-nx*halfwidth,end.y-ny*halfwidth);
  ctx.lineTo(end.x+nx*halfwidth,end.y+ny*halfwidth);
  ctx.closePath();
  const g=ctx.createLinearGradient(start.x,start.y,end.x,end.y);
  g.addColorStop(0,`rgba(${color},0)`);
  g.addColorStop(.28,`rgba(${color},${alpha*.67})`);
  g.addColorStop(.65,`rgba(${color},${alpha})`);
  g.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle=g;ctx.fill();ctx.restore();
}
function paintWindowPaneWash(ctx,w,paneMask){
  ctx.clearRect(0,0,W,H);
  const warm=(w.day*.38)+(w.sunset*.55),cool=w.moon*.46;
  if(warm>0){
    radial(ctx,815,150,540,420,'255,234,188',warm*.58);
    radial(ctx,1045,235,410,300,'255,188,119',warm*.38+w.sunset*.12);
    ray(ctx,{x:625,y:5},{x:495,y:445},118,'255,222,160',warm*.21);
    ray(ctx,{x:1025,y:12},{x:820,y:465},103,'255,196,128',Math.max(w.day*.10,w.sunset*.18));
  }
  if(cool>0){
    radial(ctx,930,112,338,352,'175,214,255',cool*.64);
    radial(ctx,570,252,460,285,'164,206,255',cool*.28);
    ray(ctx,{x:950,y:2},{x:812,y:450},74,'198,228,255',cool*.20);
  }
  ctx.save();ctx.globalCompositeOperation='destination-in';
  if(paneMask)ctx.drawImage(paneMask,0,0,W,H);
  else ctx.clearRect(0,0,W,H); // fail closed: never expose an unmasked rectangle
  ctx.restore();
}
function drawImageFull(ctx,img,alpha=1,mode='source-over'){
  if(!img||!img.complete||img.naturalWidth===0||alpha<=0)return;
  ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation=mode;
  ctx.drawImage(img,0,0,W,H);ctx.restore();
}

export class WindowLight{
  constructor({sunGlass,moonGlass,sunRoom,moonRoom},app,{imageFactory=()=>new Image()}={}){
    this.app=app;
    this.canvases={sunGlass,moonGlass,sunRoom,moonRoom};
    this.imageFactory=imageFactory;
    this.last={day:0,sunset:0,moon:0};
    this.windowOpen=false;
    this.images=new Map();
    this.pendingLoads=new Map();
    this.loaded=new Set();
    this.failed=new Set();
    this.ready=true;
    this.drawn=false;
    this.firstFrame=new Promise((resolve,reject)=>{this.resolveFirstFrame=resolve;this.rejectFirstFrame=reject;});
    this.lastSignature='';
    this.displaySignature='';
    for(const el of Object.values(this.canvases))el.style.opacity='0';
    // No image requests in the constructor. sync() supplies the active daypart.
  }
  whenFirstRendered(){return this.firstFrame;}
  load(key){
    if(this.pendingLoads.has(key))return this.pendingLoads.get(key);
    if(this.loaded.has(key))return Promise.resolve(this.images.get(key));
    const image=this.imageFactory();
    this.images.set(key,image);
    const promise=new Promise((resolve,reject)=>{
      const completed=()=>{this.loaded.add(key);this.failed.delete(key);this.render();resolve(image);};
      const failed=()=>{
        this.failed.add(key);
        if(!this.drawn)this.rejectFirstFrame(new Error('Unable to load window light asset: '+key));
        this.render();reject(new Error('Window light asset failed: '+key));
      };
      image.onload=completed;image.onerror=failed;
      image.src=PATHS[key];
      if(image.complete&&image.naturalWidth>0)completed();
    });
    this.pendingLoads.set(key,promise);
    return promise;
  }
  /** Load the target daypart without modifying the currently displayed light. */
  async prepare(settings){
    const weights=windowLightWeights(settings);
    const open=!!settings.windowOpen;
    await Promise.all(windowLightAssetPlan(weights,open).map(key=>this.load(key)));
    return {weights,open};
  }
  render(){
    const plan=windowLightAssetPlan(this.last,this.windowOpen);
    this.ready=plan.every(key=>this.loaded.has(key)||this.failed.has(key));
    if(!this.ready)return; // Retain last fully-painted frame during short network delays.
    const signature=JSON.stringify([this.windowOpen,...Object.values(this.last).map(x=>+x.toFixed(4))]);
    if(this.drawn&&signature===this.displaySignature)return;
    const {sunGlass,moonGlass,sunRoom,moonRoom}=this.canvases;
    const w=this.last;
    const paneMask=this.images.get(this.windowOpen?'open':'closed');
    const safeMask=paneMask?.complete&&paneMask.naturalWidth>0?paneMask:null;
    paintWindowPaneWash(sunGlass.getContext('2d'),{day:w.day,sunset:w.sunset,moon:0},safeMask);
    paintWindowPaneWash(moonGlass.getContext('2d'),{day:0,sunset:0,moon:w.moon},safeMask);
    const warmCtx=sunRoom.getContext('2d');warmCtx.clearRect(0,0,W,H);
    drawImageFull(warmCtx,this.images.get('day'),w.day);
    drawImageFull(warmCtx,this.images.get('sunset'),w.sunset);
    drawImageFull(warmCtx,this.images.get('shadow'),Math.max(w.day*.68,w.sunset*.82),'multiply');
    const moonCtx=moonRoom.getContext('2d');moonCtx.clearRect(0,0,W,H);
    drawImageFull(moonCtx,this.images.get('moon'),w.moon);
    drawImageFull(moonCtx,this.images.get('shadow'),w.moon*.58,'multiply');
    for(const el of Object.values(this.canvases))el.style.opacity='1';
    this.app.style.setProperty('--window-sunset-warmth',w.sunset.toFixed(3));
    this.drawn=true;
    this.resolveFirstFrame();
    this.displaySignature=signature;
  }
  sync(settings){
    this.windowOpen=!!settings.windowOpen;
    this.last=windowLightWeights(settings);
    for(const key of windowLightAssetPlan(this.last,this.windowOpen))void this.load(key).catch(err=>console.warn(err));
    this.render();
    return this.last;
  }
}
