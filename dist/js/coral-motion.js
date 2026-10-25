import {sampleWaterCurrent} from './living-water.js';

/**
 * Alpha 08.5.5: coral clusters separated into independent full-canvas sprites.
 * They sway more subtly than the plants and stay anchored to their rocks.
 */
export const CORAL_LAYERS=Object.freeze([
  Object.freeze({id:'coral_01',src:'/assets/corals/coral_01.png',x:331,y:603,width:86,height:75,rootY:678,phase:.35,sway:5.4}),
  Object.freeze({id:'coral_02',src:'/assets/corals/coral_02.png',x:607,y:474,width:87,height:45,rootY:519,phase:1.1,sway:4.6}),
  Object.freeze({id:'coral_03',src:'/assets/corals/coral_03.png',x:1050,y:393,width:118,height:50,rootY:443,phase:2.2,sway:4.0}),
  Object.freeze({id:'coral_hide_01',src:'/assets/corals/coral_hide_01.png',x:1181,y:538,width:196,height:144,rootY:682,phase:2.95,sway:6.0}),
]);

export function coralSwayAt(spec,t,y,{reducedMotion=false,intensity=85}={}){
  if(reducedMotion||intensity<=0)return 0;
  const height=Math.max(1,spec.rootY-spec.y);
  const lift=Math.max(0,Math.min(1,(spec.rootY-y)/height));
  if(lift===0)return 0;
  const current=sampleWaterCurrent(spec.x+spec.width*.5,y,t);
  const wave=Math.sin(t*.74+spec.phase)*.72+Math.sin(t*1.19+spec.phase*1.9)*.28;
  const flutter=Math.sin(t*1.58+spec.phase*2.7+lift*2.4)*.12;
  const currentPush=current.x*.032;
  const strength=Math.min(100,Math.max(0,intensity))/85;
  return Math.pow(lift,1.36)*spec.sway*(wave+flutter+currentPush)*strength;
}

export class CoralMotion{
  constructor(canvas,{imageFactory=()=>new Image()}={}){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.sprites=[];
    for(const spec of CORAL_LAYERS){
      const image=imageFactory();
      const entry={spec,image,ready:false};
      const mark=()=>entry.ready=true;
      image.onload=mark;
      image.onerror=()=>entry.ready=false;
      image.src=spec.src;
      if(image.complete&&image.naturalWidth>0)mark();
      this.sprites.push(entry);
    }
  }
  /** Draw only the moving coral silhouette over a hiding animal.
   * Applied in the existing effects canvas, tightly clipped to that animal;
   * no duplicate full-frame sprite or extra z-index overlay is introduced.
   */
  drawOcclusion(ctx,t,id,x,y,width,height,{reducedMotion=false,preset='auto',intensity=85}={}){
    const entry=this.sprites.find(e=>e.spec.id===id&&e.ready);
    if(!entry)return;
    const {spec,image}=entry;
    ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
    const step=preset==='eco'?4:2;
    for(let py=spec.y;py<spec.y+spec.height;py+=step){
      const stripHeight=Math.min(step,spec.y+spec.height-py);
      const dx=coralSwayAt(spec,t,py+stripHeight*.5,{reducedMotion,intensity});
      ctx.drawImage(image,spec.x,py,spec.width,stripHeight,
        spec.x+dx,py,spec.width,stripHeight);
    }
    ctx.restore();
  }
  draw(t,{reducedMotion=false,preset='auto',intensity=85}={}){
    const ctx=this.ctx;
    ctx.clearRect(0,0,1536,1024);
    const step=preset==='eco'?4:2;
    for(const {spec,image,ready} of this.sprites){
      if(!ready)continue;
      const {x,y,width,height}=spec;
      ctx.save();
      for(let py=y;py<y+height;py+=step){
        const stripHeight=Math.min(step,y+height-py);
        const displacement=coralSwayAt(spec,t,py+stripHeight*.5,{reducedMotion,intensity});
        ctx.drawImage(image,x,py,width,stripHeight,
          x+displacement,py,width,stripHeight);
      }
      ctx.restore();
    }
  }
}
