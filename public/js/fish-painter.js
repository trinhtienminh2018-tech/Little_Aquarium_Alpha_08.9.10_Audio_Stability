/** Illustrated Canvas2D fish sprites. No external fish assets to load.
 * Each species has a different silhouette, palette, dorsal/pectoral fins and
 * an animated tail. All marks are built in local fish-facing-right coordinates.
 */
const TWO_PI=Math.PI*2;
const ellipse=(c,x,y,rx,ry,fill,rotation=0)=>{c.beginPath();c.ellipse(x,y,Math.max(rx,.01),Math.max(ry,.01),rotation,0,TWO_PI);if(fill)c.fill();else c.stroke();};
const path=(c,pts,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill();};
function gradient(c,up,down){const g=c.createLinearGradient(0,-1.3,0,1.5);g.addColorStop(0,up);g.addColorStop(.54,down);g.addColorStop(1,'#192c3c');return g;}
function eye(c,x,y,scale=.095){c.fillStyle='rgba(250,253,251,.7)';ellipse(c,x+.015,y-.02,scale*1.18,scale*1.18,true);c.fillStyle='#18232b';ellipse(c,x+.022,y-.012,scale*.77,scale*.77,true);c.fillStyle='#fff9dd';ellipse(c,x+.045,y-.055,scale*.25,scale*.25,true);}
function tail(c,t,color,shape='fan'){
  c.save();c.translate(-1.12,0);c.rotate(t*.18);c.fillStyle=color;c.beginPath();
  if(shape==='fork'){c.moveTo(.12,0);c.lineTo(-.8,-.52);c.quadraticCurveTo(-.65,0,-.86,.55);c.closePath();}
  else if(shape==='rounded'){c.moveTo(.12,0);c.bezierCurveTo(-.60,-.60,-.85,-.48,-.66,0);c.bezierCurveTo(-.86,.48,-.58,.62,.12,0);}
  else {c.moveTo(.12,0);c.lineTo(-.70,-.65);c.lineTo(-.54,0);c.lineTo(-.7,.65);c.closePath();}
  c.fill();c.restore();
}
function fins(c,t,tint,flavour='default'){
  const wave=Math.sin(t)*.15;c.fillStyle=tint;
  c.beginPath();c.moveTo(-.64,-.49);c.quadraticCurveTo(-.28,-1.03,.38,-.66);c.lineTo(.56,-.34);c.closePath();c.fill();
  c.beginPath();c.moveTo(-.44,.45);c.quadraticCurveTo(-.24,.86,.39,.65);c.lineTo(.52,.30);c.closePath();c.fill();
  c.save();c.translate(.12,.14);c.rotate(wave);ellipse(c,-.12,.22,.43,.14,true,-.2);c.restore();
}
function body(c,rx,ry,primary,top){c.fillStyle=gradient(c,top,primary);ellipse(c,0,0,rx,ry,true);c.lineWidth=.065;c.strokeStyle='rgba(5,30,40,.31)';ellipse(c,0,0,rx,ry,false);}
function chromis(c,t,color){
  tail(c,Math.sin(t),color,'fork');fins(c,t,'rgba(104,234,221,.78)');
  body(c,1.07,.52,color,'#8aeeea');
  c.strokeStyle='rgba(220,255,243,.50)';c.lineWidth=.08;c.beginPath();c.moveTo(-.76,-.11);c.quadraticCurveTo(0,-.23,.86,-.10);c.stroke();
  c.fillStyle='rgba(250,253,226,.44)';ellipse(c,-.15,-.23,.62,.13,true,-.08);eye(c,.69,-.16,.11);
}
function clown(c,t,color){
  tail(c,Math.sin(t), '#ec7040','rounded');fins(c,t,'#db6736');body(c,1.04,.69,color,'#ffb25c');
  c.save();c.beginPath();c.ellipse(0,0,1.04,.69,0,0,TWO_PI);c.clip();
  for(const [x,w] of [[-.63,.22],[-.06,.28],[.62,.19]]){
    c.fillStyle='#203036';c.fillRect(x-w*.58,-.83,w*1.16,1.67);
    c.fillStyle='#fff6e1';c.fillRect(x-w*.39,-.83,w*.78,1.67);
  }
  c.restore();c.strokeStyle='#8c392c';c.lineWidth=.07;ellipse(c,0,0,1.04,.69,false);eye(c,.78,-.14,.10);
}
function yellow(c,t,color){
  tail(c,Math.sin(t),'#f4cb49','fan');
  path(c,[[-.63,-.42],[-.15,-.98],[.40,-.78],[.77,-.25]],'#ffdc53');
  body(c,1.0,.72,color,'#ffef79');
  c.fillStyle='#eed14e';ellipse(c,-.14,.49,.47,.14,true,-.28);
  c.strokeStyle='rgba(255,255,213,.64)';c.lineWidth=.052;c.beginPath();c.moveTo(-.70,-.22);c.quadraticCurveTo(-.05,-.37,.70,-.15);c.stroke();eye(c,.69,-.18,.10);
}
function blue(c,t,color){
  tail(c,Math.sin(t),'#ffcc42','fork');
  path(c,[[-.54,-.40],[-.03,-1.04],[.45,-.64],[.84,.04]],'#1e499e');
  body(c,1.03,.69,color,'#458ef2');
  c.strokeStyle='#0d2d72';c.lineWidth=.20;c.beginPath();c.moveTo(-.85,.03);c.bezierCurveTo(-.48,-.55,.02,-.55,.62,-.24);c.bezierCurveTo(.04,-.07,-.26,.44,-.77,.32);c.stroke();
  c.fillStyle='#ffd445';ellipse(c,-.37,.46,.43,.12,true,-.14);eye(c,.72,-.18,.096);
}
function goby(c,t,color){
  tail(c,Math.sin(t)*.42,'#c99b6c','rounded');
  path(c,[[-.62,-.32],[-.18,-.66],[.12,-.35],[.36,-.24]],'#be916a');
  body(c,1.21,.37,color,'#e8d5aa');
  c.strokeStyle='rgba(128,88,57,.56)';c.lineWidth=.12;c.beginPath();c.moveTo(-.88,0);c.bezierCurveTo(-.34,-.10,.20,.1,.85,-.02);c.stroke();
  for(let i=-2;i<=2;i++){c.fillStyle='rgba(153,103,66,.48)';ellipse(c,i*.32,-.17,.075,.058,true);}
  c.fillStyle='#d9b992';ellipse(c,-.05,.28,.43,.13,true);eye(c,.82,-.12,.10);
}
export function drawFish(c,f,time){
  const size=f.size*f.scale;
  let dir=f.facing??(f.vx<-.5?-1:f.vx>.5?1:(f.lastDir||1));
  f.lastDir=dir;
  const pitch=Math.max(-.32,Math.min(.32,Math.atan2(f.vy,Math.abs(f.vx)+10)));
  const bob=Math.sin(time*1.5+f.phase)*(.8+f.scale*.5)*(f.state==='rest'?.3:1);
  const wave=Math.sin(f.tail+f.phase);
  c.save();c.translate(f.x,f.y+bob);c.scale(dir,1);c.rotate(dir*pitch);c.scale(size,size);
  c.globalAlpha*=f.opacity;
  // Illustrated body shadow and thin sheen give volume without hard glow.
  c.fillStyle='rgba(2,20,36,.18)';ellipse(c,.09,.18,1.10,.60,true);
  switch(f.species){
    case 'chromis':chromis(c,f.tail,f.color);break;
    case 'clown':clown(c,f.tail,f.color);break;
    case 'yellow':yellow(c,f.tail,f.color);break;
    case 'blue':blue(c,f.tail,f.color);break;
    case 'goby':goby(c,f.tail,f.color);break;
    default:chromis(c,f.tail,f.color);
  }
  // Tiny animated fin is visible even while resting.
  c.fillStyle='rgba(242,247,222,.25)';c.save();c.translate(.06,.10);c.rotate(wave*.13);ellipse(c,-.1,.12,.33,.12,true,-.15);c.restore();
  c.restore();
}
