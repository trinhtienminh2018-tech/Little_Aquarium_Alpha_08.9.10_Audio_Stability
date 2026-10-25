import {W,H,tank} from './world.js';
import {LivingWater} from './living-water.js';
import {ledLevels,paintAquariumFishReflection} from './aquarium-led.js';
import {drawFish} from './fish-painter.js';
import {drawBottomCreature} from './bottom-painter.js';
/** World-level painter. All water effects are restricted to the existing tank. */
export class Renderer {
  constructor(canvas,world,creatures,atmosphere){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');
    this.w=world;this.creatures=creatures;this.atmo=atmosphere;
    this.water=new LivingWater();this.reducedMotion=false;
  }
  setReducedMotion(value){this.reducedMotion=!!value;}
  setCoralMotion(coral){this.coralMotion=coral;}
  drawFishWithCoral(c,t,depth,opts){
    for(const fish of this.creatures.fishEngine.byDepth(depth)){
      drawFish(c,fish,t);
      if(fish.shelterPhase==='hide'&&fish.shelter&&this.coralMotion){
        const size=fish.size*fish.scale;
        this.coralMotion.drawOcclusion(c,t,fish.shelter.id,
          fish.x-size*1.5,fish.y-size*1.2,size*3,size*2.4,
          {reducedMotion:opts.reducedMotion,preset:opts.preset,intensity:this.w.coralMotion});
      }
    }
  }
  drawBottomWithCoral(c,t,depth,opts){
    for(const animal of this.creatures.bottomEngine.byDepth(depth)){
      drawBottomCreature(c,animal,t);
      if(animal.type==='crab'&&animal.state==='coral-hide'&&this.coralMotion){
        this.coralMotion.drawOcclusion(c,t,'coral_hide_01',
          animal.x-28,animal.y-22,56,40,
          {reducedMotion:opts.reducedMotion,preset:opts.preset,intensity:this.w.coralMotion});
      }
    }
  }
  render(t,dt){
    const c=this.ctx,w=this.w;
    c.clearRect(0,0,W,H);
    this.atmo.draw(c,t,dt);
    const opts={preset:w.renderQuality,reducedMotion:this.reducedMotion,time:w.time,detail:w.waterVisibility};
    const led=ledLevels({on:w.ledOn,intensity:w.ledIntensity,time:w.time,weather:w.weather});
    this.water.update(dt,t,opts);
    c.save();c.beginPath();
    c.rect(tank.left,tank.top,tank.right-tank.left,tank.bottom-tank.top);c.clip();
    this.water.drawBack(c,t,opts);
    this.drawFishWithCoral(c,t,'back',opts);
    this.water.drawLight(c,t,{...opts,detail:opts.detail*(.25+.75*led.power)});
    this.drawFishWithCoral(c,t,'mid',opts);
    this.drawBottomWithCoral(c,t,'back',opts);
    // Both separated aquatic plants sway on their own lower scene canvas.
    this.drawBottomWithCoral(c,t,'front',opts);
    this.drawFishWithCoral(c,t,'front',opts);
    this.water.drawFront(c,t,opts);
    paintAquariumFishReflection(c,{strength:led.fishReflection,time:t,quality:w.renderQuality});
    for(const pellet of w.feed){
      c.fillStyle='#ecc48e';c.beginPath();c.arc(pellet.x,pellet.y,2.5,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
}
