const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smoothStep=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const randomRange=(random,min,max)=>min+clamp(random(),0,1)*(max-min);

// Relaxed, event-driven rhythm. A sleeping pose is chosen on page load or on
// a real daypart change; it does not alternate every few seconds.
export const MIU_RHYTHMS=Object.freeze({
  0:Object.freeze({label:'day',stretchAfter:[480,900],stretchChance:.65}),     // 8–15 min
  1:Object.freeze({label:'sunset',stretchAfter:[660,1200],stretchChance:.45}),// 11–20 min
  2:Object.freeze({label:'night',stretchAfter:[1080,1800],stretchChance:.20})// 18–30 min
});

const SLEEP_TRANSFORMS={
  sleepA:{x:0,y:0,scale:1},
  sleepB:{x:-1.25,y:.55,scale:1.004},
  stretch:{x:-2.2,y:-1.6,scale:1.008},
};
const STRETCH_DURATION=[2.6,3.6];

export class MiuLife {
  constructor(root,{random=Math.random,onStretchStart=()=>{},onStretchEnd=()=>{}}={}){
    this.root=root;
    this.random=random;
    this.onStretchStart=onStretchStart;
    this.onStretchEnd=onStretchEnd;
    this.sleepA=root.querySelector('#miu-sleep-01');
    this.sleepB=root.querySelector('#miu-sleep-02');
    this.stretch=root.querySelector('#miu-stretch');
    this.tail=root.querySelector('#miu-tail');
    this.layers={sleepA:this.sleepA,sleepB:this.sleepB,stretch:this.stretch};
    this.daypart=null;
    this.state='sleepA';
    this.returnSleep='sleepA';
    this.stateClock=0;
    this.stateDuration=Infinity;
    this.nextStretchAt=Infinity;
    this.tailBurst=0;
    this.tailReactionTime=0;
    this.petGlow=0;
    this.time=0;
    this.lastReducedMotion=false;
    this.render(0,{reducedMotion:false});
  }
  /** Re-roll the resting pose and schedule only on a genuine daypart change. */
  setDaypart(daypart){
    const next=clamp(Math.trunc(Number(daypart)||0),0,2);
    if(this.daypart===next)return false;
    this.daypart=next;
    const sleepingPose=this.random()<.5?'sleepA':'sleepB';
    // Never force a stretch on F5 or a time-of-day toggle.
    this.state=sleepingPose;
    this.returnSleep=sleepingPose;
    this.stateClock=0;
    this.stateDuration=Infinity;
    this.scheduleStretch();
    this.render(this.time,{reducedMotion:this.lastReducedMotion});
    return true;
  }
  scheduleStretch(){
    const rhythm=MIU_RHYTHMS[this.daypart??0];
    this.nextStretchAt=this.time+randomRange(this.random,...rhythm.stretchAfter);
  }
  /** Preserve the older enter(state) API for integration/debug tools. */
  enter(next){
    if(next==='stretch'){
      if(this.state!=='stretch')this.enterStretch();
      return;
    }
    if(next!=='sleepA'&&next!=='sleepB')return;
    const wasStretch=this.state==='stretch';
    this.state=next;
    this.returnSleep=next;
    this.stateClock=0;
    this.stateDuration=Infinity;
    this.scheduleStretch();
    if(wasStretch)this.onStretchEnd();
  }
  enterStretch(){
    this.returnSleep=this.state;
    this.state='stretch';
    this.stateClock=0;
    this.stateDuration=randomRange(this.random,...STRETCH_DURATION);
    this.nextStretchAt=Infinity;
    this.onStretchStart();
  }
  finishStretch(){
    this.state=this.returnSleep;
    this.stateClock=0;
    this.stateDuration=Infinity;
    this.scheduleStretch();
    this.onStretchEnd();
  }
  pet(){
    this.petGlow=1;
    this.tailBurst=1;
    this.tailReactionTime=0;
    // Petting reacts with the tail only; it does not cycle Miu's pose.
  }
  update(dt,{reducedMotion=false}={}){
    const step=Number.isFinite(dt)?Math.max(0,dt):0;
    this.time+=step;
    this.stateClock+=step;
    this.lastReducedMotion=!!reducedMotion;
    if(this.daypart!==null){
      if(this.state==='stretch'&&this.stateClock>=this.stateDuration){
        this.finishStretch();
      }else if(this.state!=='stretch'&&this.time>=this.nextStretchAt){
        const chance=MIU_RHYTHMS[this.daypart].stretchChance;
        if(this.random()<chance)this.enterStretch();
        else this.scheduleStretch();
      }
    }
    this.tailReactionTime+=step;
    this.tailBurst=Math.max(0,this.tailBurst-step*.45);
    this.petGlow=Math.max(0,this.petGlow-step*.42);
    this.render(this.time,{reducedMotion});
  }
  render(time,{reducedMotion=false}={}){
    const pose=SLEEP_TRANSFORMS[this.state]||SLEEP_TRANSFORMS.sleepA;
    const breathStrength=reducedMotion?0:(this.state==='stretch'?1.35:.75);
    const breath=Math.sin(time*1.04)*(this.state==='stretch'?1.8:1.0);
    const breathY=breathStrength*breath;
    const breathScale=1+(reducedMotion?0:Math.cos(time*1.04)*.0028);
    const settle=smoothStep(clamp(this.stateClock/.65,0,1));
    // Right-side tail attachment is fixed; only the left free tip lifts.
    const slowWave=.5+.5*Math.sin(time*1.35-.6);
    const restAngle=.75+2.2*slowWave;
    const reaction=Math.pow(this.tailBurst,1.35)
      *Math.max(0,Math.sin(this.tailReactionTime*4.2));
    const tailAngle=reducedMotion||this.state==='stretch'
      ?0:Math.min(11,restAngle+9.0*reaction);
    this.root.classList.toggle('is-stretch',this.state==='stretch');
    this.root.style.setProperty('--miu-base-x',`${mix(0,pose.x,settle).toFixed(2)}px`);
    this.root.style.setProperty('--miu-base-y',`${(mix(0,pose.y,settle)+breathY).toFixed(2)}px`);
    this.root.style.setProperty('--miu-base-scale',String((mix(1,pose.scale,settle)*breathScale).toFixed(5)));
    this.root.style.setProperty('--miu-tail-angle',`${tailAngle.toFixed(2)}deg`);
    this.root.style.setProperty('--miu-pet-glow',String((.08+.14*this.petGlow).toFixed(3)));
    const fades={sleepA:0,sleepB:0,stretch:0};
    if(this.state==='sleepA')fades.sleepA=1;
    if(this.state==='sleepB')fades.sleepB=1;
    if(this.state==='stretch'){
      const fadeIn=clamp(this.stateClock/.42,0,1);
      const fadeOut=clamp((this.stateDuration-this.stateClock)/.55,0,1);
      fades.stretch=Math.min(fadeIn,fadeOut,1);
      fades.sleepA=1-fades.stretch*.9;
      fades.sleepB=.2*(1-fades.stretch);
    }
    for(const [name,el] of Object.entries(this.layers)){
      if(el)el.style.opacity=String(clamp(fades[name],0,1));
    }
    if(this.tail){
      // The stretch sprite owns its tail; avoid a second tail behind it.
      this.tail.style.opacity=String(this.state==='stretch'?0:1);
    }
  }
}

export const MIU_TAIL_ORIGIN=Object.freeze({x:1532,y:778});
