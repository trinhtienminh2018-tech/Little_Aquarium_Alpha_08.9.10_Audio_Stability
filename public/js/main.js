import {startTranslations,setLanguage,refreshLanguage} from './i18n.js';
import {World,W,H,tank,clamp} from './world.js';
import {Creatures} from './creatures.js';
import {Atmosphere} from './atmosphere.js';
import {Renderer} from './renderer.js';
import {AquaticPlants} from './aquatic-plants.js';
import {GlassRain} from './glass-rain.js';
import {CoralMotion} from './coral-motion.js';
import {AudioEngine} from './audio.js';
import {WindowCompositor,sceneFor} from './window-compositor.js';
import {setupWallPhoto} from './wall-photo.js';
import {setupWindowInteraction} from './window-interaction.js';
import {NightStorm, LightningPlate, gustAt} from './storm-life.js';
import {clockFrame, TIME_LABELS} from './clock-time.js';
import {FrameBudget,AdaptiveRenderBudget} from './render-budget.js';
import {installLayerInspector} from './layer-inspector.js';
import {MiuLife} from './miu-life.js';
import {LivingLamp} from './living-lamp.js';
import {AquariumLed} from './aquarium-led.js';
import {WindowLight} from './window-light.js';
import {waitForDecodedImages,getFirstFrameImages,revealReadyScene} from './first-frame.js';
import {SceneTransition} from './scene-transition.js';
const $=id=>document.getElementById(id), world=new World();
const creatures=new Creatures(world), atmosphere=new Atmosphere(world), renderer=new Renderer($('effects'),world,creatures,atmosphere);
const aquaticPlants=new AquaticPlants($('aquatic-plants'));
const glassRain=new GlassRain($('wet-glass'));
const coralMotion=new CoralMotion($('coral-motion'));
renderer.setCoralMotion(coralMotion);
const lampLight=new LivingLamp($('lamp-light'),$('app'));
const aquariumLed=new AquariumLed($('led-water-glow'),$('app'));
// This large illustration is only needed when LED night lighting is visible.
const nightIllumination=$('aquarium-night-illumination');
function loadNightIllumination(){
  const src=nightIllumination.dataset.src;
  if(!src)return;
  nightIllumination.src=src;
  nightIllumination.removeAttribute('data-src');
}

const windowLight=new WindowLight({sunGlass:$('window-sun-glass'),moonGlass:$('window-moon-glass'),sunRoom:$('window-sun-room'),moonRoom:$('window-moon-room')},$('app'));
const miuLife=new MiuLife($('miu-life'),{
  onStretchStart:()=>sound.oneShot('cat-stretch',.62),
  onStretchEnd:()=>sound.oneShot('cat-yawn',.32),
});
const toast=(message)=>{$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),2200);};
const sound=new AudioEngine(world,toast);
const lightningPlate=new LightningPlate($('lightning-window'));
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
renderer.setReducedMotion(reduceMotion.matches);
reduceMotion.addEventListener?.('change',event=>renderer.setReducedMotion(event.matches));
const nightStorm=new NightStorm({
  onStrike:number=>lightningPlate.strike(number),
  onThunder:()=>sound.thunderStrike()
});
const weatherNames=['Quang đãng','Có gió','Mưa giông'],dayNames=TIME_LABELS;
let clockState=clockFrame();
if(world.realtime)world.time=clockState.time;
let viewMode = localStorage.getItem('aquarium2.viewMode') === 'zoom' ? 'zoom' : 'full';
function fit(){
  const sx=innerWidth/W, sy=innerHeight/H;
  const s=viewMode==='zoom'?Math.max(sx,sy):Math.min(sx,sy);
  $('stage').style.setProperty('--scale',s);
  $('view-mode').textContent=viewMode==='zoom'?'Phóng gần · phủ kín màn hình':'Toàn cảnh · không cắt ảnh';
}
addEventListener('resize',fit);fit();
$('view-mode').addEventListener('click',()=>{
  engaged();
  viewMode=viewMode==='full'?'zoom':'full';
  localStorage.setItem('aquarium2.viewMode',viewMode);
  fit();
});
function engaged(){$('welcome').classList.add('hide');}
setTimeout(engaged,4000);
setupWallPhoto();
installLayerInspector();
// One master-matte canvas; opening the window ONLY toggles wooden mullions.
// No weather-specific or door-specific alpha file is ever loaded.
const windowCompositor=new WindowCompositor($('outside-current'));
function syncSceneLayers(preparedPanorama=null){
  if(preparedPanorama){windowCompositor.commitPrepared(preparedPanorama);}
  else if(world.realtime){
    const from=sceneFor({weather:world.weather,time:clockState.from});
    const to=sceneFor({weather:world.weather,time:clockState.to});
    void windowCompositor.showBlend(from,to,clockState.blend);
  } else {void windowCompositor.show(sceneFor(world));}
  $('app').classList.toggle('night-mode',world.time===2);
  $('app').classList.toggle('storm-mode',world.weather===2);
  $('app').classList.toggle('sunset-mode',world.time===1);
}
const fishMax=35;
const bottomLimits={crabs:5,shrimps:10,snails:8};
const bottomLabels={crabs:'Cua',shrimps:'Tôm',snails:'Ốc'};
function createStepper(container,kind,key,label,count){
  const row=document.createElement('div');row.className='population-row';
  const name=document.createElement('span');name.className='population-label';name.textContent=label;
  const controls=document.createElement('div');controls.className='population-stepper';
  const less=document.createElement('button');less.type='button';less.textContent='−';
  less.dataset.kind=kind;less.dataset.species=key;less.dataset.delta='-1';
  less.setAttribute('aria-label',`Giảm số lượng ${label}`);less.disabled=count<=0;
  const value=document.createElement('output');value.textContent=count;value.className='population-count';
  const more=document.createElement('button');more.type='button';more.textContent='+';
  more.dataset.kind=kind;more.dataset.species=key;more.dataset.delta='1';
  more.setAttribute('aria-label',`Tăng số lượng ${label}`);
  more.disabled=kind==='fish'?(world.fishCount>=fishMax):count>=bottomLimits[key];
  controls.append(less,value,more);row.append(name,controls);container.append(row);
}
function updateRoster(){
  const el=$('species-roster');if(!el)return;el.replaceChildren();
  for(const item of creatures.speciesSummary())createStepper(el,'fish',item.id,item.label,item.count);
}
function updateBottomRoster(){
  const el=$('bottom-roster');if(!el)return;el.replaceChildren();
  const counts=creatures.bottomSummary();
  for(const key of ['crabs','shrimps','snails'])createStepper(el,'bottom',key,bottomLabels[key],counts[key]);
}
function changePopulation(kind,key,delta){
  engaged();
  if(kind==='fish'){
    const counts=Object.fromEntries(creatures.speciesSummary().map(i=>[i.id,i.count]));
    if(!(key in counts))return;
    if(delta>0 && world.fishCount>=fishMax){toast('Tối đa 35 cá trong bể');return;}
    counts[key]=Math.max(0,counts[key]+delta);
    creatures.setSpeciesCounts(counts);
  } else if(kind==='bottom'){
    if(!(key in bottomLimits))return;
    const counts=creatures.bottomSummary();
    counts[key]=Math.max(0,Math.min(bottomLimits[key],counts[key]+delta));
    creatures.setBottomCounts(counts);
  }
  world.emit();updateUI();
}
for(const id of ['species-roster','bottom-roster']){
  $(id).addEventListener('click',ev=>{
    const button=ev.target.closest('button[data-kind]');
    if(!button||button.disabled)return;
    changePopulation(button.dataset.kind,button.dataset.species,Number(button.dataset.delta));
  });
}
function syncClockDecor(){
  $('app').classList.toggle('clock-mode',world.realtime);
  $('realtime-clock').checked=world.realtime;
  $('daytime').title=world.realtime?'Chọn giờ thủ công (tắt thời gian thực)':'Đổi thời gian thủ công';
  $('clock-summary').textContent=world.realtime
    ?`${clockState.timeText} · ${dayNames[world.time]} · Đang đồng bộ`
    :'Đã tắt đồng bộ · Đang chọn thời gian thủ công';
  $('app').style.setProperty('--clock-room-bright',String(clockState.roomBrightness));
  $('app').style.setProperty('--clock-wood-bright',String(clockState.woodBrightness));
  $('app').style.setProperty('--clock-night-strength',String(clockState.nightWeight));
}
function refreshRealTime({force=false}={}){
  if(!world.realtime)return;
  const next=clockFrame(new Date());
  const changed=world.time!==next.time;
  const frameChanged=force||changed||Math.abs(clockState.blend-next.blend)>.0001||clockState.from!==next.from||clockState.to!==next.to;
  clockState=next;world.time=next.time;
  if(changed){world.emit();sound.sync();}
  if(frameChanged)updateUI();
  else syncClockDecor();
}
function syncLamp(){
  lampLight.sync({on:world.lampOn,intensity:world.lampIntensity,time:world.time,weather:world.weather,realtime:world.realtime,nightWeight:clockState.nightWeight});
  $('lamp-toggle').checked=world.lampOn;
  $('lamp-intensity').value=String(world.lampIntensity);
  $('lamp-intensity-out').textContent=world.lampIntensity+'%';
  $('lamp-hotspot').setAttribute('aria-pressed',String(world.lampOn));
  $('lamp-hotspot').setAttribute('aria-label',world.lampOn?'Tắt đèn bàn':'Bật đèn bàn');
  $('lamp-hotspot').title=world.lampOn?'Nhấp để tắt đèn bàn':'Nhấp để bật đèn bàn';
}
function syncLed(){
  const ledLevelsNow=aquariumLed.sync({on:world.ledOn,intensity:world.ledIntensity,time:world.time,weather:world.weather,realtime:world.realtime,nightWeight:clockState.nightWeight});
  if(ledLevelsNow.nightArt>0.005)loadNightIllumination();
  $('led-toggle').checked=world.ledOn;
  $('led-intensity').value=String(world.ledIntensity);
  $('led-intensity-out').textContent=world.ledIntensity+'%';
  $('led-hotspot').setAttribute('aria-pressed',String(world.ledOn));
  $('led-hotspot').setAttribute('aria-label',world.ledOn?'Tắt LED bể cá':'Bật LED bể cá');
  $('led-hotspot').title=world.ledOn?'Nhấp để tắt đèn LED bể cá':'Nhấp để bật đèn LED bể cá';
}
function syncWindowLight(){
  windowLight.sync({time:world.time,weather:world.weather,realtime:world.realtime,
    from:clockState.from,to:clockState.to,blend:clockState.blend,strength:world.windowLight,windowOpen:world.windowOpen});
  $('window-light-strength').value=String(world.windowLight);
  $('window-light-out').textContent=world.windowLight+'%';
}
function commitUI(preparedPanorama=null){syncWindowLight();miuLife.setDaypart(world.time);syncSceneLayers(preparedPanorama);syncClockDecor();$('app').classList.toggle('night-mode',world.time===2);$('app').classList.toggle('storm-mode',world.weather===2);$('app').classList.toggle('sunset-mode',world.time===1);$('app').classList.toggle('wind-mode',world.weather===1);$('app').classList.toggle('window-open',!!world.windowOpen);$('weather-name').textContent=weatherNames[world.weather];$('day-name').textContent=dayNames[world.time];$('window-name').textContent=world.windowOpen?'Đóng cửa':'Mở cửa';syncLamp();syncLed();syncWindowInteraction(world.windowOpen);$('status').textContent=weatherNames[world.weather]+' · '+dayNames[world.time]+' · '+(world.windowOpen?'Cửa mở':'Cửa đóng');for(const [id,key] of [['audio','audioOn'],['music','musicOn'],['piano','piano'],['mode','ambient'],['window-toggle','windowOpen']])$(id).classList.toggle('active',!!world[key]);$('fish-out').textContent=world.fishCount;$('fish-count').value=world.fishCount;updateRoster();updateBottomRoster();}
// Daypart/weather changes must not alter visible CSS filters before target
// panorama + lighting artwork have finished loading. Snapshot the entire
// #scene-layers as one browser view transition (no individual layer fades).
const sceneKey=()=>`${world.weather}/${world.time}/${Number(world.realtime)}`;
function snapshotVisualState(){
  return {weather:world.weather,time:world.time,realtime:world.realtime,
    from:clockState.from,to:clockState.to,blend:clockState.blend,
    strength:world.windowLight,windowOpen:world.windowOpen,
    ledOn:world.ledOn,ledIntensity:world.ledIntensity};
}
const sceneTransition=new SceneTransition({
  root:$('app'),documentRef:document,
  async prepare(state){
    const from=sceneFor({weather:state.weather,time:state.realtime?state.from:state.time});
    const to=sceneFor({weather:state.weather,time:state.realtime?state.to:state.time});
    const tasks=[windowCompositor.prepareBlend(from,to,state.realtime?state.blend:0),windowLight.prepare(state)];
    // Prevent late lazy-image pop-in when switching to LED-lit night.
    if(state.time===2&&state.ledOn&&state.ledIntensity>0){
      loadNightIllumination();
      if(nightIllumination.getAttribute('src'))tasks.push(nightIllumination.decode());
    }
    const [panorama]=await Promise.all(tasks);
    return panorama;
  },
  commit(panorama){commitUI(panorama);},
});
let sceneCommittedOnce=false;
function updateUI(){
  const key=sceneKey();
  if(!sceneCommittedOnce){
    commitUI();sceneTransition.initialize(key);sceneCommittedOnce=true;return;
  }
  if(key!==sceneTransition.currentKey){
    void sceneTransition.request(key,snapshotVisualState());
    return;
  }
  commitUI();
}
function act(fn){engaged();fn();world.emit();sound.sync();updateUI();}
$('audio').onclick=()=>{sound.unlock();act(()=>world.audioOn=!world.audioOn);};
$('music').onclick=()=>act(()=>world.musicOn=!world.musicOn);
$('piano').onclick=()=>act(()=>{world.piano=!world.piano;world.musicOn=true;});
$('feed').onclick=()=>{engaged();world.addFood(810,400);sound.oneShot('water-splash-01',.3);toast('Cá đang đến ăn!');};
$('weather').onclick=()=>act(()=>world.weather=(world.weather+1)%3);
$('daytime').onclick=()=>{act(()=>{world.realtime=false;world.time=(world.time+1)%3;});toast('Đã chuyển sang chọn thời gian thủ công');};
$('realtime-clock').addEventListener('change',e=>{
  act(()=>{world.realtime=e.target.checked;if(world.realtime){clockState=clockFrame(new Date());world.time=clockState.time;}});
  toast(world.realtime?'Đã bật đồng bộ thời gian thực':'Đã tắt đồng bộ · Có thể chọn giờ thủ công');
});
const syncWindowInteraction=setupWindowInteraction({
  root:document,
  onToggle:()=>{
    act(()=>world.windowOpen=!world.windowOpen);
    sound.playWindowToggle();
  }
});
$('mode').onclick=()=>{act(()=>world.ambient=!world.ambient);$('mode').querySelector('small').textContent=world.ambient?'Hiện điều khiển':'Thư giãn';$('app').classList.toggle('ambient',world.ambient);};
function setSettingsOpen(open){
  const panel=$('panel');panel.classList.toggle('hidden',!open);
  panel.setAttribute('aria-hidden',String(!open));
  panel.inert=!open;
  $('settings').setAttribute('aria-expanded',String(open));
  $('settings').classList.toggle('active',open);
}
setSettingsOpen(false);
$('settings').setAttribute('aria-controls','panel');
$('settings').onclick=()=>{engaged();setSettingsOpen($('panel').classList.contains('hidden'));};
$('lamp-hotspot').addEventListener('click',()=>act(()=>{world.lampOn=!world.lampOn;}));
$('lamp-toggle').addEventListener('change',e=>act(()=>{world.lampOn=!!e.target.checked;}));
$('lamp-intensity').addEventListener('input',e=>{world.lampIntensity=clamp(Number(e.target.value),0,100);world.emit();syncLamp();});
$('led-hotspot').addEventListener('click',()=>act(()=>{world.ledOn=!world.ledOn;}));
$('led-toggle').addEventListener('change',e=>act(()=>{world.ledOn=!!e.target.checked;}));
$('led-intensity').addEventListener('input',e=>{world.ledIntensity=clamp(Number(e.target.value),0,100);world.emit();syncLed();});
$('window-light-strength').addEventListener('input',e=>{world.windowLight=clamp(Number(e.target.value),0,100);world.emit();syncWindowLight();});
$('close').onclick=()=>setSettingsOpen(false);
function pet(){engaged();miuLife.pet();sound.oneShot('cat-purr',.95);toast('Miu: Prrrr… ♡');}
$('pet').onclick=pet;$('cat-zone').onclick=pet;
$('stage').addEventListener('pointerdown',ev=>{if(ev.target.closest('button'))return;engaged();const b=$('stage').getBoundingClientRect(),x=(ev.clientX-b.left)/b.width*W,y=(ev.clientY-b.top)/b.height*H;if(x>tank.left+12&&x<tank.right-12&&y>tank.top+14&&y<tank.bottom-12){world.addFood(x,Math.min(y,430));sound.oneShot('water-splash-01',.25);}});
function range(input,out,key,scale=100){$(input).value=world[key]*scale;$(out).textContent=(world[key]*scale).toFixed(0)+(scale===100&&key!=='fishCount'?'%':'');$(input).oninput=e=>{world[key]=Number(e.target.value)/scale;if(key==='fishCount'){creatures.setFish(world[key]);updateRoster();}$(out).textContent=e.target.value+(key==='fishCount'?'':'%');world.emit();};}
const qualitySelect=$('render-quality');
qualitySelect.value=world.renderQuality;
qualitySelect.addEventListener('change',()=>{world.renderQuality=qualitySelect.value;world.emit();frameBudget.reset();toast('Chất lượng chuyển động: '+qualitySelect.options[qualitySelect.selectedIndex].text);});
const waterVisibilityControl=$('water-visibility');
waterVisibilityControl.value=String(world.waterVisibility);
$('water-visibility-out').textContent=world.waterVisibility+'%';
waterVisibilityControl.addEventListener('input',e=>{
  world.waterVisibility=clamp(Number(e.target.value),0,100);
  $('water-visibility-out').textContent=world.waterVisibility+'%';
  world.emit();
});
const plantMotionControl=$('plant-motion');
plantMotionControl.value=String(world.plantMotion);
$('plant-motion-out').textContent=world.plantMotion+'%';
plantMotionControl.addEventListener('input',e=>{
  world.plantMotion=clamp(Number(e.target.value),0,100);
  $('plant-motion-out').textContent=world.plantMotion+'%';
  world.emit();
});
const coralMotionControl=$('coral-motion-control');
coralMotionControl.value=String(world.coralMotion);
$('coral-motion-out').textContent=world.coralMotion+'%';
coralMotionControl.addEventListener('input',e=>{
  world.coralMotion=clamp(Number(e.target.value),0,100);
  $('coral-motion-out').textContent=world.coralMotion+'%';
  world.emit();
});
const glassRainControl=$('glass-rain');
glassRainControl.value=String(world.glassRain);
$('glass-rain-out').textContent=world.glassRain+'%';
glassRainControl.addEventListener('input',e=>{
  world.glassRain=clamp(Number(e.target.value),0,100);
  $('glass-rain-out').textContent=world.glassRain+'%';
  world.emit();
});
range('fish-count','fish-out','fishCount',1);range('volume','volume-out','volume');range('water-vol','water-out','water');range('nature-vol','nature-out','nature');range('music-vol','music-out','music');updateUI();
// A frequent but cheap local-clock poll keeps the gradual panorama and lighting
// transitions smooth without any server request. Also resync on tab/focus return.
const clockInterval=setInterval(()=>{if(!document.hidden)refreshRealTime();},15_000);
void clockInterval;
window.addEventListener('focus',()=>refreshRealTime({force:true}));
const frameBudget=new FrameBudget();
const adaptiveBudget=new AdaptiveRenderBudget();
const appStyle=$('app').style;
let lastRoomLight=null,lastGust=null,animationId=0,lastCompletedAt=null;
function frame(now){
  if(document.hidden){animationId=0;return;}
  animationId=requestAnimationFrame(frame);
  const fps=adaptiveBudget.fps({preset:world.renderQuality,focused:document.hasFocus(),visible:true,reducedMotion:reduceMotion.matches});
  const {draw,dt}=frameBudget.sample(now,fps);
  if(!draw)return;
  if(sceneTransition.pendingKey!==null){sound.update(dt);return;}
  const started=performance.now();
  world.update(dt);
  const stormNight=world.weather===2&&world.time===2;
  const {power}=nightStorm.update(dt,stormNight);
  const flash=reduceMotion.matches?0:power;
  lightningPlate.setPower(flash);
  const roomLight=.53+flash*.7;
  if(lastRoomLight!==roomLight){appStyle.setProperty('--storm-room-light',String(roomLight));lastRoomLight=roomLight;}
  const gust=reduceMotion.matches||!world.windowOpen||world.weather!==2?0:gustAt(world.t);
  if(lastGust!==gust){appStyle.setProperty('--storm-gust',String(gust));lastGust=gust;}
  glassRain.draw(world.t,dt,{weather:world.weather,windowOpen:world.windowOpen,reducedMotion:reduceMotion.matches,preset:world.renderQuality,intensity:world.glassRain,night:world.time===2,flash});
  creatures.update(dt);
  coralMotion.draw(world.t,{reducedMotion:reduceMotion.matches,preset:world.renderQuality,intensity:world.coralMotion});
  aquaticPlants.draw(world.t,{reducedMotion:reduceMotion.matches,preset:world.renderQuality,intensity:world.plantMotion});
  miuLife.update(dt,{reducedMotion:reduceMotion.matches});
  renderer.render(world.t,dt);
  sound.update(dt);
  // Avoid counting a resumed tab's long scheduling gap as a slow render.
  if(world.renderQuality==='auto')adaptiveBudget.observe(performance.now()-started,lastCompletedAt===null?16.7:now-lastCompletedAt);
  lastCompletedAt=now;
}
function startRendering(){
  if(animationId||document.hidden)return;
  frameBudget.reset();adaptiveBudget.reset();lastCompletedAt=null;
  animationId=requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(animationId)cancelAnimationFrame(animationId);animationId=0;frameBudget.reset();lastCompletedAt=null;}
  else{refreshRealTime({force:true});startRendering();}
});
startRendering();
// Boot barrier: user never sees an unscaled room or a blank window canvas.
// Work on animation canvases while the stage remains invisible; no timer delay.
async function handOffFirstFrame(){
  const status=$('scene-boot-status');
  try{
    await Promise.all([
      windowCompositor.whenFirstPainted(),
      windowLight.whenFirstRendered(),
      waitForDecodedImages(getFirstFrameImages($('scene-layers'),aquaticPlants.sprites,coralMotion.sprites))
    ]);
    // Redraw once after all images have decoded, including moving plants/corals.
    coralMotion.draw(world.t,{reducedMotion:reduceMotion.matches,preset:world.renderQuality,intensity:world.coralMotion});
    aquaticPlants.draw(world.t,{reducedMotion:reduceMotion.matches,preset:world.renderQuality,intensity:world.plantMotion});
    miuLife.update(0,{reducedMotion:reduceMotion.matches});
    renderer.render(world.t,0);
    // Two animation frames: scene canvas commits before opacity fade starts.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    fit();
    revealReadyScene($('app'));
  }catch(error){
    console.error('Initial scene incomplete',error);
    status.textContent='Không thể tải đủ hình ảnh. Hãy thử lại.';
    $('scene-boot-retry').hidden=false;
  }
}
$('scene-boot-retry').addEventListener('click',()=>location.reload());
void handOffFirstFrame();
document.addEventListener('keydown' ,e=>{if(e.key==='Escape'&&!$('panel').classList.contains('hidden')){setSettingsOpen(false);return;}if(e.key==='Escape'&&!$('photo-modal').open&&world.ambient){world.ambient=false;$('app').classList.remove('ambient');updateUI();}});
document.addEventListener('visibilitychange',()=>{frameBudget.reset();if(!document.hidden)refreshRealTime({force:true});});
window.livelyPropertyListener=(name,val)=>{
  if(name==='viewMode'){
    viewMode=val===0?'zoom':'full';
    localStorage.setItem('aquarium2.viewMode',viewMode);
    fit();
  }else if(name==='renderQuality'){
    const qualities=['auto','smooth','balanced','eco'];
    world.renderQuality=qualities[val]||'auto';
    qualitySelect.value=world.renderQuality;
    world.emit();
    frameBudget.reset();
  }else if(name==='weather'){
    world.weather=Number(val)%3;
    world.emit();
    updateUI();
  }else if(name==='fishCount'){
    world.fishCount=clamp(Number(val),0,35);
    creatures.setFish(world.fishCount);
    updateRoster();
    world.emit();
    updateUI();
  }else if(name==='audioOn'){
    world.audioOn=Boolean(val);
    if(world.audioOn)sound.unlock();
    world.emit();
    sound.sync();
    updateUI();
  }else if(name==='volume'){
    world.volume=clamp(Number(val)/100,0,1);
    world.emit();
    sound.sync();
  }else if(name==='language'){
    setLanguage(val===1?'vi':'en');
  }
};
try{
  const urlParams=new URLSearchParams(window.location.search);
  if(urlParams.get('wallpaper')==='1'||urlParams.get('ambient')==='1'){
    world.ambient=true;
    $('app').classList.add('ambient');
    const small=$('mode')?.querySelector('small');
    if(small)small.textContent='Hiện điều khiển';
  }
}catch{}
$('language-choice')?.addEventListener('change',event=>setLanguage(event.target.value));
startTranslations();


