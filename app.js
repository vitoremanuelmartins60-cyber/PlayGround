import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x080817);
scene.fog=new THREE.FogExp2(0x080817,.0068);
const camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,.1,350);
camera.position.set(0,1.7,8);
const player=new THREE.Group(); player.position.set(0,0,8); scene.add(player); player.add(camera);

const hemi=new THREE.HemisphereLight(0x9b83ff,0x16052b,1.8); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffb0ed,2.2); sun.position.set(-30,45,25); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); scene.add(sun);

const mats={
  ground:new THREE.MeshStandardMaterial({color:0x16132d,roughness:.72}),
  road:new THREE.MeshStandardMaterial({color:0x26233d,roughness:.78}),
  neonPink:new THREE.MeshStandardMaterial({color:0xff38c7,emissive:0xff168f,emissiveIntensity:2.6}),
  neonBlue:new THREE.MeshStandardMaterial({color:0x39d8ff,emissive:0x087cff,emissiveIntensity:2.4}),
  neonGreen:new THREE.MeshStandardMaterial({color:0x9aff39,emissive:0x63cf12,emissiveIntensity:1.8}),
  metal:new THREE.MeshStandardMaterial({color:0x31304a,roughness:.38,metalness:.7}),
  skin:new THREE.MeshStandardMaterial({color:0x9a6245,roughness:.8}),
  white:new THREE.MeshStandardMaterial({color:0xf1ecff,roughness:.65}),
  dark:new THREE.MeshStandardMaterial({color:0x11111f,roughness:.75}),
  enemy:new THREE.MeshStandardMaterial({color:0x5b1d68,roughness:.55}),
};

function mesh(geo,mat,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
function box(x,y,z,sx,sy,sz,mat){return mesh(new THREE.BoxGeometry(sx,sy,sz),mat,x,y,z)}

// Arena floor
mesh(new THREE.CircleGeometry(82,64),mats.ground,0,-.08,0).rotation.x=-Math.PI/2;
for(let i=-70;i<=70;i+=10){box(i,-.035,0,.06,.02,140,mats.neonBlue);box(0,-.035,i,140,.02,.06,mats.neonPink)}
// Base platform and stage
box(0,.15,-34,46,4,18,mats.metal);
box(0,2.25,-42,38,.28,3,mats.neonPink);
for(let i=-16;i<=16;i+=8){const b=box(i,1,-34,4,2,4,mats.dark);b.rotation.y=i*.04}

// Funk blocks, speaker stacks and neon skyline
const obstacles=[];
function addObstacle(x,z,w,d,h=3,mat=mats.metal){const b=box(x,h/2,z,w,h,d,mat);obstacles.push({x,z,w,d});return b}
for(const p of [[-30,-22,10,7],[30,-22,10,7],[-48,-5,8,12],[48,-5,8,12],[-32,24,14,8],[32,24,14,8],[-12,-11,7,7],[12,-11,7,7],[-58,28,12,8],[58,28,12,8]])addObstacle(p[0],p[1],p[2],p[3]);
for(let i=0;i<30;i++){
  const a=i/30*Math.PI*2,r=38+Math.random()*20,x=Math.cos(a)*r,z=Math.sin(a)*r;
  const h=4+Math.random()*12;box(x,h/2,z,3+Math.random()*5,h,3+Math.random()*5,Math.random()>.5?mats.dark:mats.metal);
}
// Speaker wall
for(const side of [-1,1])for(let i=0;i<4;i++){const s=box(side*(26+i*3),2,-46,5,4,3,mats.dark);for(let j=0;j<2;j++){const cone=mesh(new THREE.CylinderGeometry(1.15,1.15,.25,24),mats.neonPink,side*(26+i*3),1.1+j*1.8,-47.6);cone.rotation.x=Math.PI/2}}

// Player model
const body=new THREE.Group(); player.add(body);
const torso=mesh(new THREE.CapsuleGeometry(.34,.65,5,10),mats.white,0,1.05,0); body.add(torso);
const vest=mesh(new THREE.BoxGeometry(.72,.65,.38),mats.neonPink,0,1.15,-.02); body.add(vest);
for(const s of [-1,1]){const leg=mesh(new THREE.CapsuleGeometry(.12,.55,4,8),mats.dark,s*.16,.38,.03);body.add(leg)}
const gun=new THREE.Group(); gun.position.set(.42,.95,-.55); body.add(gun);
const barrel=mesh(new THREE.BoxGeometry(.1,.1,.75),mats.metal,.42,.95,-.55);body.remove(barrel); gun.add(barrel);

// Storm dome visual
const stormGeo=new THREE.SphereGeometry(78,48,24);
const stormMat=new THREE.MeshBasicMaterial({color:0x8d36ff,transparent:true,opacity:.08,side:THREE.BackSide,depthWrite:false});
const storm=mesh(stormGeo,stormMat,0,0,0);storm.receiveShadow=false;

const keys=new Set(), clock=new THREE.Clock();
let yaw=0,pitch=-.05,started=false,vertical=0,health=100,ammo=24,score=0,kills=0,zoneRadius=78,matchTime=150,lock=false,gameOver=false;
const enemies=[];

function spawnEnemy(i){
  const a=i/12*Math.PI*2,r=28+Math.random()*38;
  const g=new THREE.Group();g.position.set(Math.cos(a)*r,0,Math.sin(a)*r);scene.add(g);
  const t=mesh(new THREE.CapsuleGeometry(.28,.65,5,9),mats.enemy,0,1,0);g.add(t);
  const h=mesh(new THREE.SphereGeometry(.25,12,8),mats.skin,0,1.58,0);g.add(h);
  for(const s of [-1,1]){const l=mesh(new THREE.CapsuleGeometry(.11,.5,4,8),mats.dark,s*.15,.38,0);g.add(l)}
  enemies.push({group:g,hp:60,shot:Math.random()*2,speed:1.5+Math.random()*1.2,radius:50});
}
for(let i=0;i<12;i++)spawnEnemy(i);

function updateHUD(){
  $('energyVal').textContent=Math.ceil(health);$('hungerVal').textContent=ammo;$('socialVal').textContent=kills;$('stressVal').textContent=Math.ceil(zoneRadius);
  $('energyBar').style.width=health+'%';$('hungerBar').style.width=(ammo/24*100)+'%';$('socialBar').style.width=(kills/12*100)+'%';$('stressBar').style.width=Math.max(0,zoneRadius/78*100)+'%';
  $('clock').textContent='0:'+String(Math.ceil(matchTime)).padStart(2,'0');$('mobileClock').textContent=`KILL ${kills}`;
  $('objectiveText').textContent=`Fique vivo · Elimine todos · Balas ${ammo}`;
  $('nearbyCount').textContent=enemies.length;$('pulseText').textContent='CAOS';$('outlook').textContent='Ocupado';
}

const bullets=[],particles=[];
function shoot(){
  if(gameOver||ammo<=0)return;
  ammo--;updateHUD();
  const origin=new THREE.Vector3(),dir=new THREE.Vector3();camera.getWorldPosition(origin);camera.getWorldDirection(dir);
  const b=mesh(new THREE.SphereGeometry(.055,8,6),mats.neonPink,origin.x,origin.y,origin.z);b.userData={vel:dir.multiplyScalar(42),life:1.6};bullets.push(b);
  gunKick=.12;
}
let gunKick=0;

function blocked(x,z){
  if(Math.hypot(x,z)>zoneRadius+8)return true;
  for(const o of obstacles)if(Math.abs(x-o.x)<o.w/2+.38&&Math.abs(z-o.z)<o.d/2+.38)return true;
  return false;
}

function move(dt){
  const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0);
  const side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
  const len=Math.hypot(forward,side)||1;
  const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight');
  const speed=(sprint?9:5.8)/len;
  const v=new THREE.Vector3(side,0,-forward).multiplyScalar(speed*dt).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  if(!blocked(player.position.x+v.x,player.position.z))player.position.x+=v.x;
  if(!blocked(player.position.x,player.position.z+v.z))player.position.z+=v.z;
  player.position.y+=vertical*dt;vertical-=12*dt;if(player.position.y<0){player.position.y=0;vertical=0}
  body.position.y=Math.abs(Math.sin(clock.elapsedTime*(sprint?13:9)))*(.03*(forward||side?1:0));
  gun.position.z=-.55+(gunKick>0?gunKick:0);gunKick=Math.max(0,gunKick-dt);
}

function findFocus(){
  let best=null,bd=999;
  for(const e of enemies){const d=e.group.position.distanceTo(player.position);if(d<bd){bd=d;best=e}}
  $('interactionHint').classList.toggle('visible',!!best&&bd<18);
  if(best&&bd<18)$('interactionHint').innerHTML=`<kbd>ATIRA</kbd><span>${bd<8?'PERTO':'DÁ O CORTE!'}</span>`;
}

function burst(p,color=0xff38c7){for(let i=0;i<10;i++){const s=mesh(new THREE.SphereGeometry(.04,5,4),new THREE.MeshBasicMaterial({color}),p.x,p.y,p.z);s.userData={vel:new THREE.Vector3((Math.random()-.5)*5,Math.random()*4,(Math.random()-.5)*5),life:.6};particles.push(s)}}

function enemyUpdate(dt){
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i],g=e.group;const dx=player.position.x-g.position.x,dz=player.position.z-g.position.z,dist=Math.hypot(dx,dz);
    if(dist>2.2&&!blocked(g.position.x+dx/dist*e.speed*dt,g.position.z+dz/dist*e.speed*dt)){g.position.x+=dx/dist*e.speed*dt;g.position.z+=dz/dist*e.speed*dt}
    g.rotation.y=Math.atan2(dx,dz);
    e.shot-=dt;if(dist<18&&e.shot<0){e.shot=1.2+Math.random();health-=dist<7?9:4;burst(g.position.clone().add(new THREE.Vector3(0,1,0)),0x39d8ff);updateHUD();if(health<=0)endMatch(false)}
  }
}

function bulletUpdate(dt){
  for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.position.addScaledVector(b.userData.vel,dt);b.userData.life-=dt;
    let hit=false;
    for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(e.group.position.distanceTo(b.position)<1.15){e.hp-=34;hit=true;burst(b.position);if(e.hp<=0){burst(e.group.position.clone().add(new THREE.Vector3(0,1,0)),0xff38c7);scene.remove(e.group);enemies.splice(j,1);kills++;score+=1000;if(!enemies.length)endMatch(true)}break}}
    if(hit||b.userData.life<=0||blocked(b.position.x,b.position.z)){scene.remove(b);bullets.splice(i,1)}
  }
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.position.addScaledVector(p.userData.vel,dt);p.userData.vel.y-=8*dt;p.userData.life-=dt;if(p.userData.life<=0){scene.remove(p);particles.splice(i,1)}}
}

function endMatch(win){if(gameOver)return;gameOver=true;$('modalContent').innerHTML=`<div class="modal-kicker">FUNK ROYALE</div><h2>${win?'#1 BRILHOU!':'VOCÊ CAIU'}</h2><p>${kills} eliminados · ${score} pontos · ${win?'A batida é sua.':'Levante e volte mais forte.'}</p><div class="modal-options"><button class="choice" id="restartChoice"><strong>Jogar de novo</strong><small>Recomeçar no baile</small></button></div>`;$('modalBackdrop').classList.add('open');$('restartChoice').onclick=()=>location.reload()}

function setView(){camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch}
function updateZone(dt){if(matchTime>0){matchTime-=dt;if(matchTime<75)zoneRadius-=dt*.22;storm.scale.setScalar(zoneRadius/78)}if(Math.hypot(player.position.x,player.position.z)>zoneRadius)health-=6*dt}

function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);if(started&&!gameOver){moveWithTouch(dt);enemyUpdate(dt);bulletUpdate(dt);findFocus();updateZone(dt);updateHUD()}renderer.render(scene,camera)}
frame();

// Rename interface for the battle theme
$('districtLabel').textContent='BAILE ZONE · RIO 2.0';
$('playerName').textContent='MC NOVATO';$('occupation').textContent='Sobrevivente Funk';
$('mobileClock').textContent='KILL 0';
$('saveButton').style.display='none';$('statusButton').textContent='♥';

$('beginButton').onclick=()=>{started=true;$('startScreen').classList.add('hidden');if(matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.();$('objectiveText').textContent='Fique vivo · Elimine todos';toast('Entre no baile — sobrevive quem manda mais!')};

document.addEventListener('pointerlockchange',()=>lock=document.pointerLockElement===canvas);
document.addEventListener('mousemove',e=>{if(!lock||!started||gameOver)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0019;pitch=Math.max(-1.28,Math.min(1.28,pitch));setView()});
document.addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='Space'){e.preventDefault();if(player.position.y<=.01)vertical=5.2}if(e.code==='KeyE'||e.code==='KeyF'||e.code==='KeyJ')shoot();if(e.code==='KeyR'){ammo=24;updateHUD()}});
document.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('mousedown',e=>{if(e.button===0&&started&&!gameOver){if(!lock)canvas.requestPointerLock?.();shoot()}});

// Touch controls
let touchMove={x:0,y:0},movePointer=null,lookPointers=new Map();
const pad=$('movePad'),stick=$('moveStick');
function updatePad(e){const r=pad.getBoundingClientRect(),radius=Math.min(r.width,r.height)*.32;let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),d=Math.hypot(dx,dy),s=d>radius?radius/d:1;dx*=s;dy*=s;stick.style.transform=`translate(${dx}px,${dy}px)`;touchMove={x:dx/radius,y:dy/radius}}
pad.addEventListener('pointerdown',e=>{movePointer=e.pointerId;pad.setPointerCapture(e.pointerId);updatePad(e)});pad.addEventListener('pointermove',e=>{if(e.pointerId===movePointer)updatePad(e)});pad.addEventListener('pointerup',()=>{touchMove={x:0,y:0};stick.style.transform='translate(0,0)'});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX>innerWidth*.42){lookPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{const p=lookPointers.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;yaw-=dx*.005;pitch=Math.max(-1.28,Math.min(1.28,pitch-dy*.004));setView()});
canvas.addEventListener('pointerup',e=>lookPointers.delete(e.pointerId));
$('touchInteract').addEventListener('click',shoot);$('touchJump').addEventListener('click',()=>{if(player.position.y<=.01)vertical=5.2});

// Keyboard WASD integrates touch joystick through keys unavailable to touch
function moveWithTouch(dt){
  const backup=new Set(keys);
  if(touchMove.y<-.15)keys.add('KeyW');
  if(touchMove.y>.15)keys.add('KeyS');
  if(touchMove.x>.15)keys.add('KeyD');
  if(touchMove.x<-.15)keys.add('KeyA');
  move(dt);
  keys.clear();
  for(const k of backup)keys.add(k);
}

window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
updateHUD();