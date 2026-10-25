/**
 * Living Light 08.8.1 — painted lamp at the far-left of the master illustration.
 * Static Canvas radial gradients are drawn ONCE. CSS opacity is the only
 * animated property, avoiding blur filters or full-screen redraws per frame.
 */
export const LAMP_GEOMETRY=Object.freeze({
  shade:{x:104,y:402},
  desk:{x:205,y:563},
  wall:{x:72,y:443},
  interactive:{left:0,top:304,right:229,bottom:559}
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** For realtime mode prefer the continuously interpolated night weight. */
export function lampStrength({on=true,intensity=75,time=0,weather=0,realtime=false,nightWeight=0}={}){
  const level=clamp(Number(intensity)||0,0,100)/100;
  if(!on||level===0)return Object.freeze({spill:0,art:0});
  const darkness=realtime
    ? clamp((Number(nightWeight)||0)*.68+(time===1?.39:0),0,1)
    : time===2?1:time===1?.48:0;
  const storm=weather===2?.13:0;
  // Keep lamp visible by day, but brighten room much more at night.
  const ambient=clamp(.34+.59*darkness+storm,.25,1);
  return {spill:clamp(level*ambient,0,1),art:clamp(level*(.15+.83*darkness+storm*.25),0,1)};
}

function paintRadial(ctx,{x,y,rx,ry,core,mid,edge=0,color}){
  ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
  const g=ctx.createRadialGradient(0,0,0,0,0,1);
  const rgb=color;
  g.addColorStop(0,`rgba(${rgb},${core})`);
  g.addColorStop(.32,`rgba(${rgb},${mid})`);
  g.addColorStop(.74,`rgba(${rgb},${edge})`);
  g.addColorStop(1,`rgba(${rgb},0)`);
  ctx.fillStyle=g;
  ctx.fillRect(-1,-1,2,2);
  ctx.restore();
}

export function paintLampLight(ctx){
  if(!ctx)return;
  ctx.clearRect(0,0,1536,1024);
  // Wide spill across the left wall and desk: no hard-edged fake light cone.
  paintRadial(ctx,{x:115,y:466,rx:440,ry:420,core:.16,mid:.09,edge:.015,color:'255,187,91'});
  paintRadial(ctx,{x:206,y:575,rx:430,ry:235,core:.33,mid:.18,edge:.019,color:'252,183,88'});
  paintRadial(ctx,{x:105,y:392,rx:235,ry:210,core:.46,mid:.19,edge:.01,color:'255,217,137'});
  paintRadial(ctx,{x:56,y:550,rx:190,ry:240,core:.12,mid:.06,edge:.01,color:'255,197,105'});
}

export class LivingLamp{
  constructor(canvas,app){
    this.canvas=canvas;this.app=app;
    this.ctx=canvas.getContext('2d');
    paintLampLight(this.ctx);
    this.current={spill:0,art:0};
  }
  sync(state){
    const next=lampStrength(state);
    this.canvas.style.opacity=next.spill.toFixed(3);
    this.app.style.setProperty('--lamp-art-alpha',next.art.toFixed(3));
    this.app.classList.toggle('lamp-powered',next.spill>0);
    this.current=next;
    return next;
  }
}
