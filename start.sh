#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT > 0 && PORT < 65536 )) || { echo "PORT must be between 1 and 65535." >&2; exit 1; }

if [[ -f package.json ]]; then
  if [[ ! -d node_modules ]]; then
    if [[ -f package-lock.json ]]; then
      /usr/bin/time -p npm ci --no-audit --no-fund
    else
      /usr/bin/time -p npm install --no-audit --no-fund
    fi
  fi
  if node -e 'const p=require("./package.json"); process.exit(p.scripts?.build ? 0 : 1)'; then
    /usr/bin/time -p npm run build
  fi
fi

STATIC_DIR="${BUILD_DIR:-}"
# This repository can be provisioned without generated assets. Keep the saved
# project runnable by creating its static starter build inside the project.
if [[ -z "$STATIC_DIR" && ! -f "$PROJECT_DIR/index.html" && ! -f "$PROJECT_DIR/dist/index.html" && ! -f "$PROJECT_DIR/build/index.html" && ! -f "$PROJECT_DIR/out/index.html" ]]; then
  /usr/bin/time -p mkdir -p "$PROJECT_DIR/dist"
  /usr/bin/time -p tee "$PROJECT_DIR/dist/index.html" >/dev/null <<'HTML'
<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>Baile Royale</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#101023;color:#fff;font-family:system-ui,Arial}canvas{display:block;width:100%;height:100%;touch-action:none}.hud{position:fixed;inset:0;pointer-events:none;padding:18px}.brand{font-weight:1000;font-size:clamp(20px,4vw,36px);font-style:italic;letter-spacing:-2px;text-shadow:0 3px #7f2cff}.brand span{color:#ffdc2e}.stats{position:absolute;top:20px;right:20px;text-align:right;font-weight:800}.bar{height:11px;width:180px;background:#282840;border-radius:20px;margin-top:6px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#ff42ab,#ffdc2e);width:100%}.hint{position:absolute;left:18px;bottom:18px;color:#ddd;font-size:13px;text-shadow:0 2px #000}.toast{position:absolute;top:20%;left:50%;transform:translateX(-50%);background:#17152be8;border:1px solid #ffdc2e;border-radius:14px;padding:12px 20px;font-weight:900;text-align:center}.start{position:fixed;inset:0;display:grid;place-items:center;background:linear-gradient(#110e20aa,#110e20dd)}.card{padding:30px;text-align:center;width:min(90vw,480px);border:1px solid #ffffff35;border-radius:24px;background:#17152bf2;box-shadow:0 0 80px #ac29ff44}.card h1{font-size:clamp(34px,10vw,62px);line-height:.9;margin:8px 0 14px;font-style:italic}.card h1 span{color:#ffda24}.card p{color:#d5cee5}.btn{border:0;border-radius:99px;background:linear-gradient(100deg,#ff38a8,#ffcf25);color:#17111c;font-weight:1000;font-size:18px;padding:14px 30px;cursor:pointer;box-shadow:0 6px 0 #9c286d}.btn:active{transform:translateY(4px);box-shadow:0 2px 0 #9c286d}.mobile{display:none;position:fixed;bottom:28px;right:22px;gap:12px;pointer-events:auto}.mobile button{width:64px;height:64px;border:2px solid #ffffff66;border-radius:50%;background:#862dbaaa;color:#fff;font-size:24px;font-weight:900;touch-action:none}@media(max-width:700px){.mobile{display:flex}.hint{max-width:48%;font-size:11px}.bar{width:120px}.stats{font-size:12px}}
</style></head><body><canvas id="game"></canvas><div class="hud"><div class="brand">BAILE <span>ROYALE</span></div><div class="stats"><div id="count">SOBREVIVA À RODADA</div><div class="bar"><i id="life"></i></div><div id="ammo">⚡ 12 tiros · 0 abates</div></div><div class="hint">WASD mover · MOUSE mirar/atirar · SHIFT correr · sobreviva ao baile!</div><div class="toast" id="toast">Pegue os drops dourados para recuperar vida e munição.</div></div><div class="mobile"><button id="fire">♫</button><button id="dash">➤</button></div><div class="start" id="start"><div class="card"><div>🎧 🔥 🎧</div><h1>BAILE <span>ROYALE</span></h1><p>O último no baile vence. Derrote os rivais e fuja da tempestade!</p><button class="btn" id="play">ENTRAR NO BAILE</button><p style="font-size:12px">WASD + mouse · no celular use o botão ♫ e toque para mover</p></div></div>
<script>
(()=>{const c=document.querySelector('canvas'),x=c.getContext('2d'),life=document.querySelector('#life'),ammoEl=document.querySelector('#ammo'),count=document.querySelector('#count'),toast=document.querySelector('#toast'),overlay=document.querySelector('#start');let w,h,live=false,hp=100,ammo=12,kills=0,t=0,last=0,player={x:0,y:0},bullets=[],foes=[],drops=[],keys={},aim={x:0,y:0},fire=false,zone=900;const resize=()=>{w=c.width=innerWidth*devicePixelRatio;h=c.height=innerHeight*devicePixelRatio;x.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)};addEventListener('resize',resize);resize();function spawn(){foes=Array.from({length:9},(_,i)=>({x:(Math.random()-.5)*1400,y:(Math.random()-.5)*1400,hp:2,s:Math.random()*6.28,hit:0}));drops=[]}function screen(p){return{x:innerWidth/2+(p.x-player.x),y:innerHeight/2+(p.y-player.y)}}function shot(){if(ammo<=0)return;ammo--;let a=Math.atan2(aim.y-innerHeight/2,aim.x-innerWidth/2);bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*620,vy:Math.sin(a)*620,life:.85});ammoEl.textContent=`⚡ ${ammo} tiros · ${kills} abates`}function pointer(e){const r=c.getBoundingClientRect();aim={x:e.clientX-r.left,y:e.clientY-r.top}}c.addEventListener('pointermove',pointer);c.addEventListener('pointerdown',e=>{pointer(e);fire=true;shot()});c.addEventListener('pointerup',()=>fire=false);addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ')shot()});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);document.querySelector('#fire').onpointerdown=e=>{e.preventDefault();fire=true;shot()};document.querySelector('#fire').onpointerup=()=>fire=false;document.querySelector('#dash').onpointerdown=()=>{player.x+=(aim.x-innerWidth/2)*.5;player.y+=(aim.y-innerHeight/2)*.5};document.querySelector('#play').onclick=()=>{overlay.style.display='none';live=true;spawn();last=performance.now();requestAnimationFrame(loop)};function draw(){const W=innerWidth,H=innerHeight;x.fillStyle='#13132a';x.fillRect(0,0,W,H);let cx=W/2,cy=H/2;x.save();x.translate(cx-player.x,cy-player.y);x.strokeStyle='#282342';x.lineWidth=1;for(let i=-1800;i<1800;i+=80){x.beginPath();x.moveTo(i,-1800);x.lineTo(i,1800);x.stroke();x.beginPath();x.moveTo(-1800,i);x.lineTo(1800,i);x.stroke()}for(let i=0;i<14;i++){let px=Math.sin(i*37)*760,py=Math.cos(i*93)*760;x.fillStyle=['#a72fe0','#ff3f9f','#e7b929'][i%3];x.fillRect(px-28,py-18,56,36);x.fillStyle='#ffdc54';x.fillRect(px-8,py-24,16,6)}let radius=zone;let pulse=1+Math.sin(t*2)*.025;x.beginPath();x.arc(0,0,radius*pulse,0,7);x.strokeStyle='#9e56ff';x.lineWidth=5;x.stroke();for(const d of drops){x.fillStyle='#ffdf35';x.beginPath();x.arc(d.x,d.y,12+Math.sin(t*8)*3,0,7);x.fill();x.fillStyle='#fff4a8';x.fillRect(d.x-3,d.y-16,6,32)}for(const b of bullets){x.fillStyle='#ffeb69';x.beginPath();x.arc(b.x,b.y,5,0,7);x.fill()}for(const f of foes){x.fillStyle=f.hit>0?'#fff':'#fc449e';x.beginPath();x.arc(f.x,f.y,15,0,7);x.fill();x.fillStyle='#fff';x.fillRect(f.x-10,f.y-23,20,3);x.fillStyle='#ffdc36';x.fillRect(f.x-10,f.y-23,20*Math.max(0,f.hp/2),3);x.fillStyle='#171329';x.fillRect(f.x-8,f.y-3,5,4);x.fillRect(f.x+4,f.y-3,5,4)}x.fillStyle='#42e9ff';x.beginPath();x.arc(0,0,17,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(-5,-4,3,0,7);x.arc(5,-4,3,0,7);x.fill();x.restore();if(Math.hypot(player.x,player.y)>zone){x.fillStyle='#aa35ff20';x.fillRect(0,0,W,H)}}function loop(now){if(!live)return;let dt=Math.min(.04,(now-last)/1000);last=now;t+=dt;let speed=220*(keys.shift?1.55:1),dx=(keys.d?1:0)-(keys.a?1:0),dy=(keys.s?1:0)-(keys.w?1:0);if(dx||dy){let l=Math.hypot(dx,dy);player.x+=dx/l*speed*dt;player.y+=dy/l*speed*dt}zone=Math.max(210,900-t*4.4);if(fire&&t%0.22<dt)shot();for(const f of foes){f.s+=dt;let vx=player.x-f.x,vy=player.y-f.y,d=Math.hypot(vx,vy)||1;f.x+=vx/d*(d<480?68:Math.sin(f.s)*20)*dt;f.y+=vy/d*(d<480?68:Math.cos(f.s)*20)*dt;if(d<32&&Math.random()<dt*.55){hp-=8;life.style.width=Math.max(0,hp)+'%'}}for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const f of foes)if(f.hp>0&&Math.hypot(b.x-f.x,b.y-f.y)<20){f.hp--;f.hit=.1;b.life=0;if(f.hp<=0){kills++;if(Math.random()<.55)drops.push({x:f.x,y:f.y});f.x=9999;count.textContent=`${foes.filter(a=>a.hp>0).length} RIVAIS NO BAILE`}}}bullets=bullets.filter(b=>b.life>0);for(let i=drops.length-1;i>=0;i--)if(Math.hypot(drops[i].x-player.x,drops[i].y-player.y)<34){hp=Math.min(100,hp+24);ammo+=5;drops.splice(i,1);life.style.width=hp+'%';ammoEl.textContent=`⚡ ${ammo} tiros · ${kills} abates`;toast.textContent='DROP COLETADO! +vida +munição';setTimeout(()=>toast.textContent='Pegue os drops dourados para recuperar vida e munição.',1500)}if(hp<=0||foes.every(f=>f.hp<=0)){live=false;overlay.style.display='grid';document.querySelector('.card h1').innerHTML=hp>0?'VOCÊ <span>VENCEU!</span>':'FIM DE JOGO';document.querySelector('.card p').textContent=`${kills} rivais derrotados · Clique para jogar novamente`;document.querySelector('#play').textContent='JOGAR DE NOVO'}draw();requestAnimationFrame(loop)}draw()})();
</script></body></html>
HTML
fi
if [[ -z "$STATIC_DIR" ]]; then
  for candidate in dist build out; do
    if [[ -f "$PROJECT_DIR/$candidate/index.html" ]]; then
      STATIC_DIR="$PROJECT_DIR/$candidate"
      break
    fi
  done
fi
if [[ -z "$STATIC_DIR" && -f "$PROJECT_DIR/index.html" ]]; then
  STATIC_DIR="$PROJECT_DIR"
fi
[[ -n "$STATIC_DIR" ]] || { echo "No built static directory with index.html found in $PROJECT_DIR (expected dist/, build/, out/, or index.html)." >&2; exit 1; }
STATIC_DIR="$(cd "$STATIC_DIR" 2>/dev/null && pwd)" || { echo "Build directory does not exist: $STATIC_DIR" >&2; exit 1; }
case "$STATIC_DIR/" in
  "$PROJECT_DIR/"|"$PROJECT_DIR"/*/) ;;
  *) echo "Build directory must be inside PROJECT_DIR: $STATIC_DIR" >&2; exit 1 ;;
esac
[[ -f "$STATIC_DIR/index.html" ]] || { echo "Static directory does not contain index.html: $STATIC_DIR" >&2; exit 1; }

METADATA_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
/usr/bin/time -p mkdir -p "$METADATA_DIR"
/usr/bin/time -p node -e 'const fs=require("node:fs"); fs.writeFileSync(process.argv[1], JSON.stringify({project:process.argv[2],directory:process.argv[3]}))' "$METADATA_DIR/deployment-output.json" "$PROJECT_DIR" "$STATIC_DIR"

export PORT
cd "$STATIC_DIR"
/usr/bin/time -p python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$STATIC_DIR"
