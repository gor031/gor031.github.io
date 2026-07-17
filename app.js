const thought = document.querySelector('#thought');
const count = document.querySelector('#count');
const toast = document.querySelector('#toast');
const notebook = document.querySelector('.notebook');
const trash = document.querySelector('#trashBtn');
const soundBtn = document.querySelector('#soundBtn');
const breathing = document.querySelector('#breathing');
const breathText = document.querySelector('#breathText');

const prompts = [
  '오늘 하루를 버틴 것만으로도 충분해요.',
  '모든 생각에 지금 답을 내리지 않아도 괜찮아요.',
  '당신의 속도는 늦은 것이 아니라 당신만의 속도예요.',
  '잠깐 멈춘다고 뒤처지는 것은 아니에요.',
  '지금 느끼는 마음도 곧 지나가요.',
  '오늘의 나에게 조금 더 다정해져도 괜찮아요.'
];

thought.value = localStorage.getItem('maumswim-note') || '';
updateCount();
thought.addEventListener('input', () => {
  localStorage.setItem('maumswim-note', thought.value);
  updateCount();
});

function updateCount(){ count.textContent = `${thought.value.length} / 240`; }
function showToast(message){ toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(()=>toast.classList.remove('show'), 2200); }

function releaseThought(){
  if (!thought.value.trim()) return showToast('먼저 내려놓고 싶은 생각을 적어보세요.');
  const start = notebook.getBoundingClientRect();
  const end = trash.getBoundingClientRect();
  const ball = document.createElement('div');
  ball.className = 'paper-ball';
  ball.style.left = `${start.left + start.width/2}px`;
  ball.style.top = `${start.top + start.height/2}px`;
  document.body.appendChild(ball);
  notebook.classList.add('crumple');
  requestAnimationFrame(()=>{
    ball.style.left = `${end.left + end.width/2}px`;
    ball.style.top = `${end.top + end.height/2}px`;
    ball.style.transform = 'scale(.2) rotate(620deg)';
  });
  setTimeout(()=>{
    thought.value = '';
    localStorage.removeItem('maumswim-note');
    updateCount();
    notebook.classList.remove('crumple');
    ball.remove();
    showToast('그 생각은 잠시 여기 두고 갈게요.');
  }, 850);
}

document.querySelector('#foldBtn').addEventListener('click', releaseThought);
trash.addEventListener('click', releaseThought);
document.querySelector('#clearBtn').addEventListener('click', ()=>{
  thought.value=''; localStorage.removeItem('maumswim-note'); updateCount(); showToast('빈 페이지가 다시 준비됐어요.');
});
document.querySelector('#promptBtn').addEventListener('click', ()=>showToast(prompts[Math.floor(Math.random()*prompts.length)]));

let breathTimer;
document.querySelector('#breatheBtn').addEventListener('click', ()=>{
  breathing.hidden = false;
  let phase = 0;
  const phases = ['천천히 들이마셔요', '잠깐 머물러요', '길게 내쉬어요', '편안히 쉬어요'];
  breathText.textContent = phases[0];
  breathTimer = setInterval(()=>{ phase=(phase+1)%4; breathText.textContent=phases[phase]; }, 4000);
});
document.querySelector('#stopBreath').addEventListener('click', ()=>{ breathing.hidden=true; clearInterval(breathTimer); });

// Web Audio API로 만드는 부드러운 빗소리. 외부 음원 파일이 없어도 작동합니다.
let audioCtx, rainSource, rainGain;
function toggleRain(){
  if (audioCtx && audioCtx.state !== 'closed'){
    rainGain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime+.5);
    setTimeout(()=>audioCtx.close(),550); soundBtn.setAttribute('aria-pressed','false'); showToast('빗소리를 껐어요.'); return;
  }
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const seconds=2, buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*seconds,audioCtx.sampleRate), data=buffer.getChannelData(0);
  let last=0;
  for(let i=0;i<data.length;i++){ const white=Math.random()*2-1; last=.985*last+.015*white; data[i]=last*3.2; }
  rainSource=audioCtx.createBufferSource(); rainSource.buffer=buffer; rainSource.loop=true;
  const filter=audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=1400;
  rainGain=audioCtx.createGain(); rainGain.gain.value=.14;
  rainSource.connect(filter).connect(rainGain).connect(audioCtx.destination); rainSource.start();
  soundBtn.setAttribute('aria-pressed','true'); showToast('창밖에 잔잔한 비가 내려요.');
}
soundBtn.addEventListener('click',toggleRain);

const canvas=document.querySelector('#rainCanvas'), ctx=canvas.getContext('2d');
let drops=[];
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;drops=Array.from({length:50},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,l:5+Math.random()*12,s:1+Math.random()*2}));}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=1;for(const d of drops){ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+d.l);ctx.stroke();d.y+=d.s;if(d.y>canvas.height){d.y=-20;d.x=Math.random()*canvas.width}}requestAnimationFrame(draw)}
addEventListener('resize',resize);resize();draw();

const hour=new Date().getHours();
document.querySelector('#greeting').textContent=hour<6?'잠들지 못한 마음도 잠시 쉬어가요.':hour<12?'서두르지 않아도 괜찮은 아침이에요.':hour<18?'바쁜 마음을 잠시 내려놓아요.':'오늘도 여기까지 잘 왔어요.';