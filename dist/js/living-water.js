import {clamp,WATER_BOUNDS,sampleWaterCurrent} from './world.js';
export {WATER_BOUNDS,sampleWaterCurrent} from './world.js';

// All coordinates use the unchanged 1536×1024 illustration grid. This water
// volume is inset from the glass/LED, so effects never tint the window or desk.
const TAU=Math.PI*2;
const r=(random,a,b)=>a+(b-a)*random();

const width=WATER_BOUNDS.right-WATER_BOUNDS.left;
const height=WATER_BOUNDS.bottom-WATER_BOUNDS.top;
const config={
  smooth:{bubbles:45,motes:135,beams:5,caustics:12},
  balanced:{bubbles:34,motes:98,beams:4,caustics:9},
  eco:{bubbles:19,motes:52,beams:2,caustics:5},
};
export function waterQuality(preset='auto',reducedMotion=false){
  if(reducedMotion)return {bubbles:12,motes:24,beams:2,caustics:3};
  return config[preset]||config.balanced;
}

export class LivingWater {
  constructor(random=Math.random){
    this.random=random;this.elapsed=0;
    this.bubbles=Array.from({length:config.smooth.bubbles},(_,i)=>this.makeBubble(i,true));
    this.motes=Array.from({length:config.smooth.motes},()=>({
      x:r(random,WATER_BOUNDS.left,WATER_BOUNDS.right),
      y:r(random,WATER_BOUNDS.top,WATER_BOUNDS.bottom),
      radius:r(random,.72,1.68),phase:r(random,0,TAU),
      drift:r(random,.65,1.15),depth:r(random,.55,1)
    }));
  }
  makeBubble(i,initial=false){
    // Bubbles start near stable aeration points, rather than spawning randomly
    // across the fish and foreground objects. The sources are deliberately subtle.
    const leftSource=i%3!==2;
    const sourceX=leftSource?475:1170;
    return {
      x:clamp(sourceX+r(this.random,-14,14),WATER_BOUNDS.left+4,WATER_BOUNDS.right-4),
      y:initial?r(this.random,WATER_BOUNDS.top,WATER_BOUNDS.bottom):WATER_BOUNDS.bottom-r(this.random,0,8),
      r:r(this.random,1.10,2.85),speed:r(this.random,18,34),
      phase:r(this.random,0,TAU),age:r(this.random,0,20),sourceX,
    };
  }
  update(dt,t=this.elapsed,{preset='auto',reducedMotion=false}={}){
    if(!Number.isFinite(dt)||dt<=0)return;
    const step=clamp(dt,0,.09);
    this.elapsed=Number.isFinite(t)?t:this.elapsed+step;
    const motion=reducedMotion?.28:1;
    const q=waterQuality(preset,reducedMotion);
    for(let i=0;i<q.bubbles;i++){
      const b=this.bubbles[i];b.age+=step;
      const current=sampleWaterCurrent(b.x,b.y,this.elapsed);
      b.x+=step*motion*(current.x*.7+Math.sin(b.age*1.5+b.phase)*2.1);
      b.y-=step*motion*(b.speed-current.y*.18);
      if(b.y<WATER_BOUNDS.top+2){Object.assign(b,this.makeBubble(i));}
      else b.x=clamp(b.x,WATER_BOUNDS.left+3,WATER_BOUNDS.right-3);
    }
    for(let i=0;i<q.motes;i++){
      const p=this.motes[i];
      const current=sampleWaterCurrent(p.x,p.y,this.elapsed);
      p.x+=step*motion*(current.x*p.drift*1.65+Math.sin(this.elapsed*.32+p.phase)*.46);
      p.y+=step*motion*(current.y*p.drift*1.65+Math.cos(this.elapsed*.29+p.phase)*.34);
      // Continuous recycling; no teleports through a fish or outside the glass.
      if(p.x>WATER_BOUNDS.right)p.x=WATER_BOUNDS.left+.5;
      if(p.x<WATER_BOUNDS.left)p.x=WATER_BOUNDS.right-.5;
      if(p.y>WATER_BOUNDS.bottom)p.y=WATER_BOUNDS.top+.5;
      if(p.y<WATER_BOUNDS.top)p.y=WATER_BOUNDS.bottom-.5;
    }
  }
  clip(ctx){ctx.beginPath();ctx.rect(WATER_BOUNDS.left,WATER_BOUNDS.top,width,height);ctx.clip();}
  // Player's slider maps to a predictable 0..1.43 multiplier. The default 70
  // represents the new calibrated rendering; zero hides all visual water FX.
  visibility(detail=70){return clamp(Number.isFinite(Number(detail))?Number(detail)/70:1,0,100/70);}
  /** Suspended particles behind fish: small, translucent flecks travelling with current. */
  drawBack(ctx,t,{preset='auto',reducedMotion=false,time=0,detail=70}={}){
    const q=waterQuality(preset,reducedMotion);const night=time===2;
    const strength=this.visibility(detail);
    ctx.save();this.clip(ctx);
    if(strength>0){
      for(let i=0;i<q.motes;i++){
        const p=this.motes[i];
        if((p.x>1240&&p.y>560)||(p.x<445&&p.y>646))continue;
        const flicker=.86+.14*Math.sin(t*.8+p.phase);
        const a=Math.min(.57,(night?.29:.27)*p.depth*flicker*strength);
        ctx.fillStyle=`rgba(${night?'169,225,239':'232,252,234'},${a})`;
        ctx.beginPath();ctx.arc(p.x,p.y,p.radius,0,TAU);ctx.fill();
        // Only a few large motes trail a hairline, suggesting water movement.
        // The trail is translucent and never becomes a rigid white line.
        if(i%11===0&&!reducedMotion){
          const v=sampleWaterCurrent(p.x,p.y,t);
          ctx.strokeStyle=`rgba(${night?'177,234,245':'239,255,233'},${a*.56})`;
          ctx.lineWidth=.7;
          ctx.beginPath();ctx.moveTo(p.x,p.y);
          ctx.lineTo(p.x-v.x*1.55,p.y-v.y*1.55);ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  /** Soft moving light projected through the water onto rock and planting. */
  drawLight(ctx,t,{preset='auto',reducedMotion=false,time=0,detail=70}={}){
    const q=waterQuality(preset,reducedMotion);const night=time===2;
    const pace=reducedMotion?.1:1,strength=this.visibility(detail);
    ctx.save();this.clip(ctx);
    if(strength>0){
      ctx.globalCompositeOperation='screen';
      for(let i=0;i<q.beams;i++){
        const center=WATER_BOUNDS.left+135+i*(width-270)/Math.max(1,q.beams-1)
          +Math.sin(t*.30*pace+i*1.4)*19;
        const grad=ctx.createLinearGradient(center-40,WATER_BOUNDS.top,center+35,WATER_BOUNDS.bottom);
        const alpha=Math.min(.20,(night?.078:.128)*strength);
        grad.addColorStop(0,`rgba(${night?'168,223,249':'255,250,215'},${alpha})`);
        grad.addColorStop(.50,`rgba(${night?'168,223,249':'255,250,215'},${alpha*.5})`);
        grad.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=grad;ctx.beginPath();
        ctx.moveTo(center-12,WATER_BOUNDS.top+2);
        ctx.lineTo(center+14,WATER_BOUNDS.top+2);
        ctx.lineTo(center+48,WATER_BOUNDS.bottom-16);
        ctx.lineTo(center-67,WATER_BOUNDS.bottom-16);
        ctx.closePath();ctx.fill();
      }
      // Broken wavy fragments, not long parallel bars across the glass.
      for(let i=0;i<q.caustics;i++){
        const x=WATER_BOUNDS.left+74+i*(width-150)/q.caustics
          +Math.sin(t*.52*pace+i*2.2)*19;
        const y=WATER_BOUNDS.bottom-43-(i%4)*17
          +Math.sin(t*.67*pace+i*.8)*4;
        if((x>1200&&y>553)||(x<445&&y>630))continue;
        const alpha=Math.min(.38,(night?.145:.21)*strength);
        ctx.strokeStyle=`rgba(${night?'175,233,255':'242,255,219'},${alpha})`;
        ctx.lineWidth=1.75+(i%3)*.45;
        ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(x-15,y+2);
        ctx.quadraticCurveTo(x,y-9,x+17,y-1);ctx.stroke();
      }
      // Sparse travelling ripples illustrate water circulation in the upper
      // half without overlaying one bright stripe across fish, mug or cat.
      const flowSegments=Math.max(1,Math.ceil(q.beams/2));
      for(let j=0;j<flowSegments;j++){
        const y=WATER_BOUNDS.top+64+j*61;
        for(let i=0;i<3;i++){
          const x=WATER_BOUNDS.left+115+i*(width-230)/2
            +Math.sin(t*.39*pace+j+i*.9)*28;
          const gradient=ctx.createLinearGradient(x-65,y,x+75,y);
          const alpha=(night?.10:.14)*strength;
          gradient.addColorStop(0,'rgba(227,255,248,0)');
          gradient.addColorStop(.5,`rgba(${night?'168,229,255':'236,255,238'},${alpha})`);
          gradient.addColorStop(1,'rgba(227,255,248,0)');
          ctx.strokeStyle=gradient;ctx.lineWidth=1.2;
          ctx.beginPath();ctx.moveTo(x-65,y);
          ctx.quadraticCurveTo(x,y-7+Math.sin(t*.55*pace+i)*4,x+75,y+2);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  drawFront(ctx,t,{preset='auto',reducedMotion=false,time=0,detail=70}={}){
    const q=waterQuality(preset,reducedMotion);const night=time===2;
    const strength=this.visibility(detail);
    ctx.save();this.clip(ctx);
    if(strength>0){
      const pace=reducedMotion?.06:1;
      for(let row=0;row<2;row++){
        ctx.strokeStyle=`rgba(${night?'180,234,255':'224,253,250'},${Math.min(.51,(night?.32:.36-row*.07)*strength)})`;
        ctx.lineWidth=row===0?1.45:1.1;
        ctx.beginPath();
        for(let x=WATER_BOUNDS.left;x<=WATER_BOUNDS.right;x+=12){
          const y=WATER_BOUNDS.top+4+row*5
            +Math.sin(x*.029+t*1.15*pace+row*1.7)*1.15
            +Math.sin(x*.061-t*.68*pace)*.65;
          if(x===WATER_BOUNDS.left)ctx.moveTo(x,y);else ctx.lineTo(x,y);
        }
        ctx.stroke();
      }
      for(let i=0;i<q.bubbles;i++){
        const b=this.bubbles[i];
        if((b.x>1240&&b.y>560)||(b.x<445&&b.y>646))continue;
        ctx.strokeStyle=`rgba(231,250,255,${Math.min(.69,(night?.44:.55)*strength)})`;
        ctx.lineWidth=.9;
        ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.stroke();
        ctx.strokeStyle=`rgba(250,255,255,${Math.min(.55,(night?.30:.36)*strength)})`;
        ctx.beginPath();ctx.arc(b.x-.3,b.y-.25,b.r*.67,Math.PI*.92,Math.PI*1.43);ctx.stroke();
      }
    }
    ctx.restore();
  }
}
