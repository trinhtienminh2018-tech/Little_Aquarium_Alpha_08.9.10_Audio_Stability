import {random} from './world.js';
import {gustAt} from './storm-life.js';
/** Rain is clipped by aperture AND the artwork that actually covers the glass.
 * This prevents rain streaks crossing the LED, wood, leaves or aquarium.
 */
export class WindowSystem {
  constructor(world){
    this.world=world;
    this.openMask=new Image();
    this.closedMask=new Image();
    this.readyOpen=false; this.readyClosed=false;
    this.openMask.onload=()=>{this.readyOpen=true;};
    this.closedMask.onload=()=>{this.readyClosed=true;};
    this.openMask.src='/assets/layers/manual-weather-open-mask.png';
    this.closedMask.src='/assets/layers/manual-weather-closed-mask.png';
    this.buffer=document.createElement('canvas');
    this.buffer.width=1536;this.buffer.height=1024;
    this.off=this.buffer.getContext('2d');
    this.drops=Array.from({length:120},()=>({x:random(370,1220),y:random(43,355),v:random(130,220)}));
  }
  draw(c,t,dt){
    const isOpen=this.world.windowOpen;
    if(this.world.weather!==2 || !(isOpen?this.readyOpen:this.readyClosed))return;
    const off=this.off;
    const gust=gustAt(t);
    off.clearRect(0,0,1536,1024);
    off.strokeStyle='rgba(215,233,247,.46)';off.lineWidth=1.2;
    for(const d of this.drops){
      d.y+=dt*d.v*(.88+.10*gust);
      d.x-=dt*(24+gust*15);
      if(d.y>357||d.x<340){d.y=43;d.x=random(400,1220);}
      off.beginPath();off.moveTo(d.x,d.y);off.lineTo(d.x-5-gust*3,d.y+12);off.stroke();
    }
    off.globalCompositeOperation='destination-in';
    off.drawImage(isOpen?this.openMask:this.closedMask,0,0);
    off.globalCompositeOperation='source-over';
    c.drawImage(this.buffer,0,0);
  }
}
