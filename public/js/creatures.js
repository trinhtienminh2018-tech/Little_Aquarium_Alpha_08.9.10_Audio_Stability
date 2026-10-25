import { FishLife } from './fish-life.js';
import { drawFish } from './fish-painter.js';
import { BottomLife } from './bottom-life.js';
import { drawBottomCreature } from './bottom-painter.js';

/** Composition root: fish and bottom animals have independent navigation. */
export class Creatures {
 constructor(world){
   this.world=world;
   this.fishEngine=new FishLife(world);
   this.bottomEngine=new BottomLife(world);
   this.fish=this.fishEngine.fish;
   this.crabs=this.bottomEngine.crabs;
   this.shrimps=this.bottomEngine.shrimps;
   this.snails=this.bottomEngine.snails;
 }
 setFish(n){this.fishEngine.setCount(n);this.fish=this.fishEngine.fish;}
 setSpeciesCounts(counts){this.fishEngine.setSpeciesCounts(counts);this.fish=this.fishEngine.fish;}
 setBottomCounts(counts){this.bottomEngine.setCounts(counts);this.crabs=this.bottomEngine.crabs;this.shrimps=this.bottomEngine.shrimps;this.snails=this.bottomEngine.snails;}
 update(dt){this.fishEngine.update(dt);this.bottomEngine.update(dt,this.fishEngine.fish);}
 drawFishDepth(ctx,t,depth){for(const f of this.fishEngine.byDepth(depth))drawFish(ctx,f,t);}
 drawBottomDepth(ctx,t,depth){for(const animal of this.bottomEngine.byDepth(depth))drawBottomCreature(ctx,animal,t);}
 drawBottom(ctx,t){this.drawBottomDepth(ctx,t,'back');this.drawBottomDepth(ctx,t,'front');}
 speciesSummary(){return this.fishEngine.counts();}
 bottomSummary(){return this.bottomEngine.counts();}
}
