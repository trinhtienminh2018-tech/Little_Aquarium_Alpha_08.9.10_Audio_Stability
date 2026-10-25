import { tank, random, clamp, sampleWaterCurrent } from './world.js';
import { SPECIES, SPECIES_KEYS } from './fish-species.js';
import {CORAL_SHELTERS,selectFishShelter,nearShelter} from './coral-habitat.js';

const V=(x=0,y=0)=>({x,y});
const magnitude=(x,y)=>Math.hypot(x,y);
const margin={x:43,y:39};
const water={x1:tank.left+margin.x,x2:tank.right-margin.x,y1:tank.top+margin.y,y2:tank.bottom-margin.y};
const ROCKS=[
  {x:660,y:579,rx:169,ry:78},
  {x:1188,y:570,rx:183,ry:78},
  {x:381,y:622,rx:80,ry:56},
];
const LANES={
  chromis:[435,552],clown:[439,597],yellow:[432,567],blue:[438,581],goby:[626,653]
};
const MAX_FISH=35;
/** Illustration-space simulation: 1536×1024. No new art or sprite dependencies. */
export class FishLife {
  constructor(world){
    this.world=world;this.fish=[];this.nextId=1;
    this.schoolGoal=V(730,480);this.schoolClock=0;
    if(world.speciesCounts&&typeof world.speciesCounts==='object')this.setSpeciesCounts(world.speciesCounts);
    else this.setCount(world.fishCount);
  }
  pickSpecies(){
    const p=Math.random();let sum=0;
    for(const key of SPECIES_KEYS){sum+=SPECIES[key].weight;if(p<sum)return SPECIES[key];}
    return SPECIES.chromis;
  }
  randomGoal(species,fish=null){
    const lane=LANES[species.id]||[water.y1+12,water.y2-30];
    const nearby=fish&&species.behavior==='cruise'&&Math.random()<.67;
    const x=nearby?clamp(fish.homeX+random(-205,205),water.x1+18,water.x2-18)
       :random(water.x1+18,water.x2-18);
    return V(x,random(...lane));
  }
  spawn(kind){
    const sp=SPECIES[kind]||this.pickSpecies();
    const depth=sp.depth[Math.floor(Math.random()*sp.depth.length)];
    const x=random(water.x1+26,water.x2-26);
    const lane=LANES[sp.id]||[435,580];
    const y=random(...lane),direction=Math.random()<.5?-1:1;
    const baseSize=random(...sp.size);
    const fish={
      id:this.nextId++,species:sp.id,behavior:sp.behavior,depth,x,y,homeX:x,
      vx:sp.speed*direction*.65,vy:random(-2,2),facing:direction,lastDir:direction,
      goal:null,timer:random(1.4,4.4),rest:0,restClock:random(5,13),
      forageCooldown:0,nibbleTimer:0,foodTarget:null,feeding:0,
      phase:random(0,Math.PI*2),size:baseSize,
      opacity:depth==='back'?.72:depth==='mid'?.92:1,
      scale:depth==='back'?.72:depth==='mid'?.93:1,
      color:sp.colors[Math.floor(Math.random()*sp.colors.length)],
      state:sp.behavior==='school'?'schooling':'roam',tail:0,
      shelter:null,shelterPhase:'none',shelterClock:random(1.5,7),
      shelterStay:0,shelterCooldown:0,
    };
    fish.goal=this.randomGoal(sp,fish);
    return fish;
  }
  weightedCounts(total){
    const prior=this.counts(),sum=prior.reduce((v,item)=>v+item.count,0);
    const weights=SPECIES_KEYS.map((key,i)=>sum?prior[i].count/sum:SPECIES[key].weight);
    const raw=weights.map(w=>w*total),result=raw.map(Math.floor);
    const remain=total-result.reduce((a,b)=>a+b,0);
    const order=SPECIES_KEYS.map((_,i)=>i).sort((a,b)=>(raw[b]-result[b])-(raw[a]-result[a]));
    for(let j=0;j<remain;j++)result[order[j%order.length]]++;
    return Object.fromEntries(SPECIES_KEYS.map((key,i)=>[key,result[i]]));
  }
  setCount(n){
    const val=Number(n);
    this.setSpeciesCounts(this.weightedCounts(Math.round(clamp(Number.isFinite(val)?val:0,0,MAX_FISH))));
  }
  setSpeciesCounts(incoming){
    const safe=Object.fromEntries(SPECIES_KEYS.map(k=>[k,clamp(Math.trunc(Number(incoming?.[k])||0),0,MAX_FISH)]));
    let slots=MAX_FISH;
    for(const key of SPECIES_KEYS){safe[key]=Math.min(slots,safe[key]);slots-=safe[key];}
    for(const key of SPECIES_KEYS){
      const current=this.fish.filter(f=>f.species===key);
      while(current.length>safe[key]){
        const fish=current.pop();this.fish.splice(this.fish.indexOf(fish),1);
      }
      while(current.length<safe[key]){
        const fish=this.spawn(key);this.fish.push(fish);current.push(fish);
      }
    }
    this.world.fishCount=this.fish.length;
    this.world.speciesCounts=Object.fromEntries(SPECIES_KEYS.map(k=>[k,this.fish.filter(f=>f.species===k).length]));
  }
  /** Persist one crumb target to avoid changing direction every frame. */
  pickFood(f){
    if(f.behavior==='bottom'||f.forageCooldown>0)return null;
    if(f.foodTarget&&this.world.feed.includes(f.foodTarget))return f.foodTarget;
    f.foodTarget=null;
    let closest=null,best=275*275;
    for(const pellet of this.world.feed){
      if(!Number.isFinite(pellet.x)||!Number.isFinite(pellet.y))continue;
      const dx=pellet.x-f.x,dy=pellet.y-f.y;
      const ds=dx*dx+dy*dy;
      if(ds<best){best=ds;closest=pellet;}
    }
    f.foodTarget=closest;
    return closest;
  }
  /** Steering uses acceleration, not teleportation or instant velocity flips. */
  steer(f,dt,neighbors){
    const sp=SPECIES[f.species];
    const night=this.world.time===2;
    const bottom=f.behavior==='bottom',school=f.behavior==='school';
    f.timer-=dt;
    f.restClock-=dt;
    f.rest=Math.max(0,f.rest-dt);
    f.forageCooldown=Math.max(0,f.forageCooldown-dt);
    f.nibbleTimer=Math.max(0,f.nibbleTimer-dt);
    f.shelterCooldown=Math.max(0,(f.shelterCooldown||0)-dt);
    f.shelterClock-=dt;
    if(f.timer<=0){
      if(f.shelterPhase==='none')f.goal=this.randomGoal(sp,f);
      f.timer=random(bottom?2.8:3.8,bottom?5.8:8.5);
    }
    // Per-species resting: gobies pause on sand; cruisers hover occasionally.
    // Schooling fish never stop abruptly in the middle of the group.
    if(f.restClock<=0&&f.shelterPhase==='none'){
      f.restClock=random(bottom?4.5:8.0,bottom?9.0:17.0);
      if(bottom)f.rest=random(1.5,3.4)*(night?1.4:1);
      else if(!school)f.rest=random(.65,1.8)*(night?1.55:1);
    }
    // Coral visits are spontaneous and bounded. Food remains a higher priority.
    // Different clownfish pick either the right foreground hide or central coral.
    if(f.species==='clown'&&f.shelterPhase==='none'&&f.shelterClock<=0
       &&f.shelterCooldown<=0&&f.forageCooldown<=0&&this.world.feed.length===0){
      const candidate=selectFishShelter(f);
      if(candidate){
        f.shelter=candidate;
        f.shelterPhase='approach';
        f.rest=0;
        f.timer=9;
        f.goal=V(candidate.x,candidate.y);
      }else f.shelterClock=random(3,6);
    }
    if(f.shelterPhase==='approach'&&nearShelter(f,f.shelter,22)){
      f.shelterPhase='hide';
      f.shelterStay=random(2.5,5.5);
    }
    if(f.shelterPhase==='hide'){
      f.shelterStay-=dt;
      if(f.shelterStay<=0){
        f.shelterPhase='none';f.shelter=null;
        f.shelterCooldown=random(12,22);
        f.shelterClock=random(8,16);
        f.goal=this.randomGoal(sp,f);
      }
    }
    let ax=0,ay=0;
    const target=f.goal||V(f.x,f.y);
    const gx=target.x-f.x,gy=(target.y-f.y)*(bottom?.36:1);
    const goalD=magnitude(gx,gy);
    if(goalD>1){
      const scale=Math.min(1,goalD/55)*sp.turn/goalD;
      ax+=gx*scale*(school?.37:1);ay+=gy*scale*(school?.37:1);
    }
    // Pairwise short-range separation for ALL fish (including mixed species).
    // School cohesion is restricted to the same species and a larger radius.
    let cx=0,cy=0,avx=0,avy=0,schoolN=0;
    for(const other of neighbors){
      if(other===f)continue;
      const dx=f.x-other.x,dy=f.y-other.y;
      const dist2=dx*dx+dy*dy;
      if(dist2>205*205)continue;
      const dist=Math.sqrt(dist2);
      const minGap=(f.size*f.scale+other.size*other.scale)*1.55+(school?9:12);
      if(dist<minGap){
        const push=(minGap-dist)/minGap;
        // Resolve even identical positions without an unstable division by 0.
        const nx=dist>.01?dx/dist:(f.id<other.id?-1:1);
        const ny=dist>.01?dy/dist:0;
        ax+=nx*sp.turn*2.3*push;
        ay+=ny*sp.turn*2.3*push;
      }
      if(school&&other.species===f.species&&dist<182){
        cx+=other.x;cy+=other.y;
        avx+=other.vx;avy+=other.vy;schoolN++;
      }
    }
    if(school){
      if(schoolN){
        // Average heading, formation centre and spacing change gradually.
        ax+=(cx/schoolN-f.x)*.095+(avx/schoolN-f.vx)*.48;
        ay+=(cy/schoolN-f.y)*.082+(avy/schoolN-f.vy)*.38;
      }
      ax+=(this.schoolGoal.x-f.x)*.035;
      ay+=(this.schoolGoal.y-f.y)*.024;
    }
    // Soft rock avoidance, keeping more delicate smaller fish in open water.
    if(!bottom&&f.shelterPhase==='none'){
      for(const rock of ROCKS){
        const nx=(f.x-rock.x)/(rock.rx+f.size),ny=(f.y-rock.y)/(rock.ry+f.size);
        const q=nx*nx+ny*ny;
        if(q<1.3){ax+=nx*(1.3-q)*29;ay+=ny*(1.3-q)*32;}
      }
    }
    const pellet=this.pickFood(f);
    if(pellet){
      f.shelterCooldown=Math.max(f.shelterCooldown,10);
      if(f.shelterPhase!=='none'){
        f.shelterPhase='none';f.shelter=null;f.shelterCooldown=10;
      }
      f.state='feeding';f.rest=0;
      f.feeding=Math.min(1,f.feeding+dt*2.1);
      const dx=pellet.x-f.x,dy=pellet.y-f.y,d=magnitude(dx,dy)||1;
      // Priority to food but still respect collisions and the aquarium walls.
      ax+=dx/d*sp.turn*2.0;ay+=dy/d*sp.turn*1.8;
      if(d<f.size*f.scale+6){
        const index=this.world.feed.indexOf(pellet);
        if(index>=0)this.world.feed.splice(index,1);
        f.foodTarget=null;f.forageCooldown=random(.9,1.8);
        f.nibbleTimer=.48;f.feeding=.85;
      }
    }else if(f.nibbleTimer>0){
      f.state='nibble';f.feeding=Math.max(0,f.feeding-dt*.8);
    }else if(f.rest>0){
      f.state='rest';f.feeding=Math.max(0,f.feeding-dt);
    }else{
      f.state=f.shelterPhase==='approach'?'coral-approach':
        f.shelterPhase==='hide'?'coral-hide':school?'schooling':'roam';
      f.feeding=Math.max(0,f.feeding-dt);
    }
    // Wall repulsion begins BEFORE contacting the bounds.
    const padding=72;
    if(f.x<water.x1+padding)ax+=(water.x1+padding-f.x)*1.6;
    if(f.x>water.x2-padding)ax-=(f.x-(water.x2-padding))*1.6;
    if(f.y<water.y1+padding)ay+=(water.y1+padding-f.y)*1.5;
    if(f.y>water.y2-padding)ay-=(f.y-(water.y2-padding))*1.6;
    if(bottom)ay+=(640-f.y)*.9;
    // The same restrained circulation carries bubbles, motes and feed.
    // Fish retain their own steering: current is environmental influence,
    // never a velocity teleport and never strong enough to force collisions.
    const flow=sampleWaterCurrent(f.x,f.y,this.world.t);
    ax+=flow.x*(bottom?.20:.65)+Math.sin(this.world.t*.71+f.phase)*.30;
    ay+=flow.y*(bottom?.12:.65)+Math.sin(this.world.t*.56+f.phase*1.73)*.24;
    const force=magnitude(ax,ay);
    if(force>sp.turn){ax*=sp.turn/force;ay*=sp.turn/force;}
    f.vx+=ax*dt;f.vy+=ay*dt;
    const speed=magnitude(f.vx,f.vy);
    const cruising=sp.speed*(night?.82:1)*(f.depth==='back'?.8:1);
    const activity=f.state==='rest'?(bottom?.07:.15):f.state==='nibble'?.35:
      f.state==='coral-hide'?.085:f.state==='feeding'?1.17:1;
    const topSpeed=cruising*activity;
    if(speed>topSpeed&&speed>0){
      // Decelerate naturally in a rest pose; otherwise enforce swim speed.
      const k=f.state==='rest'?Math.max(topSpeed/speed,1-4*dt):topSpeed/speed;
      f.vx*=k;f.vy*=k;
    }else if(speed>0.001&&f.state!=='rest'&&f.state!=='nibble'&&f.state!=='coral-hide'){
      const minimum=cruising*(bottom?.20:.42);
      if(speed<minimum){const k=1+Math.min(1.2*dt,(minimum-speed)/speed);f.vx*=k;f.vy*=k;}
    }
    f.x=clamp(f.x+f.vx*dt,water.x1,water.x2);
    f.y=clamp(f.y+f.vy*dt,bottom?610:water.y1,bottom?660:water.y2);
    if(f.x===water.x1&&f.vx<0)f.vx=Math.abs(f.vx)*.45;
    if(f.x===water.x2&&f.vx>0)f.vx=-Math.abs(f.vx)*.45;
    if(!bottom){
      if(f.y===water.y1&&f.vy<0)f.vy=Math.abs(f.vy)*.45;
      if(f.y===water.y2&&f.vy>0)f.vy=-Math.abs(f.vy)*.45;
    }else if((f.y===610&&f.vy<0)||(f.y===660&&f.vy>0))f.vy*=-.4;
    // Heading hysteresis prevents a single jittering frame flipping the sprite.
    if(f.vx>3)f.facing=1;
    else if(f.vx< -3)f.facing=-1;
    const tailRate=f.state==='feeding'?10:f.state==='rest'?1.15:
      bottom?2.7:school?7.1:5.5;
    f.tail+=dt*tailRate*(night?.86:1);
  }
  update(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    // 20/30/60 FPS all use bounded physics steps; no spikes after tab resume.
    dt=clamp(dt,0,.09);
    const steps=Math.ceil(dt/.03),step=dt/steps;
    for(let i=0;i<steps;i++){
      this.schoolClock-=step;
      if(this.schoolClock<=0){
        this.schoolClock=random(4.5,8.2);
        this.schoolGoal=V(random(475,1115),random(440,555));
      }
      for(const f of this.fish)this.steer(f,step,this.fish);
    }
  }
  byDepth(depth){return this.fish.filter(f=>f.depth===depth).sort((a,b)=>a.y-b.y);}
  counts(){return SPECIES_KEYS.map(k=>({id:k,label:SPECIES[k].label,count:this.fish.filter(f=>f.species===k).length}));}
}
