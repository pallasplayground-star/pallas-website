/* ─── CONFIGURATION ─────────────────────────────── */
const CFG = {
  driftSpeed:  { x: 0.025, y: 0.018 },
  bounceBox:   { left: 5, right: 95, top: 5, bottom: 95 },
  renderFont:  "14px 'Press Start 2P'",
  renderColor: 'rgba(242,237,232,0.9)',
};

/* ─── STATE ──────────────────────────────────────── */
const State = {
  started: false,
  soundEnabled: false,
  pos: { x: 50, y: 50 },
  vel: { x: CFG.driftSpeed.x, y: CFG.driftSpeed.y },
  raf: null,
  mark: null,
};

/* ─── UTILS ──────────────────────────────────────── */
const wait = ms => new Promise(r => setTimeout(r, ms));

async function typeInto(el, text, speed = 42) {
  el.textContent = '';
  for (const ch of text) {
    el.textContent += ch;
    await wait(speed);
  }
}

/* ─── TONE (minimal audio) ────────────────────────── */
const Tone = {
  ctx: null,
  init() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  },
  hum(freq, gain = 0.04, duration = 2) {
    if (!this.ctx || !window.P.sound) return;
    this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const g   = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + 0.6);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.1);
  },
  chord(freqs, opts = {}) {
    freqs.forEach((f, i) => {
      setTimeout(() => this.hum(f, opts.gain || 0.03, opts.dur || 2.4), i * 80);
    });
  },
  countdown(n) {
    const chords = { 3:[130,163,195], 2:[146,174,220], 1:[164,207,246] };
    this.chord(chords[n] || [164], { gain:0.05, dur:1.8 });
  }
};

/* ─── PIXEL MARK RENDERER ────────────────────────── */
function renderMark(color = CFG.renderColor) {
  const canvas = State.mark;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const temp = document.createElement('canvas');
  temp.width = 80;
  temp.height = 20;
  const tctx = temp.getContext('2d');
  tctx.font = CFG.renderFont;
  tctx.textAlign = 'center';
  tctx.textBaseline = 'middle';
  tctx.fillStyle = color;
  tctx.fillText('PALLAS', 40, 10);

  ctx.drawImage(temp, 0, 0, canvas.width, canvas.height);
}

/* ─── DRIFT (centre‑based) ────────────────────────── */
function startDrift() {
  const animate = () => {
    State.pos.x += State.vel.x;
    State.pos.y += State.vel.y;
    if (State.pos.x < CFG.bounceBox.left || State.pos.x > CFG.bounceBox.right) State.vel.x *= -1;
    if (State.pos.y < CFG.bounceBox.top || State.pos.y > CFG.bounceBox.bottom) State.vel.y *= -1;
    State.mark.style.left = State.pos.x + '%';
    State.mark.style.top  = State.pos.y + '%';
    State.mark.style.transform = 'translate(-50%, -50%) skewX(-4deg)';
    State.raf = requestAnimationFrame(animate);
  };
  State.raf = requestAnimationFrame(animate);
}

function stopDrift() {
  if (State.raf) {
    cancelAnimationFrame(State.raf);
    State.raf = null;
  }
}

function centerMark() {
  stopDrift();
  State.mark.style.transition = 'left 1s ease, top 1s ease';
  State.pos.x = 50;
  State.pos.y = 50;
  State.mark.style.left = '50%';
  State.mark.style.top  = '50%';
  State.mark.style.transform = 'translate(-50%, -50%) skewX(-4deg)';
  setTimeout(() => {
    State.mark.style.transition = '';
  }, 1000);
}

/* ─── PIXEL DISPERSAL ─────────────────────────────── */
async function shatterMark() {
  console.log('[THRESHOLD] shatterMark started');
  const canvas = State.mark;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const pixels = [];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (data[idx + 3] > 128) {
        pixels.push({ x, y });
      }
    }
  }

  if (pixels.length === 0) {
    console.warn('[THRESHOLD] no pixels – navigating directly');
    window.go('pact');
    return;
  }

  canvas.style.opacity = '0';

  const rect = canvas.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const overlay = document.getElementById('shatter-canvas');
  overlay.style.display = 'block';
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight;
  const overCtx = overlay.getContext('2d');

  const particles = pixels.map(p => {
    const startX = centerX - canvas.width/2 + p.x;
    const startY = centerY - canvas.height/2 + p.y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    return {
      x: startX, y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.01 + Math.random() * 0.02,
    };
  });

  return new Promise((resolve) => {
    let finished = false;
    const timeout = setTimeout(() => {
      if (!finished) {
        console.warn('[THRESHOLD] dispersal timeout – forcing resolve');
        overlay.style.display = 'none';
        finished = true;
        resolve();
      }
    }, 5000);

    const animate = () => {
      if (finished) return;
      overCtx.clearRect(0, 0, overlay.width, overlay.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life > 0) {
          alive = true;
          overCtx.fillStyle = `rgba(230,0,126,${p.life})`;
          overCtx.fillRect(p.x, p.y, 3, 3);
        }
      });
      if (alive) {
        requestAnimationFrame(animate);
      } else {
        overlay.style.display = 'none';
        clearTimeout(timeout);
        finished = true;
        console.log('[THRESHOLD] dispersal complete');
        resolve();
      }
    };
    requestAnimationFrame(animate);
  });
}

/* ─── RITUAL SEQUENCE ────────────────────────────── */
async function runSequence() {
  console.log('[THRESHOLD] ritual started');
  const statusEl = document.getElementById('status-line');
  const ctaZone  = document.getElementById('cta-zone');
  const countEl  = document.getElementById('count-display');

  ctaZone.style.opacity = '0';
  ctaZone.style.pointerEvents = 'none';
  ctaZone.style.transition = 'opacity 0.8s ease';

  await wait(700);
  await typeInto(statusEl, 'stand by.', 60);
  await wait(600);

  centerMark();
  await wait(1200);

  for (let i = 3; i >= 1; i--) {
    countEl.style.opacity = '1';
    countEl.textContent = i;
    countEl.style.textShadow = '0 0 60px rgba(230,0,126,0.8)';
    Tone.countdown(i);
    await wait(120);
    countEl.style.textShadow = '0 0 40px rgba(230,0,126,0.5)';
    await wait(780);
    countEl.style.opacity = '0';
    await wait(200);
  }

  State.mark.classList.add('activated');
  await wait(800);

  document.getElementById('sound-modal').classList.add('open');
}

async function handleSoundChoice(choice) {
  console.log('[THRESHOLD] sound choice:', choice);
  window.P.sound = (choice === 'yes');

  if (window.P.sound) {
    State.mark.classList.add('activated');
    State.mark.classList.remove('dimmed');
    renderMark();
  } else {
    State.mark.classList.remove('activated');
    State.mark.classList.add('dimmed');
    renderMark('#888');
  }

  document.getElementById('sound-modal').classList.remove('open');
  Tone.hum(220, 0.06, 3);

  const statusEl = document.getElementById('status-line');
  await wait(600);
  await typeInto(statusEl, 'welcome to the playground.', 55);
  await wait(1800);
  await typeInto(statusEl, 'entering —', 55);
  await wait(900);

  await shatterMark();
  window.go('pact');
}

/* ─── THRESHOLD RITUAL OBJECT (called by index.html) */
const ThresholdRitual = {
  init() {
    State.mark = document.getElementById('mark');
    State.mark.width = 440;
    State.mark.height = 120;
    Tone.init();
    renderMark();
    startDrift();

    document.getElementById('enter-btn').addEventListener('click', () => {
      if (State.started) return;
      State.started = true;
      runSequence();
    });

    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        handleSoundChoice(e.currentTarget.dataset.choice);
      });
    });

    console.log('[THRESHOLD] ready');
  }
};

/* ─── DEV SHORTCUTS ──────────────────────────────── */
window.dev = window.dev || {};
window.dev.threshold = {
  shatter: () => shatterMark(),
  center: () => centerMark()
};