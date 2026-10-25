/** Night-storm lightning + time-varying storm gusts.
 * Frame-driven: no orphan timeouts, deterministic cancellation on weather/time changes.
 */
export const LIGHTNING_PULSES = [
  [0, 0], [.045, .24], [.105, .045], [.19, .17], [.27, .035], [.43, 0]
];
export function pulseAt(age) {
  for (let i = 1; i < LIGHTNING_PULSES.length; i++) {
    const [endTime, endPower] = LIGHTNING_PULSES[i];
    const [startTime, startPower] = LIGHTNING_PULSES[i - 1];
    if (age <= endTime) {
      const u = Math.max(0, (age - startTime) / (endTime - startTime));
      return startPower + (endPower - startPower) * u;
    }
  }
  return 0;
}
export function gustAt(t) {
  // A gentle baseline punctuated by slow, asynchronous gusts (no snapping).
  return Math.max(.85, Math.min(1.85,
    1.14 + .27 * Math.sin(t * .48) + .19 * Math.sin(t * 1.17 + 1.5)
      + .13 * Math.sin(t * .19 + 2.2)));
}
export class NightStorm {
  constructor({random=Math.random,onThunder=()=>{},onStrike=()=>{}}={}) {
    this.random=random;this.onThunder=onThunder;this.onStrike=onStrike;
    this.active=false;this.elapsed=0;this.next=0;this.flashAge=-1;
    this.thunderWait=-1;this.strikeCount=0;
  }
  schedule(first=false) {return (first ? 7 + this.random()*8 : 29 + this.random()*23);}
  stop() {
    this.active=false;this.elapsed=0;this.flashAge=-1;
    this.thunderWait=-1;this.next=0;
  }
  update(dt,stormNight){
    if (!stormNight) {if(this.active)this.stop();return {power:0,strike:false};}
    if (!this.active) {
      this.active=true;this.elapsed=0;this.next=this.schedule(true);
      this.flashAge=-1;this.thunderWait=-1;
    }
    const step=Math.max(0,Math.min(dt,.25));
    this.elapsed+=step;this.next-=step;
    let strike=false;
    if(this.next<=0){
      this.next=this.schedule();this.flashAge=0;
      this.thunderWait=1.2+this.random()*1.5;
      this.strikeCount++;strike=true;this.onStrike(this.strikeCount);
    }else if(this.flashAge>=0){this.flashAge+=step;}
    if(this.thunderWait>=0){
      this.thunderWait-=step;
      if(this.thunderWait<=0){this.thunderWait=-1;this.onThunder();}
    }
    return {power:Math.max(0,pulseAt(this.flashAge)),strike};
  }
}

/** Draw a sky-only lightning plate from the supplied aperture matte.
 * The room, LED, cat, fish and wall photos always remain on other layers.
 */
export class LightningPlate {
  constructor(canvas,maskUrl='/assets/layers/manual-window-render-matte.png'){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});
    this.ready=false;this.strikeCount=0;this.random=Math.random;
    this.mask=new Image();
    this.mask.onload=()=>{this.ready=true;this.paint(false);};
    this.mask.src=maskUrl;
  }
  paint(drawBolt=false){
    if(!this.ready)return;
    const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
    c.clearRect(0,0,w,h);
    // Very soft cloud glow, not a full-screen white flash.
    const g=c.createLinearGradient(0,10,0,395);
    g.addColorStop(0,'rgba(235,246,255,.97)');
    g.addColorStop(.70,'rgba(199,222,249,.64)');
    g.addColorStop(1,'rgba(182,204,241,.13)');
    c.fillStyle=g;c.fillRect(0,0,w,405);
    if(drawBolt){
      let x=760+this.random()*330,y=15;
      const points=[[x,y]];
      while(y<255){x+=this.random()*34-17;y+=19+this.random()*22;points.push([x,y]);}
      c.save();c.strokeStyle='rgba(248,252,255,.95)';
      c.shadowColor='rgba(193,222,255,.95)';c.shadowBlur=11;c.lineWidth=2.6;
      c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();
      // A short offset branch keeps the distant strike organic.
      if(points.length>5){const [bx,by]=points[4];
        c.lineWidth=1.15;c.beginPath();c.moveTo(bx,by);
        c.lineTo(bx-31,by+22);c.lineTo(bx-46,by+58);c.stroke();}
      c.restore();
    }
    c.globalCompositeOperation='destination-in';
    c.drawImage(this.mask,0,0,w,h);
    c.globalCompositeOperation='source-over';
  }
  strike(number){this.strikeCount=number;this.paint(number%3===0);}
  setPower(power,reducedMotion=false){
    this.canvas.style.opacity=String(reducedMotion?0:Math.min(.85,power*2.35));
  }
}
