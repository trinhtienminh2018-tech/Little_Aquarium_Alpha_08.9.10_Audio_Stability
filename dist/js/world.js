import {normalizePreset} from './render-budget.js';
export const W=1536,H=1024;
export const tank={left:256,right:1385,top:379,bottom:706};
export const WATER_BOUNDS=Object.freeze({
  left:tank.left+18,right:tank.right-18,top:tank.top+16,bottom:tank.bottom-16,
});
const width=WATER_BOUNDS.right-WATER_BOUNDS.left;
const height=WATER_BOUNDS.bottom-WATER_BOUNDS.top;

/** A slow, continuous recirculating field in illustration pixels / second.
 * Opposing motion near the surface and sand makes drifting particles coherent.
 * Pure and bounded so fish, pellets and decorations can sample the same field.
 */
export function sampleWaterCurrent(x,y,t=0){
  const nx=clamp((x-WATER_BOUNDS.left)/width,0,1);
  const ny=clamp((y-WATER_BOUNDS.top)/height,0,1);
  const phase=Number.isFinite(t)?t:0;
  const circulation=Math.sin(Math.PI*nx)*Math.cos(Math.PI*ny);
  const returnFlow=-Math.cos(Math.PI*nx)*Math.sin(Math.PI*ny);
  return {
    x:3.0*circulation+.55*Math.sin(phase*.19+nx*5.1+ny*3.6),
    y:1.5*returnFlow+.27*Math.cos(phase*.16+nx*3.7-ny*4.2),
  };
}

export const random=(a,b)=>a+Math.random()*(b-a);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const readSave=()=>{try{return JSON.parse(localStorage.getItem('aquarium2.settings'))||{};}catch{return {};}};
export class World {
 constructor(){const saved=readSave();this.weather=saved.weather??0;this.time=saved.time??0;this.realtime=saved.realtime!==false;this.renderQuality=normalizePreset(saved.renderQuality);this.waterVisibility=clamp(Number.isFinite(Number(saved.waterVisibility))?Number(saved.waterVisibility):70,0,100);this.glassRain=clamp(Number.isFinite(Number(saved.glassRain))?Number(saved.glassRain):85,0,100);this.windowLight=clamp(Number.isFinite(Number(saved.windowLight))?Number(saved.windowLight):85,0,100);this.plantMotion=clamp(Number.isFinite(Number(saved.plantMotion))?Number(saved.plantMotion):85,0,100);this.coralMotion=clamp(Number.isFinite(Number(saved.coralMotion))?Number(saved.coralMotion):80,0,100);this.lampOn=saved.lampOn!==false;this.lampIntensity=clamp(Number.isFinite(Number(saved.lampIntensity))?Number(saved.lampIntensity):75,0,100);this.ledOn=saved.ledOn!==false;this.ledIntensity=clamp(Number.isFinite(Number(saved.ledIntensity))?Number(saved.ledIntensity):85,0,100);this.windowOpen=!!saved.windowOpen;this.fishCount=saved.fishCount??18;this.speciesCounts=saved.speciesCounts??null;this.bottomCounts=saved.bottomCounts??null;this.volume=saved.volume??.6;this.water=saved.water??.28;this.nature=saved.nature??.22;this.music=saved.music??.8;this.audioOn=false;this.musicOn=true;this.piano=false;this.ambient=false;this.t=0;this.feed=[];this.lastFeed=null;this.listeners=new Set();}
 update(dt){this.t+=dt;for(let i=this.feed.length-1;i>=0;i--){const f=this.feed[i];const flow=sampleWaterCurrent(f.x,f.y,this.t);f.x=clamp(f.x+flow.x*dt*.55,WATER_BOUNDS.left,WATER_BOUNDS.right);f.y+=dt*(10+flow.y*.35);f.life-=dt;if(f.y>tank.bottom-10||f.life<=0)this.feed.splice(i,1);}}
 emit(){this.save();for(const fn of this.listeners)fn(this);}
 on(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 save(){localStorage.setItem('aquarium2.settings',JSON.stringify({weather:this.weather,time:this.time,realtime:this.realtime,renderQuality:this.renderQuality,waterVisibility:this.waterVisibility,plantMotion:this.plantMotion,glassRain:this.glassRain,windowLight:this.windowLight,coralMotion:this.coralMotion,lampOn:this.lampOn,lampIntensity:this.lampIntensity,ledOn:this.ledOn,ledIntensity:this.ledIntensity,windowOpen:this.windowOpen,fishCount:this.fishCount,speciesCounts:this.speciesCounts,bottomCounts:this.bottomCounts,volume:this.volume,water:this.water,nature:this.nature,music:this.music}));}
 addFood(x,y){this.lastFeed={x,y,t:this.t};for(let i=0;i<12;i++)this.feed.push({x:x+random(-22,22),y:y+random(-9,9),life:35});}
}
