/** Alpha 08.8.2 — independent aquarium lighting. No additional moving full-room sprite. */
import {WATER_BOUNDS,clamp} from './world.js';

const W=1536,H=1024;
export const LED_HIT=Object.freeze({left:390,top:267,width:850,height:34});

/** Appearance belongs to electric LED state, independent of desk lamp/window. */
export function ledLevels({on=true,intensity=85,time=0,weather=0,realtime=false,nightWeight=0}={}){
  const power=on?clamp(Number(intensity)||0,0,100)/100:0;
  const darkness=realtime?clamp(Number(nightWeight)||0,0,1):time===2?1:time===1?.40:0;
  const storm=weather===2?.12:0;
  // The 0..100 slider does not simulate a lamp by painting a mask.
  // Off = genuine off sprite; low = dim sprite layered over off; high =
  // original bright sprite layered over dim. In the overlap bands a full
  // backing sprite remains opaque, so the baked-on room LED cannot leak out.
  let off=0,dim=0,bright=0;
  if(power<=0){off=1;}
  else if(power<=.4){off=1;dim=clamp(power/.4,0,1);}
  else if(power<=.7){dim=1;bright=clamp((power-.4)/.3,0,1);}
  else {bright=1;dim=clamp((1-power)/.3,0,1);}
  return {
    power,off,dim,bright,
    spill:clamp(power*(.50+.40*darkness+storm),0,1),
    nightArt:clamp(power*darkness,0,1),
    fishReflection:clamp(power*(.45+.38*darkness+storm*.4),0,1),
  };
}

function ellipseLight(c,{x,y,rx,ry,rgba,core,mid,edge=0}){
  c.save();c.translate(x,y);c.scale(rx,ry);
  const g=c.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,`rgba(${rgba},${core})`);
  g.addColorStop(.42,`rgba(${rgba},${mid})`);
  g.addColorStop(.79,`rgba(${rgba},${edge})`);
  g.addColorStop(1,`rgba(${rgba},0)`);
  c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
}

/** Static geometry, rendered once; the dynamic state changes CSS opacity only. */
export function paintAquariumLedSpill(c){
  c.clearRect(0,0,W,H);
  c.save();
  const b=WATER_BOUNDS;
  c.beginPath();c.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);c.clip();
  // Localized within water: avoids window, table, glass edge and Miu.
  ellipseLight(c,{x:778,y:424,rx:560,ry:216,rgba:'139,217,255',core:.27,mid:.13,edge:.015});
  ellipseLight(c,{x:514,y:528,rx:300,ry:235,rgba:'109,198,240',core:.15,mid:.08});
  ellipseLight(c,{x:1055,y:548,rx:336,ry:229,rgba:'139,230,255',core:.15,mid:.055});
  ellipseLight(c,{x:804,y:652,rx:410,ry:93,rgba:'205,249,238',core:.10,mid:.035});
  c.restore();
}

/** Small real-time highlight on fish and suspended motes, clipped by renderer. */
export function paintAquariumFishReflection(c,{strength=0,time=0,quality='auto'}={}){
  if(strength<=0)return;
  c.save();
  c.globalCompositeOperation='screen';
  const b=WATER_BOUNDS;
  c.beginPath();c.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);c.clip();
  const shimmer=quality==='eco'?0:Math.sin(time*.85)*.012;
  const g=c.createLinearGradient(0,b.top,0,b.bottom);
  g.addColorStop(0,`rgba(125,218,255,${(.078+shimmer)*strength})`);
  g.addColorStop(.45,`rgba(157,227,252,${.045*strength})`);
  g.addColorStop(1,'rgba(147,212,244,0)');
  c.fillStyle=g;c.fillRect(b.left,b.top,b.right-b.left,b.bottom-b.top);
  c.restore();
}

export class AquariumLed{
  constructor(canvas,app){
    this.canvas=canvas;
    this.app=app;
    paintAquariumLedSpill(canvas.getContext('2d'));
    this.current=ledLevels();
  }
  sync(state){
    const v=ledLevels(state);
    this.canvas.style.opacity=v.spill.toFixed(3);
    this.app.style.setProperty('--led-off-opacity',v.off.toFixed(3));
    this.app.style.setProperty('--led-dim-opacity',v.dim.toFixed(3));
    this.app.style.setProperty('--led-on-opacity',v.bright.toFixed(3));
    this.app.style.setProperty('--led-on-bright',(.80+.20*v.power).toFixed(3));
    this.app.style.setProperty('--led-night-art',v.nightArt.toFixed(3));
    this.app.classList.toggle('led-powered',v.power>0);
    this.current=v;
    return v;
  }
}
