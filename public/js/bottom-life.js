/** Little Aquarium Alpha 08.5.4 — Bottom Life 2.0.
 * Small, independent state machines for crabs, shrimp, and snails.
 * All geometry remains in the original 1536x1024 illustration coordinate system.
 * Rocks/shelters are approximate painted landmarks, not collision polygons.
 * No new sprite artwork is created or required by this release.
 */
import {clamp,random,tank} from './world.js';
import {CRAB_CORAL,crabCoralLift} from './coral-habitat.js';

const NIGHT_FACTOR=.74;
const CRAB_ZONES=Object.freeze([
  Object.freeze({minX:560,maxX:870,y:676,shelter:710}),
  Object.freeze({minX:1035,maxX:1314,y:675,shelter:1120}),
]);
const SHRIMP_ZONES=Object.freeze([
  Object.freeze({minX:440,maxX:596,y:647,shelter:474}),
  Object.freeze({minX:704,maxX:868,y:665,shelter:798}),
  Object.freeze({minX:1014,maxX:1178,y:653,shelter:1082}),
  Object.freeze({minX:1192,maxX:1316,y:650,shelter:1246}),
]);
const SNAIL_ZONES=Object.freeze([
  Object.freeze({surface:'left-glass',x:295,minY:468,maxY:622}),
  Object.freeze({surface:'right-glass',x:1355,minY:478,maxY:640}),
  Object.freeze({surface:'rock',minX:778,maxX:945,y:643}),
]);
export const BOTTOM_ROSTER=Object.freeze({crabs:2,shrimps:4,snails:3});
export const BOTTOM_LIMITS=Object.freeze({crabs:5,shrimps:10,snails:8});
export const BOTTOM_BOUNDS=Object.freeze({
  x1:tank.left+30,x2:tank.right-23,
  y1:tank.top+65,y2:tank.bottom-15,
});
const tick=(v,dt)=>Math.max(0,(v||0)-dt);
const within=(x,z,margin=0)=>clamp(x,z.minX+margin,z.maxX-margin);
const towards=(distance,old=1)=>Math.abs(distance)<.2?old:Math.sign(distance);
const finite=(v,otherwise=0)=>Number.isFinite(v)?v:otherwise;

/** Keep social animals a few pixels apart without teleporting or leaving their lane. */
export function neighborPush(entity,neighbors,radius=34){
  let force=0;
  for(const other of neighbors){
    if(other===entity||other.zone!==entity.zone)continue;
    const dx=entity.x-other.x,dist=Math.abs(dx);
    if(dist>=radius)continue;
    const sign=dist<.01?(entity.id<other.id?-1:1):Math.sign(dx);
    force+=sign*(1-dist/radius);
  }
  return clamp(force,-1,1);
}

/** Soft silhouettes of the painted stones; preserve a rooted, grounded gait. */
export function crabRockHeight(x,zone){
  const distance=Math.abs(x-zone.shelter);
  const u=Math.max(0,1-distance/65);
  return 11*u*u*(3-2*u);
}

export class BottomLife{
  constructor(world){
    this.world=world;
    this.nextId=1;
    this.crabs=[];this.shrimps=[];this.snails=[];
    this.setCounts(world.bottomCounts??BOTTOM_ROSTER);
  }
  makeCrab(i){
    const zone=CRAB_ZONES[i%CRAB_ZONES.length];
    const x=i<2?(i?1212:632):random(zone.minX+34,zone.maxX-34);
    return {
      id:`crab-${this.nextId++}`,type:'crab',zone,x,y:zone.y,
      dir:i%2?-1:1,state:'patrol',timer:random(2,4),
      scareCooldown:0,forageCooldown:0,phase:random(0,Math.PI*2),
      walk:0,size:i%2?1.1:1.2,opacity:1,target:zone.shelter,depth:'front',
      claw:0,forage:0,rockHeight:0,coralHeight:0,coralBlend:0,coralClock:random(6,13),coralCooldown:0,
    };
  }
  makeShrimp(i){
    const zone=SHRIMP_ZONES[i%SHRIMP_ZONES.length];
    const x=i<4?(zone.minX+zone.maxX)/2+(i%2?-18:18):random(zone.minX+16,zone.maxX-16);
    return {
      id:`shrimp-${this.nextId++}`,type:'shrimp',zone,x,y:zone.y,
      dir:i%2?-1:1,state:'crawl',timer:random(2.2,5.0),
      phase:random(0,Math.PI*2),stride:0,size:1.05+(i%2)*.1,
      target:zone.shelter,depth:i%2?'back':'front',
      scareCooldown:0,forageCooldown:0,dartClock:0,dartDuration:.64,
      dartLift:0,graze:0,
    };
  }
  makeSnail(i){
    const zone=SNAIL_ZONES[i%SNAIL_ZONES.length];
    const x=zone.surface==='rock'?random(zone.minX+10,zone.maxX-10):zone.x;
    const y=zone.surface==='rock'?zone.y:random(zone.minY+12,zone.maxY-12);
    return {
      id:`snail-${this.nextId++}`,type:'snail',zone,surface:zone.surface,
      x,y,dir:i%2?-1:1,state:'creep',timer:random(9,16),
      phase:random(0,Math.PI*2),size:zone.surface==='rock'?1.05:.95,
      depth:zone.surface==='rock'?'back':'front',trail:0,
    };
  }
  setCounts(requested){
    for(const key of Object.keys(BOTTOM_LIMITS)){
      const value=Math.trunc(finite(Number(requested?.[key])));
      const count=clamp(value,0,BOTTOM_LIMITS[key]);
      const group=this[key];
      if(group.length>count)group.length=count;
      while(group.length<count){
        const index=group.length;
        group.push(key==='crabs'?this.makeCrab(index):key==='shrimps'?this.makeShrimp(index):this.makeSnail(index));
      }
    }
    this.world.bottomCounts=this.counts();
  }
  /** Crumbs already in the water take priority over an approximate scent point. */
  foodSignalFor(zone,range=160){
    const pellets=this.world.feed??[];
    let selected=null,best=Infinity;
    for(const pellet of pellets){
      if(!Number.isFinite(pellet.x)||!Number.isFinite(pellet.y)||pellet.y<590)continue;
      const d=Math.abs(pellet.x-zone.shelter);
      if(d<best&&pellet.x>=zone.minX-range&&pellet.x<=zone.maxX+range){selected=pellet;best=d;}
    }
    if(selected)return selected;
    const signal=this.world.lastFeed;
    if(!signal||!Number.isFinite(signal.x)||!Number.isFinite(signal.t))return null;
    const age=this.world.t-signal.t;
    if(age<0||age>22||signal.x<zone.minX-range||signal.x>zone.maxX+range)return null;
    return signal;
  }
  fishThreat(entity,fish,radius=60){
    if(!fish?.length)return false;
    return fish.some(f=>f.size>=15&&Math.abs(f.x-entity.x)<radius&&Math.abs(f.y-entity.y)<56);
  }
  /** One grounded animal can pick up a settled pellet; preserve fish feeding otherwise. */
  takePellet(entity,radius=14){
    const pellets=this.world.feed;
    if(!Array.isArray(pellets))return false;
    const index=pellets.findIndex(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)
      &&p.y>=entity.y-32&&Math.abs(p.x-entity.x)<radius&&Math.abs(p.y-entity.y)<32);
    if(index<0)return false;
    pellets.splice(index,1);
    return true;
  }
  updateCrab(c,dt,fish,night){
    const z=c.zone;
    c.timer=tick(c.timer,dt);
    c.scareCooldown=tick(c.scareCooldown,dt);
    c.forageCooldown=tick(c.forageCooldown,dt);
    c.forage=Math.max(0,(c.forage||0)-dt);
    c.coralClock=tick(c.coralClock,dt);
    c.coralCooldown=tick(c.coralCooldown,dt);
    const feed=this.foodSignalFor(z,95);
    // Only the right-hand habitat has a coral base low enough for climbing.
    // The left crab keeps its existing rock patrol; never teleports to coral.
    if(z===CRAB_ZONES[1]&&c.coralClock<=0&&c.coralCooldown<=0
       &&!feed&&!['hide','investigate','graze','coral-climb','coral-hide'].includes(c.state)){
      c.state='coral-climb';c.target=CRAB_CORAL.x;
      c.timer=8;c.coralClock=random(16,27);
    }
    if(c.state==='coral-climb'&&Math.abs(c.x-CRAB_CORAL.x)<13){
      c.state='coral-hide';c.timer=random(2.5,4.0);c.coralCooldown=16;
    }
    if(c.scareCooldown<=0&&c.state!=='hide'&&this.fishThreat(c,fish,66)){
      c.state='hide';c.timer=3.2;c.target=z.shelter;c.scareCooldown=9;
    }else if(feed&&c.scareCooldown<=0&&c.forageCooldown<=0
      &&!['hide','investigate','graze'].includes(c.state)){
      c.state='investigate';c.target=within(feed.x,z,20);c.timer=6.0;
      c.forageCooldown=14;
    }
    if(c.state==='investigate'&&Math.abs(c.target-c.x)<10){
      c.state='graze';c.timer=random(1.5,2.6);c.forage=c.timer;
      this.takePellet(c,18);
    }
    if(c.timer<=0){
      if(c.state==='hide'||c.state==='graze'||c.state==='investigate'||c.state==='coral-hide'){
        c.state='rest';c.timer=random(1.2,2.6);
      }else if(c.state==='rest'||c.state==='probe'){
        c.state='patrol';c.target=random(z.minX+26,z.maxX-26);c.timer=random(4,7);
      }else if(c.state==='patrol'){
        c.state='probe';c.timer=random(.7,1.6);
      }else{c.state='rest';c.timer=random(1,2);}
    }
    const speed=c.state==='hide'?29:c.state==='coral-climb'?23:c.state==='investigate'?20:c.state==='patrol'?13:0;
    const desired=towards(c.target-c.x,c.dir);
    if(speed&&Math.abs(c.target-c.x)>2){
      const step=Math.min(Math.abs(c.target-c.x),speed*(night?NIGHT_FACTOR:1)*dt);
      c.x=within(c.x+desired*step,z,18);c.dir=desired;
      c.walk+=dt*9*(night?.77:1);
    }
    // Yield to another crab in the same patch rather than passing through it.
    c.x=within(c.x+neighborPush(c,this.crabs,43)*dt*18,z,20);
    c.rockHeight=crabRockHeight(c.x,z);
    const climbing=z===CRAB_ZONES[1]&&['coral-climb','coral-hide'].includes(c.state);
    c.coralBlend=clamp((c.coralBlend||0)+(climbing?1:-1)*dt*1.4,0,1);
    c.coralHeight=crabCoralLift(c.x)*c.coralBlend;
    c.y=z.y-c.rockHeight-c.coralHeight+(speed?.65*Math.sin(c.walk+c.phase):0);
    c.claw+=dt*(c.state==='graze'||c.state==='probe'?6:1.3);
    c.opacity=(c.state==='hide'&&Math.abs(c.x-z.shelter)<25)||c.state==='coral-hide'?.77:1;
    c.x=clamp(c.x,BOTTOM_BOUNDS.x1+28,BOTTOM_BOUNDS.x2-28);
    c.y=clamp(c.y,625,690);
  }
  updateShrimp(s,dt,fish,night){
    const z=s.zone;
    s.timer=tick(s.timer,dt);
    s.scareCooldown=tick(s.scareCooldown,dt);
    s.forageCooldown=tick(s.forageCooldown,dt);
    s.graze=Math.max(0,(s.graze||0)-dt);
    if(s.state!=='dart'&&s.scareCooldown<=0&&this.fishThreat(s,fish,52)){
      s.state='dart';s.dartDuration=.58;s.dartClock=0;
      s.timer=s.dartDuration;s.scareCooldown=7;
      s.target=within(s.x-s.dir*random(28,58),z,16);
    }else if(!['dart','forage','graze'].includes(s.state)&&s.forageCooldown<=0){
      const feed=this.foodSignalFor(z,65);
      if(feed){s.state='forage';s.timer=5;s.target=within(feed.x,z,12);s.forageCooldown=10;}
    }
    if(s.state==='dart'){
      s.dartClock=Math.min(s.dartDuration,s.dartClock+dt);
      const portion=s.dartClock/s.dartDuration;
      s.dartLift=23*Math.sin(Math.PI*portion); // arc returns to rock/sand, not a teleport
      if(s.dartClock>=s.dartDuration){s.state='pause';s.timer=random(.55,1.15);s.dartLift=0;}
    }else s.dartLift=0;
    if(s.state==='forage'&&Math.abs(s.target-s.x)<7){
      s.state='graze';s.timer=random(1.1,2.2);s.graze=s.timer;
      this.takePellet(s,13);
    }
    if(s.timer<=0){
      if(s.state==='graze'||s.state==='forage'){s.state='pause';s.timer=random(.8,1.4);}
      else if(s.state==='pause'){s.state='crawl';s.timer=random(2.8,5.2);s.target=random(z.minX+14,z.maxX-14);}
      else if(s.state==='crawl'){s.state='graze';s.timer=random(1.3,2.4);s.graze=s.timer;}
      else{s.state='pause';s.timer=random(.8,1.3);}
    }
    const speed=s.state==='dart'?84:s.state==='forage'?17:s.state==='crawl'?9:0;
    const dx=s.target-s.x,dir=towards(dx,s.dir);
    if(speed&&Math.abs(dx)>1){
      const step=Math.min(Math.abs(dx),speed*(night?.82:1)*dt);
      s.x=within(s.x+dir*step,z,12);s.dir=dir;
      s.stride+=dt*(s.state==='dart'?24:9);
    }
    s.x=within(s.x+neighborPush(s,this.shrimps,24)*dt*9,z,12);
    s.y=z.y+(speed?.65*Math.sin(s.stride*.7+s.phase):0)-s.dartLift;
    s.x=clamp(s.x,BOTTOM_BOUNDS.x1+18,BOTTOM_BOUNDS.x2-18);
    s.y=clamp(s.y,605,674);
  }
  updateSnail(s,dt,night){
    const z=s.zone;
    s.timer=tick(s.timer,dt);
    if(s.timer<=0){
      s.state=s.state==='rest'?'creep':'rest';
      s.timer=s.state==='rest'?random(3.5,7.5):random(9,17);
    }
    if(s.state!=='rest'){
      const step=(night?.65:1)*dt*(s.surface==='rock'?1.3:1.05);
      if(s.surface==='rock'){
        s.x+=s.dir*step;
        if(s.x>=z.maxX-8){s.x=z.maxX-8;s.dir=-1;s.state='rest';s.timer=2;}
        if(s.x<=z.minX+8){s.x=z.minX+8;s.dir=1;s.state='rest';s.timer=2;}
      }else{
        s.y+=s.dir*step;
        if(s.y>=z.maxY){s.y=z.maxY;s.dir=-1;s.state='rest';s.timer=3;}
        if(s.y<=z.minY){s.y=z.minY;s.dir=1;s.state='rest';s.timer=3;}
      }
      s.trail+=step;
    }
    if(s.surface==='rock')s.y=z.y+Math.sin((s.x-z.minX)*.052)*2.5;
    else s.x=z.x+Math.sin(s.y*.036+s.phase)*1.0;
    s.x=clamp(s.x,BOTTOM_BOUNDS.x1+4,BOTTOM_BOUNDS.x2-5);
    s.y=clamp(s.y,BOTTOM_BOUNDS.y1,BOTTOM_BOUNDS.y2);
  }
  update(dt,fish=[]){
    dt=clamp(Number.isFinite(dt)?dt:0,0,.04);
    const night=this.world.time===2;
    for(const c of this.crabs)this.updateCrab(c,dt,fish,night);
    for(const s of this.shrimps)this.updateShrimp(s,dt,fish,night);
    for(const s of this.snails)this.updateSnail(s,dt,night);
  }
  byDepth(depth){return [...this.crabs,...this.shrimps,...this.snails].filter(e=>e.depth===depth);}
  counts(){return {crabs:this.crabs.length,shrimps:this.shrimps.length,snails:this.snails.length};}
}
