import {sampleWaterCurrent} from './living-water.js';

/**
 * Alpha 08.5.3: rooted, per-row sprite bending, with NO generated substitute
 * sprites. Source canvas and planting anchors are in original 1536x1024 space.
 * Plant_01 uses its *actual full alpha extent* (y=399..566); the previous
 * animation mistakenly began at y=438 and missed the moving tips.
 * Both plant sprites animate with independent phases and locally repaired backgrounds.
 */
export const AQUATIC_PLANTS=Object.freeze([
  Object.freeze({id:'plant_01',src:'/assets/plants/plant_01.png',x:683,y:399,width:100,height:167,rootY:566,phase:.45,sway:24.0,enabled:true}),
  Object.freeze({id:'plant_02',src:'/assets/plants/plant_02.png',x:939,y:493,width:115,height:120,rootY:613,phase:2.1,sway:17.0,enabled:true}),
]);

/** Top moves, root does not. Public pure function to unit-test bending. */
export function plantSwayAt(spec,t,y,{reducedMotion=false,intensity=85}={}){
  if(reducedMotion||intensity<=0)return 0;
  const height=Math.max(1,spec.rootY-spec.y);
  const lift=Math.max(0,Math.min(1,(spec.rootY-y)/height));
  if(lift===0)return 0;
  const current=sampleWaterCurrent(spec.x+spec.width*.5,y,t);
  const wind=Math.sin(t*.87+spec.phase)*.73+Math.sin(t*.38+spec.phase*1.7)*.27;
  const turbulence=Math.sin(t*1.18+spec.phase*3.2+lift*1.7)*.16;
  return Math.pow(lift,1.52)*spec.sway*(wind+turbulence+current.x*.045)*(Math.min(100,Math.max(0,intensity))/85);
}

export class AquaticPlants{
  constructor(canvas,{imageFactory=()=>new Image()}={}){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.sprites=[];
    for(const spec of AQUATIC_PLANTS){
      // Animate only sprites with matching background-repair assets.
      if(!spec.enabled)continue;
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
  draw(t,{reducedMotion=false,preset='auto',intensity=85}={}){
    const ctx=this.ctx;
    ctx.clearRect(0,0,1536,1024);
    const step=preset==='eco'?4:2;
    for(const {spec,image,ready} of this.sprites){
      if(!ready)continue;
      const {x,y,width,height}=spec;
      ctx.save();
      // Keep every slice tied to the original planting position; leaves bend
      // continuously without translating their roots off the rock/coral.
      for(let py=y;py<y+height;py+=step){
        const stripHeight=Math.min(step,y+height-py);
        const displacement=plantSwayAt(spec,t,py+stripHeight*.5,{reducedMotion,intensity});
        ctx.drawImage(image,x,py,width,stripHeight,
          x+displacement,py,width,stripHeight);
      }
      ctx.restore();
    }
  }
}
