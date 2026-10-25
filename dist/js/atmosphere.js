import {WindowSystem} from './window-system.js';
export class Atmosphere {
 constructor(world){this.world=world;this.window=new WindowSystem(world);}
 draw(c,t,dt){this.window.draw(c,t,dt);}
}
