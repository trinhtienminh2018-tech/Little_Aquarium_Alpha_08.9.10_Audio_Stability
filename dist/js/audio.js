const base='/assets/audio/';
const tracks={
 'aquarium-filter':['water',.10], 'water-trickle':['water',.12], 'underwater-bubbles':['water',.06],
 'birds-ambience':['nature',.13], 'gentle-wind':['nature',.12], 'leaves-rustling':['nature',.08], 'rain-window':['nature',.22], 'rain-leaves':['nature',.24],
 'room-tone':['room',.045], 'soft-piano':['music',.75], 'lofi-day':['music',.60], 'lofi-evening':['music',.60], 'ambient-night':['music',.65]
};
export class AudioEngine {
 constructor(world,feedback){this.w=world;this.feedback=feedback;this.nodes=new Map();this.timer=0;this.thunderVoices=new Set();this.windowDoor=null;this.pendingPlays=new WeakMap();this.blockedPlays=new WeakSet();}
 node(name){if(!this.nodes.has(name)){const el=new Audio(base+name+'.mp3');el.loop=true;el.preload='none';el.volume=0;el.addEventListener('error',()=>this.feedback('Không tải được âm thanh: '+name));this.nodes.set(name,el);}return this.nodes.get(name);}
 desired(name){const w=this.w;if(!w.audioOn)return false;if(['aquarium-filter','water-trickle','underwater-bubbles','room-tone'].includes(name))return true;
 if(name==='birds-ambience')return w.weather!==2&&w.time!==2;
 if(name==='gentle-wind')return w.weather===1||w.weather===2;
 if(name==='leaves-rustling')return w.weather===2;
 if(name==='rain-window'||name==='rain-leaves')return w.weather===2;
 if(name==='soft-piano')return w.musicOn&&w.piano;
 if(name==='lofi-day')return w.musicOn&&!w.piano&&w.time===0;
 if(name==='lofi-evening')return w.musicOn&&!w.piano&&w.time===1;
 if(name==='ambient-night')return w.musicOn&&!w.piano&&w.time===2;return false;}
 target(name){
  const [group,gain]=tracks[name];const w=this.w;
  // Rain behind glass is subdued. Opening the window brings the outside
  // rain-on-leaves and wind into the room without restarting their loops.
  const aperture={
    'rain-window':w.windowOpen?.58:.82,
    'rain-leaves':w.windowOpen?1.05:0,
    'gentle-wind':w.windowOpen?1.25:.52,
    'leaves-rustling':w.windowOpen?1.3:.44,
    'birds-ambience':w.windowOpen?1.12:.7,
  }[name]??1;
  const weatherGain=name==='gentle-wind'&&w.weather===2?1.35:1;
  return Math.min(1,gain*aperture*weatherGain*w.volume*(group==='water'?w.water*2.5:group==='nature'?w.nature*2.5:group==='music'?w.music*1.6:.5));
}
 unlock(){this.blockedPlays=new WeakSet();}
 playLoop(name,el){
  if(!el.paused||this.pendingPlays.has(el)||this.blockedPlays.has(el))return;
  let request;
  try{request=el.play();}catch(error){this.handlePlayError(el,name,error);return;}
  if(!request||typeof request.then!=='function')return;
  const pending=Promise.resolve(request);
  this.pendingPlays.set(el,pending);
  pending.then(()=>{if(this.pendingPlays.get(el)===pending)this.pendingPlays.delete(el);},error=>{
    if(this.pendingPlays.get(el)===pending)this.pendingPlays.delete(el);
    if(error?.name==='AbortError'){
      // Another control may have paused the track before play() resolved.
      // If it was toggled back on meanwhile, resume on the next microtask.
      if(this.desired(name)&&el.paused)queueMicrotask(()=>this.playLoop(name,el));
      return;
    }
    this.handlePlayError(el,name,error);
  });
 }
 handlePlayError(el,name,error){
  // Autoplay can be denied until the next user gesture; avoid repeated toasts.
  if(error?.name==='NotAllowedError'){
    if(!this.blockedPlays.has(el))this.feedback('Bấm Âm thanh để cho phép phát nhạc trong trình duyệt.');
    this.blockedPlays.add(el);return;
  }
  if(this.desired(name))this.feedback('Không phát được âm thanh '+name+': '+(error?.message||String(error)));
 }
 sync(){
  if(!this.w.audioOn&&this.windowDoor){this.windowDoor.pause();this.windowDoor.currentTime=0;}
  if(!this.w.audioOn||this.w.weather!==2||this.w.time!==2){
    for(const voice of this.thunderVoices){voice.pause();voice.currentTime=0;}
    this.thunderVoices.clear();
  }
  for(const name of Object.keys(tracks)){
    const should=this.desired(name),el=this.nodes.get(name);
    if(should){
      const a=this.node(name);
      this.playLoop(name,a);
    }else if(el){el.pause();el.volume=0;}
  }
 }
 update(dt){this.timer+=dt;if(this.timer<.09)return;this.timer=0;for(const [name,el] of this.nodes){const aim=this.desired(name)?this.target(name):0;el.volume=Math.max(0,Math.min(1,el.volume+(aim-el.volume)*.26));if(aim===0&&el.volume<.008)el.pause();}}
 thunderStrike(){
  const w=this.w;
  if(!w.audioOn||w.weather!==2||w.time!==2||w.nature<=0)return;
  const audio=new Audio(base+'distant-thunder.mp3');
  audio.preload='auto';audio.volume=Math.min(.65,(w.windowOpen?.48:.37)*w.volume*(w.nature/.22));
  audio.addEventListener('ended',()=>this.thunderVoices.delete(audio),{once:true});
  audio.addEventListener('error',()=>this.thunderVoices.delete(audio),{once:true});
  this.thunderVoices.add(audio);
  audio.play().catch(()=>this.thunderVoices.delete(audio));
 }
 /** Play the user-provided 1.6s wooden latch sound. Respect the global audio toggle.
     Rewind on quick repeated interactions instead of stacking overlapping voices. */
 playWindowToggle(){
  if(!this.w.audioOn)return;
  if(!this.windowDoor){this.windowDoor=new Audio(base+'window-door.mp3');this.windowDoor.preload='auto';}
  const clip=this.windowDoor;
  clip.pause();clip.currentTime=0;
  clip.volume=Math.max(0,Math.min(.85,.83*this.w.volume));
  clip.play().catch(()=>{});
 }
 oneShot(name,level=.35){if(!this.w.audioOn)return;const el=new Audio(base+name+'.mp3');const isCat=name.startsWith('cat-');const boost=isCat?1.85:1;const floor=isCat?0.16:0;el.volume=Math.min(1,floor+level*this.w.volume*boost);el.play().catch(()=>{});}
}
