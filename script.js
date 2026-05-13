/* ─── THRESHOLD RITUAL ─── */
const ThresholdRitual = {
  started: false,
  mark: null,
  pos: { x: 50, y: 50 },
  vel: { x: 0.025, y: 0.018 },
  raf: null,

  init() {
    this.mark = document.getElementById('mark');
    Tone.init();
    this.renderMark('rgba(242,237,232,0.8)');
    this.startDrift();

    document.getElementById('enter-btn').addEventListener('click', () => {
      if (this.started) return;
      this.started = true;
      this.runSequence();
    });

    document.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', e => this.handleChoice(e.currentTarget.dataset.choice));
    });
  },

  /* ── Pixel renderer ── */
  renderMark(color = 'rgba(242,237,232,1)') {
    const canvas = this.mark;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    // low‑res temp canvas
    const temp = document.createElement('canvas');
    temp.width = 50; temp.height = 15;
    const tctx = temp.getContext('2d');
    tctx.fillStyle = color;
    tctx.font = 'bold 12px monospace';
    tctx.textAlign = 'center';
    tctx.fillText('PALLAS', 25, 12);
    ctx.drawImage(temp, 0, 0, canvas.width, canvas.height);
  },

  /* ── DVD‑style drift ── */
  startDrift() {
    const move = () => {
      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;
      if (this.pos.x < 5 || this.pos.x > 82) this.vel.x *= -1;
      if (this.pos.y < 5 || this.pos.y > 78) this.vel.y *= -1;
      this.mark.style.left = this.pos.x + '%';
      this.mark.style.top  = this.pos.y + '%';
      this.mark.style.transform = 'none';
      this.raf = requestAnimationFrame(move);
    };
    this.raf = requestAnimationFrame(move);
  },

  stopDrift() {
    cancelAnimationFrame(this.raf);
  },

  centerMark() {
    this.mark.style.transition = 'left 1s ease, top 1s ease';
    this.mark.style.left = '50%';
    this.mark.style.top  = '50%';
    this.mark.style.transform = 'translate(-50%, -50%)';
  },

  /* ── Ritual sequence ── */
  async runSequence() {
    const statusEl  = document.getElementById('status-line');
    const ctaZone   = document.getElementById('cta-zone');
    const countEl   = document.getElementById('count-display');

    ctaZone.style.opacity = '0';
    ctaZone.style.pointerEvents = 'none';
    ctaZone.style.transition = 'opacity 0.8s ease';

    await wait(700);
    await typeInto(statusEl, 'stand by.', 60);
    await wait(600);

    this.stopDrift();
    this.centerMark();
    await wait(1200);

    // Countdown 3–2–1 with flash
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

    this.mark.classList.add('activated');
    await wait(800);
    document.getElementById('sound-modal').classList.add('open');
  },

  async handleChoice(choice) {
    window.P.sound = choice === 'yes';

    if (window.P.sound) {
      this.mark.classList.add('activated');
    } else {
      this.mark.classList.remove('activated');
      this.mark.classList.add('dimmed');
      this.renderMark('#888');
    }

    document.getElementById('sound-modal').classList.remove('open');
    Tone.hum(220, 0.06, 3);

    const statusEl = document.getElementById('status-line');
    await wait(600);
    await typeInto(statusEl, 'welcome to the playground.', 55);
    await wait(1800);
    await typeInto(statusEl, 'entering —', 55);
    await wait(900);

    // Shatter the mark
    this.mark.classList.add('shattering');
    await wait(800);

    window.go('pact');
  }
};

/* ─── TONE (minimal audio, pluggable) ─── */
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
    const chords = {
      3: [130, 163, 195],
      2: [146, 174, 220],
      1: [164, 207, 246]
    };
    this.chord(chords[n] || [164], { gain: 0.05, dur: 1.8 });
  }
};

/* ─── UTILS ─── */
const wait = ms => new Promise(r => setTimeout(r, ms));
async function typeInto(el, text, speed = 42) {
  el.textContent = '';
  for (const ch of text) {
    el.textContent += ch;
    await wait(speed);
  }
}