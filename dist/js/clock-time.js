/** Time-of-day follows the device's LOCAL clock; no geolocation or server required.
 * Clock thresholds are deliberately stable for a relaxing, predictable aquarium.
 * The sky and interior blend continuously across dawn, golden hour and dusk.
 */
export const CLOCK_MINUTES=Object.freeze({dawn:330,dayReady:360,sunset:990,sunsetReady:1020,dusk:1080,night:1110});
export const TIME_LABELS=['Ban ngày','Hoàng hôn','Buổi tối'];
const clamp=(v)=>Math.max(0,Math.min(1,v));
const lerp=(a,b,t)=>a+(b-a)*t;

export function clockTimeOfDay(date=new Date()){
  const minute=date.getHours()*60+date.getMinutes()+date.getSeconds()/60;
  if(minute<CLOCK_MINUTES.dawn || minute>=CLOCK_MINUTES.night) return 2;
  if(minute<CLOCK_MINUTES.sunset)return 0;
  if(minute<CLOCK_MINUTES.night)return 1;
  return 2;
}

export function clockFrame(date=new Date()){
  const minute=date.getHours()*60+date.getMinutes()+date.getSeconds()/60;
  let from=2,to=2,blend=0;
  if(minute>=CLOCK_MINUTES.dawn && minute<CLOCK_MINUTES.dayReady){
    from=2;to=0;blend=clamp((minute-CLOCK_MINUTES.dawn)/(CLOCK_MINUTES.dayReady-CLOCK_MINUTES.dawn));
  } else if(minute>=CLOCK_MINUTES.dayReady && minute<CLOCK_MINUTES.sunset){
    from=0;to=0;
  } else if(minute>=CLOCK_MINUTES.sunset && minute<CLOCK_MINUTES.sunsetReady){
    from=0;to=1;blend=clamp((minute-CLOCK_MINUTES.sunset)/(CLOCK_MINUTES.sunsetReady-CLOCK_MINUTES.sunset));
  } else if(minute>=CLOCK_MINUTES.sunsetReady && minute<CLOCK_MINUTES.dusk){
    from=1;to=1;
  } else if(minute>=CLOCK_MINUTES.dusk && minute<CLOCK_MINUTES.night){
    from=1;to=2;blend=clamp((minute-CLOCK_MINUTES.dusk)/(CLOCK_MINUTES.night-CLOCK_MINUTES.dusk));
  } else if(minute>=CLOCK_MINUTES.night || minute<CLOCK_MINUTES.dawn){
    from=2;to=2;
  }
  const weights=[0,0,0];weights[from]+=(1-blend);weights[to]+=blend;
  const day=weights[0],sunset=weights[1],night=weights[2];
  return {
    time:clockTimeOfDay(date),from,to,blend,
    roomBrightness:day+sunset*.94+night*.53,
    woodBrightness:day+sunset*.96+night*.62,
    nightWeight:night,
    timeText:new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit'}).format(date)
  };
}
