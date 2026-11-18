const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let selectedChar=0, selectedTrack=0, mode='solo', difficulty='easy';
let score=0,combo=1,lives=3,running=false,paused=false,spawnTimer=null,raf=null,notes=[],lastTime=0;
const names=['DJ RELÂMPAGO','MC NEON','RAINHA DO BEAT','NINJA FUNK','CAPITÃO BAILE','SOMBRA ROSA','TREVO DA PISTA','LENDÁRIO 2D'];
const palettes=['#ff3b9d','#35d9ff','#ffd43b','#9e72ff','#58e391','#ff7a45','#55c1ff','#f35fa7'];
for(let i=names.length;i<200;i++) names.push(['DJ','MC','LÍDER','NINJA','RAINHA','REI','MESTRE','STAR'][i%8]+' '+('FUNK '+(i+1)));

function setChar(){
  $('#charName').textContent=names[selectedChar];$('#charCount').textContent=(selectedChar+1)+' / 200';
  const c=$('.mini-character');c.querySelector('.hair').style.background=palettes[selectedChar%palettes.length];
  c.querySelector('.body').style.background=palettes[(selectedChar+2)%palettes.length];
  $('#charDots').innerHTML='<i></i><i></i><i></i><i></i><i></i>';
  [...$('#charDots').children].forEach((d,i)=>d.style.background=i===selectedChar%5?palettes[selectedChar%palettes.length]:'#777');
}
$('#prevChar').onclick=()=>{selectedChar=(selectedChar+199)%200;setChar()};$('#nextChar').onclick=()=>{selectedChar=(selectedChar+1)%200;setChar()};

function setTrack(delta=0){selectedTrack=(selectedTrack+delta+200)%200;$('#trackName').textContent='Beat da Favela '+String(selectedTrack+1).padStart(2,'0')}
$('#prevTrack').onclick=()=>setTrack(-1);$('#nextTrack').onclick=()=>setTrack(1);
$$('.mode-card').forEach(b=>b.onclick=()=>{$$('.mode-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');mode=b.dataset.mode});
$$('[data-difficulty]').forEach(b=>b.onclick=()=>{$$('[data-difficulty]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');difficulty=b.dataset.difficulty});

let audio=null;
function playTone(freq=.0){try{audio??=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq||180;o.type='square';g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.08)}catch(e){}}
$('#soundBtn').onclick=e=>{e.currentTarget.textContent=e.currentTarget.textContent==='♪'?'×':'♪'};

function showMenu(){running=false;paused=false;cancelAnimationFrame(raf);clearInterval(spawnTimer);$('#game').classList.remove('active');$('#menu').classList.add('active');$('#pauseOverlay').classList.remove('active')}
function startGame(){
  $('#menu').classList.remove('active');$('#game').classList.add('active');score=0;combo=1;lives=3;notes=[];running=true;paused=false;lastTime=performance.now();updateHud();
  $('#resultOverlay').classList.remove('active');
  $('#game').classList.toggle('duo-mode',mode==='duo');
  const character=$('#gameCharacter'),chosen=palettes[selectedChar%palettes.length];
  character.querySelector('.hair').style.background=chosen;
  character.querySelector('.body').style.background=palettes[(selectedChar+2)%palettes.length];
  $$('#lanes .lane').forEach(l=>l.innerHTML='');spawnTimer=setInterval(spawnNote,difficulty==='easy'?850:mode==='duo'?620:520);
  raf=requestAnimationFrame(loop);
}
$('#playBtn').onclick=startGame;$('#backBtn').onclick=showMenu;$('#exitBtn').onclick=showMenu;
$('#restartBtn').onclick=startGame;$('#resultExitBtn').onclick=showMenu;
$('#pauseBtn').onclick=()=>{paused=!paused;$('#pauseOverlay').classList.toggle('active',paused)};$('#resumeBtn').onclick=()=>{$('#pauseOverlay').classList.remove('active');paused=false;lastTime=performance.now()};

function spawnNote(){
  if(!running||paused)return;const lane=Math.floor(Math.random()*4),n=document.createElement('div');n.className='note '+['a','s','d','f'][lane];n.dataset.lane=lane;n.style.left=(18+(lane+.5)*16.0)+'%';n.style.top='-70px';n.dataset.y=-70;n.dataset.speed=difficulty==='easy'?210:280;$('#lanes').appendChild(n);notes.push(n);
}
function loop(time){
  if(!running)return;if(!paused){const dt=Math.min((time-lastTime)/1000,.035);lastTime=time;const target=window.innerHeight*.88*.93;
    for(let i=notes.length-1;i>=0;i--){const n=notes[i];let y=parseFloat(n.dataset.y)+parseFloat(n.dataset.speed)*dt;n.dataset.y=y;n.style.top=y+'px';
      if(y>window.innerHeight*.88){n.remove();notes.splice(i,1);miss()}
    }
  }
  raf=requestAnimationFrame(loop);
}
function updateHud(){ $('#score').textContent=String(score).padStart(6,'0');$('#combo').textContent='×'+combo;$('#lives').textContent=[...Array(lives)].map(()=> '♥').join(' ')||'—'}
function judgement(text,good=true){const j=$('#judgement');j.textContent=text;j.classList.remove('show');void j.offsetWidth;j.classList.add('show');if(good)j.style.color='var(--yellow)';else j.style.color='var(--pink)'}
function miss(){lives--;combo=1;judgement('ERROU!',false);updateHud();if(lives<=0){running=false;clearInterval(spawnTimer);setTimeout(endGame,350)}}
function endGame(){
  $('#resultScore').textContent=String(score).padStart(6,'0');
  $('#resultTitle').textContent=score>=2000?'CANTO DA FAVELA!':score>=800?'RITMO NO TALENTO!':'VOLTA AO BAILE!';
  $('#resultOverlay').classList.add('active');
}
function hit(lane){
  const target=window.innerHeight*.88*.93;let best=null,bestDist=999;
  notes.forEach(n=>{if(+n.dataset.lane===lane){const d=Math.abs(parseFloat(n.dataset.y)-target);if(d<bestDist){best=n;bestDist=d}}});
  const btn=$('.target-row button[data-lane="'+lane+'"]');btn.classList.add('hit');setTimeout(()=>btn.classList.remove('hit'),90);playTone(150+lane*70);
  if(best&&bestDist<145){best.remove();notes.splice(notes.indexOf(best),1);const perfect=bestDist<62;score+=perfect?100:60;combo++;judgement(perfect?'PERFEITO!':'BOA!');updateHud()}else judgement('FORA DO TEMPO!',false)
}
window.addEventListener('keydown',e=>{const k=e.key.toLower?.();const lane=['a','s','d','f'].indexOf(k);if(lane>=0&&running&&!paused)hit(lane);if(e.key==='Escape'&&running)$('#pauseBtn').click()});
$$('.target-row button').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();if(running&&!paused)hit(+b.dataset.lane)}));
setChar();setTrack();
