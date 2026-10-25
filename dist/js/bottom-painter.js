/** Illustrated Canvas2D miniature bottom animals; no extra asset downloads. */
const TAU=Math.PI*2;
const ellipse=(c,x,y,rx,ry,fill=true)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);fill?c.fill():c.stroke();};
const line=(c,pts)=>{c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.stroke();};
function drawCrab(c,e,t) {
  const gait = ['rest','probe','graze','hide'].includes(e.state) ? .16:1;
  const sway=Math.sin(e.walk)*gait*2;
  const busy=e.state==='graze'||e.state==='probe';
  const pincers=busy?Math.sin((e.claw||0)+e.phase)*3.2:Math.sin(t*1.4+e.phase)*1.1;
  c.strokeStyle='#a9583c';c.lineWidth=2.2;c.lineCap='round';
  for(let sign of [-1,1]){
    for(let j=0;j<3;j++){
      const x=sign*(7+j*2), foot=sign*(23+j*2);
      line(c,[[x,2],[sign*(14+j*2),7+sway*(j%2?1:-1)],[foot,14+j*.8]]);
    }
    // Jointed pincers sit above the shell and open subtly.
    line(c,[[sign*9,-4],[sign*18,-11-(busy?1:0)],[sign*25,-12-pincers*.4]]);
    c.fillStyle='#e88b54';ellipse(c,sign*26,-13-pincers*.4,6.5,5.1);
    c.strokeStyle='#9b563b';c.lineWidth=1.6;
    line(c,[[sign*25,-14-pincers*.4],[sign*31,-19-pincers]]);
    line(c,[[sign*26,-13-pincers*.4],[sign*31,-9+pincers*.25]]);
  }
  const g=c.createLinearGradient(0,-10,0,12);
  g.addColorStop(0,'#ffb473');g.addColorStop(.55,'#d56e46');g.addColorStop(1,'#8c4a3d');
  c.fillStyle=g;ellipse(c,0,0,15.5,9);
  c.fillStyle='rgba(255,233,181,.28)';ellipse(c,-3,-3,8,2.7);
  c.strokeStyle='#774638';c.lineWidth=1.6;
  line(c,[[-6,-7],[-7,-13]]);line(c,[[6,-7],[7,-13]]);
  c.fillStyle='#faefcc';ellipse(c,-7,-13,3,3);ellipse(c,7,-13,3,3);
  c.fillStyle='#2a282c';ellipse(c,-7,-13,.95,1.2);ellipse(c,7,-13,.95,1.2);
  c.strokeStyle='rgba(91,42,35,.7)';c.lineWidth=1.1;
  line(c,[[-4,4],[0,5],[4,4]]);
}
function drawShrimp(c,e,t) {
  // The shrimp faces right in local coordinates. Its animated body is segmented,
  // with fine antennae and eight tiny legs instead of a single curved stroke.
  const feeding=e.state==='graze';
  const darting=e.state==='dart';
  const wiggle=Math.sin(e.stride+e.phase)*(darting?2.1:feeding?1.2:.9);
  const body=c.createLinearGradient(0,-9,0,7);
  body.addColorStop(0,'#ffe4c2');body.addColorStop(.52,'#f79a71');body.addColorStop(1,'#cb6971');
  c.fillStyle=body;
  for(let i=0;i<6;i++){
    const x=9-i*4.4, y=-2+Math.sin(i*.48)*4;
    ellipse(c,x,y,5-i*.3,4.2-i*.17);
    c.strokeStyle='rgba(173,82,79,.6)';c.lineWidth=.8;
    c.beginPath();c.ellipse(x,y,4.6-i*.3,3.7-i*.17,0,.3,2);c.stroke();
  }
  c.fillStyle='#e77b77';ellipse(c,-16,2+wiggle*.35,4.8,2.8);
  c.strokeStyle='rgba(255,234,207,.74)';c.lineWidth=.9;c.lineCap='round';
  for(let i=0;i<5;i++){
    const x=-10+i*4.4;
    line(c,[[x,1],[x-1.2,7+wiggle*(feeding?1.5:1)],[x+1,11]]);
  }
  // Two long antennae softly move while the shrimp pauses.
  const a=Math.sin(t*(feeding?4:1.8)+e.phase)*(feeding?4:3);
  c.strokeStyle='rgba(252,224,191,.85)';c.lineWidth=.9;
  c.beginPath();c.moveTo(11,-6);c.quadraticCurveTo(20,-20+a,35,-17+a);c.stroke();
  c.beginPath();c.moveTo(11,-6);c.quadraticCurveTo(24,-24-a,39,-11-a);c.stroke();
  c.fillStyle='#282a36';ellipse(c,9,-6,1.55,1.6);
  c.fillStyle='rgba(255,255,255,.86)';ellipse(c,9.45,-6.55,.53,.53);
}
function drawSnail(c,e,t) {
  const stretch=e.state==='creep'?Math.sin(t*.7+e.phase)*.6:0;
  const feeler=e.state==='rest'?0:Math.sin(t*1.15+e.phase)*.65;
  c.fillStyle='rgba(17,36,34,.25)';ellipse(c,0,8.6,14,2.7);
  c.fillStyle=e.surface==='rock'?'#dec9a1':'#d8d5af';
  ellipse(c,3+stretch,5.5,15,4.4);
  c.fillStyle='#bf8a59';ellipse(c,-2,-2,10.5,10.5);
  const spiral=c.createLinearGradient(-9,-12,5,10);
  spiral.addColorStop(0,'#f7d8a0');spiral.addColorStop(.5,'#be8052');spiral.addColorStop(1,'#7b533f');
  c.fillStyle=spiral;ellipse(c,-2,-3,9,8.8);
  c.strokeStyle='#835641';c.lineWidth=1.25;
  c.beginPath();for(let i=0;i<33;i++){
    const theta=i*.33,r=7-i*.18;
    const x=-2+Math.cos(theta)*r, y=-3+Math.sin(theta)*r;
    i===0?c.moveTo(x,y):c.lineTo(x,y);
  }c.stroke();
  c.strokeStyle='#d9c9a1';c.lineWidth=1.3;
  line(c,[[10,3],[12,-8],[13+stretch+feeler,-12]]);
  line(c,[[14,3],[17,-7],[18+stretch-feeler,-11]]);
  c.fillStyle='#263b34';ellipse(c,13+stretch+feeler,-12,1.1,1.1);ellipse(c,18+stretch-feeler,-11,1.1,1.1);
}
export function drawBottomCreature(c,e,time){
  if(!Number.isFinite(e.x)||!Number.isFinite(e.y))return;
  c.save();c.translate(e.x,e.y);
  if(e.type==='snail' && e.surface==='left-glass'){c.rotate(-Math.PI/2);c.scale(e.size||1,e.size||1);}
  else if(e.type==='snail' && e.surface==='right-glass'){c.rotate(Math.PI/2);c.scale(e.size||1,e.size||1);}
  else {c.scale((e.dir||1)*(e.size||1),e.size||1);
    if(e.type==='shrimp'&&e.state==='dart')c.rotate(-.13);
  }
  c.globalAlpha*=e.opacity??1;
  if(e.type==='crab')drawCrab(c,e,time);
  else if(e.type==='shrimp')drawShrimp(c,e,time);
  else if(e.type==='snail')drawSnail(c,e,time);
  c.restore();
}
