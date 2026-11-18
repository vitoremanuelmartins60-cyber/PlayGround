import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const app=document.querySelector('#app');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9eb1a5); scene.fog=new THREE.FogExp2(0x9eb1a5,.012);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,1600);camera.position.set(0,8,38);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;app.appendChild(renderer.domElement);

const sun=new THREE.HemisphereLight(0xeaf4dc,0x53634f,2.2);scene.add(sun);
const sunDir=new THREE.DirectionalLight(0xfff1ca,3);sunDir.position.set(-30,55,20);sunDir.castShadow=true;sunDir.shadow.mapSize.set(2048,2048);sunDir.shadow.camera.left=-80;sunDir.shadow.camera.right=80;sunDir.shadow.camera.top=80;sunDir.shadow.camera.bottom=-80;scene.add(sunDir);

const world=new THREE.Group();scene.add(world);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshStandardMaterial({color:0x71866d,roughness:.95}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;world.add(ground);

// Winding paths
const pathMat=new THREE.MeshStandardMaterial({color:0xb5af91,roughness:1});
for(let i=0;i<7;i++){const c=new THREE.Mesh(new THREE.CircleGeometry(1+Math.random()*2,18),pathMat);c.rotation.x=-Math.PI/2;c.position.set(Math.sin(i*.9)*25+i*3-.1,.015,20-i*12);c.scale.set(2.8,1,1);c.receiveShadow=true;world.add(c)}

const effects=new THREE.Group();scene.add(effects);
const objects=[];
function rand(a,b){return a+Math.random()*(b-a)}
function addTree(x,z,s=1){const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.45,.7,4*s,7),new THREE.MeshStandardMaterial({color:0x5b4936,roughness:1}));trunk.position.y=2*s;trunk.castShadow=true;g.add(trunk);const leafMat=new THREE.MeshStandardMaterial({color:[0x415c43,0x55734c,0x697f50][Math.floor(Math.random()*3)],roughness:.9});for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.IcosahedronGeometry((3-i*.55)*s,1),leafMat);crown.position.y=(4+i*1.7)*s;crown.scale.set(1,1.15,1);crown.castShadow=true;g.add(crown)}g.position.set(x,0,z);world.add(g);objects.push(g)}
function addRock(x,z,s=1){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(s*1.7,0),new THREE.MeshStandardMaterial({color:0x77776c,roughness:1}));r.scale.set(1.4,.65,1);r.position.set(x,.7*s,z);r.rotation.set(Math.random(),Math.random(),Math.random());r.castShadow=true;r.receiveShadow=true;world.add(r)}
for(let i=0;i<70;i++){let x=(Math.random()-.5)*150,z=(Math.random()-.5)*150;if(Math.abs(x)<12&&z>-20&&z<35)continue;Math.random()<.82?addTree(x,z,.7+Math.random()*.7):addRock(x,z,.7+Math.random())}

// House / landmark
const hut=new THREE.Group();hut.position.set(-24,0,-20);
const base=new THREE.Mesh(new THREE.BoxGeometry(12,7,9),new THREE.MeshStandardMaterial({color:0xded8bd,roughness:.9}));base.position.y=3.5;base.castShadow=true;base.receiveShadow=true;hut.add(base);
const roof=new THREE.Mesh(new THREE.ConeGeometry(9.5,5,4),new THREE.MeshStandardMaterial({color:0x5b4a3b,roughness:1}));roof.position.y=8.8;roof.rotation.y=Math.PI/4;roof.scale.z=.85;roof.castShadow=true;hut.add(roof);
const door=new THREE.Mesh(new THREE.BoxGeometry(3,4.5,.25),new THREE.MeshStandardMaterial({color:0x3e3529}));door.position.set(0,2.25,4.55);hut.add(door);world.add(hut);

// glowing mushrooms
for(let i=0;i<18;i++){const m=new THREE.Group();const s=.4+Math.random()*.5;const stem=new THREE.Mesh(new THREE.CylinderGeometry(.16*s,.22*s,.8*s,8),new THREE.MeshStandardMaterial({color:0xe8dfca}));stem.position.y=.4*s;m.add(stem);const cap=new THREE.Mesh(new THREE.SphereGeometry(.5*s,12,8),new THREE.MeshStandardMaterial({color:0xff7448,emissive:0x6c1d09,emissiveIntensity:.15}));cap.scale.y=.45;cap.position.y=.85*s;m.add(cap);m.position.set(-30+Math.random()*60,.0,-30+Math.random()*55);world.add(m)}

const controls=new PointerLockControls(camera,renderer.domElement);let locked=false;renderer.domElement.addEventListener('click',()=>{if(matchMedia('(pointer:fine)').matches&&!locked)controls.lock()});controls.addEventListener('lock',()=>locked=true);controls.addEventListener('unlock',()=>locked=false);

const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Space'&&onGround){velocityY=10;onGround=false}});addEventListener('keyup',e=>keys[e.code]=false);
let velocityY=0,onGround=true;
const joy={x:0,y:0,active:false};const pad=document.querySelector('#mobilePad'),stick=document.querySelector('#stick');
function joyMove(e){e.preventDefault?.();const t=e.touches?e.touches[0]:e,b=pad.getBoundingClientRect(),cx=b.left+b.width/2,cy=b.top+b.height/2;const dx=t.clientX-cx,dy=t.clientY-cy;const len=Math.hypot(dx,dy)||1,cl=Math.min(len,38);joy.x=dx/38;joy.y=dy/38;stick.style.transform=`translate(${dx/len*cl}px,${dy/len*cl}px)`}
pad.addEventListener('touchstart',e=>{joy.active=true;joyMove(e)},{passive:false});pad.addEventListener('touchmove',e=>{joy.active=true;joyMove(e)},{passive:false});pad.addEventListener('touchend',()=>{joy.active=false;joy.x=joy.y=0;stick.style.transform=''});
document.querySelector('#jump').addEventListener('touchstart',()=>{if(onGround){velocityY=10;onGround=false}});

function clearEffects(){for(const o of [...effects.children]){effects.remove(o);o.traverse?.(c=>{c.geometry?.dispose?.();c.material?.dispose?.()})}effects.visible=true}
function makeClouds(n=18){clearEffects();const mat=new THREE.MeshStandardMaterial({color:0xf3f1df,roughness:1,transparent:true,opacity:.88});for(let i=0;i<n;i++){const g=new THREE.Group();for(let j=0;j<5;j++){const c=new THREE.Mesh(new THREE.SphereGeometry(4+Math.random()*3,12,8),mat);c.position.set(j*4.5,Math.random()*1.5,Math.random()*2);c.scale.y=.55;c.castShadow=true;g.add(c)}g.position.set((Math.random()-.5)*180,30+Math.random()*25,(Math.random()-.5)*150);g.userData.speed=.03+Math.random()*.03;effects.add(g)}}
function rain(){clearEffects();const geo=new THREE.BufferGeometry();const ps=[];for(let i=0;i<900;i++)ps.push((Math.random()-.5)*180,rand(5,70),(Math.random()-.5)*150);geo.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));const points=new THREE.Points(geo,new THREE.PointsMaterial({color:0xdde9ef,size:.12,transparent:true,opacity:.75}));effects.add(points)}
function fire(){clearEffects();for(let i=0;i<130;i++){const p=new THREE.Mesh(new THREE.IcosahedronGeometry(.12+Math.random()*.25,1),new THREE.MeshBasicMaterial({color:Math.random()>.35?0xff7448:0xffc447}));p.position.set((Math.random()-.5)*100,rand(.5,25),(Math.random()-.5)*100);p.userData.base=p.position.y;p.userData.phase=Math.random()*6.28;effects.add(p)}}
function moon(){clearEffects();const m=new THREE.Mesh(new THREE.SphereGeometry(13,32,32),new THREE.MeshBasicMaterial({color:0xfff4c9}));m.position.set(-58,48,-95);effects.add(m);scene.background=new THREE.Color(0x506378);scene.fog.color.set(0x506378);sun.intensity=.8}
function forest(){clearEffects();for(let i=0;i<24;i++)addTree((Math.random()-.5)*110,(Math.random()-.5)*110,.8+Math.random()*1.2)}

function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(el.t);el.t=setTimeout(()=>el.classList.remove('show'),1500)}
function interpret(text){const t=text.toLowerCase();clearEffects();scene.background.set(0x9eb1a5);scene.fog.color.set(0x9eb1a5);sun.intensity=2.2;if(/chuva|rain|nublado/.test(t)&&!/fogo|fire/.test(t)){rain();toast('🌧️ Nuvens de chuva chegaram')}else if(/fogo|fire|lava|inferno/.test(t)){fire();toast('🔥 Chuva de fogo ativada')}else if(/lua|moon|night|noite/.test(t)){moon();toast('🌙 Uma lua gigantesca apareceu')}else if(/floresta|forest|árvore|arvore/.test(t)){forest();toast('🌿 A floresta cresce')}else if(/nuvem|cloud|céu|ceu/.test(t)){makeClouds();toast('☁️ Céu preenchido')}else if(/deserto|duna|praia/.test(t)){ground.material.color.set(0xd1bd86);effects.visible=false;toast('🏜️ O deserto tomou conta')}else if(/gelo|snow|neve|inverno/.test(t)){ground.material.color.set(0xdbe4df);scene.background.set(0xd9e3e8);scene.fog.color.set(0xd9e3e8);toast('❄️ Mundo congelado')}else if(/rosa|pink|roxo|purple/.test(t)){ground.material.color.set(0x9b7f9c);scene.background.set(0xb69eb4);scene.fog.color.set(0xb69eb4);toast('💜 O mundo virou rosa')}else if(/sol|dia|sun/.test(t)){scene.background.set(0xbad8df);sun.intensity=3.5;toast('☀️ Dia claro')}else{makeClouds(8);toast('✨ “'+text+'” mudou o mundo')}}

document.querySelector('#promptForm').addEventListener('submit',e=>{e.preventDefault();const input=document.querySelector('#promptInput'),v=input.value.trim();if(v)interpret(v);input.blur()});document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>interpret(b.dataset.prompt));document.querySelector('#randomBtn').onclick=()=>interpret(['nuvens de chuva','floresta mágica','chuva de fogo','lua gigante','deserto','mundo de gelo'][Math.floor(Math.random()*6)]);

const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);const speed=(keys.ShiftLeft?24:13)*dt;
const forward=(keys.KeyW?1:0)-(keys.KeyS?1:0)-(joy.y||0);const right=(keys.KeyD?1:0)-(keys.KeyA?1:0)+(joy.x||0);if(forward||right){const direction=new THREE.Vector3(right,0,-forward).normalize();direction.applyAxisAngle(new THREE.Vector3(0,1,0),camera.rotation.y);camera.position.add(direction.multiplyScalar(speed))}
velocityY-=22*dt;camera.position.y+=velocityY*dt;if(camera.position.y<8){camera.position.y=8;velocityY=0;onGround=true}camera.position.x=THREE.MathUtils.clamp(camera.position.x,-140,140);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-140,140);
if(effects.visible){effects.children.forEach(o=>{if(o.children?.length&&o.userData.speed)o.position.x+=o.userData.speed*60*dt;if(o.userData.phase!==undefined){o.position.y=o.userData.base+Math.sin(clock.elapsedTime*2+o.userData.phase)*1.5;o.position.y=Math.max(.2,o.position.y)}});if(effects.children[0]?.geometry?.attributes?.position&&effects.children[0].type==='Points'){const pos=effects.children[0].geometry.attributes.position;for(let i=1;i<pos.array.length;i+=3){pos.array[i]-=28*dt;if(pos.array[i]<0)pos.array[i]=70}pos.needsUpdate=true}}
renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
