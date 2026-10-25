/**
 * Alpha 08.6 — separate wet glass surface, only active when the window is shut
 * in a storm. All droplets are clipped to the real closed-pane alpha mask.
 * The source background, wooden frame and aquarium are never repainted.
 */
const W=1536,H=1024;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rand=(r,a,b)=>a+(b-a)*r();
export function wetGlassTarget({weather,windowOpen}){
  return weather===2&&!windowOpen?1:0;
}
export function glassRainQuality(preset='auto',reducedMotion=false){
  if(reducedMotion)return 90;
  return preset==='smooth'?220:preset==='eco'?65:155;
}
export class GlassRain {
  constructor(canvas,{imageFactory=()=>new Image(),createCanvas=()=>document.createElement('canvas'),random=Math.random}={}){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.random=random;
    this.mask=imageFactory();this.ready=false;
    this.mask.onload=()=>{this.ready=true;};
    this.mask.onerror=()=>{this.ready=false;};
    this.mask.src='/assets/layers/manual-weather-closed-mask.png';
    if(this.mask.complete&&this.mask.naturalWidth>0)this.ready=true;
    this.buffer=createCanvas();this.buffer.width=W;this.buffer.height=H;
    this.off=this.buffer.getContext('2d');
    this.wetness=0;this.dryCanvasClean=false;this.drops=[];
    for(let i=0;i<220;i++)this.drops.push(this.makeDrop(true,i));
  }
  makeDrop(initial=false,i=0){
    const runner=i%9===0;
    return {
      x:rand(this.random,388,1210),
      y:rand(this.random,0,initial?362:28),
      r:runner?rand(this.random,1.4,2.55):rand(this.random,.55,1.48),
      speed:runner?rand(this.random,20,46):rand(this.random,.08,.85),
      trail:runner?rand(this.random,11,24):0,
      runner,phase:rand(this.random,0,6.283)
    };
  }
  draw(t,dt,{weather=0,windowOpen=false,reducedMotion=false,preset='auto',intensity=85,night=false,flash=0}={}){
    const ctx=this.ctx;
    const target=wetGlassTarget({weather,windowOpen});
    const step=clamp(Number.isFinite(dt)?dt:0,0,.12);
    // Smooth fading when opening/closing, without leaving water over the room.
    this.wetness+= (target-this.wetness)*Math.min(1,step*3.0);
    if(this.wetness<.002){
      this.wetness=0;
      if(!this.dryCanvasClean){ctx.clearRect(0,0,W,H);this.dryCanvasClean=true;}
      return;
    }
    ctx.clearRect(0,0,W,H);this.dryCanvasClean=false;
    if(!this.ready||intensity<=0)return;
    const amount=clamp(intensity/100,0,1)*this.wetness;
    const off=this.off;
    off.clearRect(0,0,W,H);
    const maxDrops=glassRainQuality(preset,reducedMotion);
    const number=Math.round(maxDrops*clamp(intensity,0,100)/100);
    const flicker=night?(.86+clamp(flash,0,1)*.65):1;
    const drift=reducedMotion?0:step;
    // Micro-specular highlights are visible at full-room scale, but are kept
    // behind the wooden dividers, not on the cat, mug, aquarium, or wall.
    for(let i=0;i<number;i++){
      let d=this.drops[i];
      d.y+=drift*d.speed;
      d.x+=drift*(.16*Math.sin(t*.6+d.phase));
      if(d.y>368||d.x>1215||d.x<382){
        d=this.makeDrop(false,i);this.drops[i]=d;
      }
      const alpha=(d.runner?.55:.48)*amount*flicker;
      off.fillStyle=`rgba(228,244,253,${clamp(alpha,0,.90)})`;
      off.beginPath();off.ellipse(d.x,d.y,d.r,d.r*1.55,0,0,Math.PI*2);off.fill();
      off.fillStyle=`rgba(79,121,147,${clamp(alpha*.23,0,.26)})`;
      off.beginPath();off.ellipse(d.x+d.r*.7,d.y+d.r*.32,d.r*.43,d.r*.66,0,0,Math.PI*2);off.fill();
      if(d.runner){
        off.strokeStyle=`rgba(221,241,255,${clamp(alpha*.55,0,.52)})`;
        off.lineWidth=Math.max(.55,d.r*.65);off.lineCap='round';
        off.beginPath();off.moveTo(d.x,d.y+d.r);
        off.quadraticCurveTo(d.x+Math.sin(t*.8+d.phase)*1.6,d.y+d.trail*.48,d.x+.8,d.y+d.trail);
        off.stroke();
      }
    }
    // Silver-blue reflection on droplets during distant lightning at night.
    if(night&&flash>.008){
      off.globalCompositeOperation='screen';
      const g=off.createLinearGradient(500,0,1060,330);
      const power=clamp(flash*amount*.2,0,.20);
      g.addColorStop(0,'rgba(208,232,255,0)');
      g.addColorStop(.55,`rgba(217,238,255,${power})`);
      g.addColorStop(1,'rgba(205,229,255,0)');
      off.fillStyle=g;off.fillRect(370,0,865,370);
      off.globalCompositeOperation='source-over';
    }
    off.globalCompositeOperation='destination-in';
    off.drawImage(this.mask,0,0,W,H);
    off.globalCompositeOperation='source-over';
    ctx.drawImage(this.buffer,0,0,W,H);
  }
}
