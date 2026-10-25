/** Render policy for a long-running ambient scene (and future Windows host).
 * Pure logic: can be tested without a browser or changing any image layer.
 */
export const RENDER_PRESETS=Object.freeze({
  auto:'Tự động',smooth:'Mượt (60 FPS)',balanced:'Cân bằng (30 FPS)',eco:'Tiết kiệm (20 FPS)'
});
export function normalizePreset(preset){return Object.hasOwn(RENDER_PRESETS,preset)?preset:'auto';}
export function targetFps({preset='auto',focused=true,visible=true,reducedMotion=false}={}){
  if(!visible)return 0; // CSS animations and simulation pause in background tabs.
  const chosen=normalizePreset(preset);
  const base=chosen==='smooth'?60:chosen==='balanced'?30:chosen==='eco'?20:focused?60:30;
  return reducedMotion?Math.min(base,20):base;
}
/** The first visible frame is never delayed. Avoid "+= period" to prevent
 * a long-running timer drifting or rapid catch-up after sleeping. */
export class FrameBudget {
  constructor(){this.lastPaint=null;this.lastStep=null;}
  reset(){this.lastPaint=null;this.lastStep=null;}
  sample(now,fps){
    if(!fps||!Number.isFinite(now))return {draw:false,dt:0};
    const interval=1000/fps;
    if(this.lastPaint!==null&&now-this.lastPaint<interval-1.25)return {draw:false,dt:0};
    const dt=this.lastStep===null?1/Math.min(fps,60):Math.min(Math.max((now-this.lastStep)/1000,0),.09);
    this.lastStep=now;this.lastPaint=now;
    return {draw:true,dt};
  }
}

/** Auto quality observes actual canvas cost, not device model or screen size.
 * Hysteresis prevents a rapid 60/30 flip when a scene is close to the limit.
 * Explicit quality presets always bypass this controller.
 */
export class AdaptiveRenderBudget {
  constructor(){this.reset();}
  reset(){this.level=60;this.expensive=0;this.healthy=0;}
  fps({preset='auto',focused=true,visible=true,reducedMotion=false}={}){
    const baseline=targetFps({preset,focused,visible,reducedMotion});
    return normalizePreset(preset)==='auto' ? Math.min(baseline,this.level) : baseline;
  }
  observe(costMs,frameIntervalMs){
    if(!Number.isFinite(costMs)||!Number.isFinite(frameIntervalMs)||frameIntervalMs<=0)return;
    // Only completed foreground frames contribute; browser scheduling stalls
    // are not evidence of expensive rendering.
    const overloaded=costMs>12 || (frameIntervalMs>24 && frameIntervalMs<90 && costMs>8);
    if(overloaded){this.expensive++;this.healthy=0;}
    else if(costMs<7 && frameIntervalMs<45){this.healthy++;this.expensive=Math.max(0,this.expensive-1);}
    else {this.expensive=Math.max(0,this.expensive-1);this.healthy=0;}
    if(this.expensive>=18){this.level=30;this.expensive=0;this.healthy=0;}
    if(this.level===30&&this.healthy>=180){this.level=60;this.healthy=0;}
  }
}
