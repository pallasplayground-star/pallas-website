const VeilRitual = {
  seconds: 6 * 3600 + 22 * 60 + 17,
  distortionFired: false,
  ticker: null,

  ARTIFACTS: [
    'PP-24-A3', 'PP-24-A4', 'PP-24-A5',
    'PP-25-A1',
    'PP-25-A2', 'PP-25-A3', 'PP-25-A4'
  ],
  CURRENT: 'PP-25-A1',

  init() {
    if (window.P.name) {
      document.getElementById('witness-label').textContent = window.P.name;
    }
    this.buildTimeline();
    this.startCountdown();
    this.startGlitchInterval();
    this.initTimeline();
  },

  buildTimeline() {
    const rail = document.getElementById('timeline-rail');
    rail.innerHTML = '';
    this.ARTIFACTS.forEach((id, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.className = 'timeline-connector';
        rail.appendChild(conn);
      }
      const node = document.createElement('div');
      node.className = 'timeline-node' + (id === this.CURRENT ? ' current' : '');
      node.innerHTML = `<div class="timeline-node-dot"></div><div class="timeline-node-label">${id}</div>`;
      rail.appendChild(node);
    });
    setTimeout(() => {
      const zone = document.getElementById('timeline-zone');
      const cur = rail.querySelector('.timeline-node.current');
      if (cur) zone.scrollLeft = cur.offsetLeft - zone.clientWidth / 2 + 30;
    }, 100);
  },

  fmt(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(n => String(n).padStart(2, '0')).join(' : ');
  },

  startCountdown() {
    const el = document.getElementById('veil-countdown');
    this.ticker = setInterval(() => {
      this.seconds = Math.max(0, this.seconds - 1);
      el.textContent = this.fmt(this.seconds);
      if (this.seconds <= 180) el.classList.add('urgent');
      if (this.seconds <= 10 && !this.distortionFired) {
        this.distortionFired = true;
        this.triggerDistortion();
      }
      if (this.seconds === 0) {
        clearInterval(this.ticker);
        this.triggerRevelation();
      }
    }, 1000);
  },

  async triggerDistortion() {
    Tone.hum(55, 0.06, 4);
    const distortion = document.getElementById('distortion');
    const dtimer = document.getElementById('distortion-timer');
    document.getElementById('silhouette').classList.add('glitching');
    distortion.classList.add('building');

    let remaining = Math.max(this.seconds, 10);
    const innerTick = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      dtimer.textContent = this.fmt(remaining);
      if (remaining === 0) clearInterval(innerTick);
    }, 1000);
  },

  async triggerRevelation() {
    clearInterval(this.ticker);
    const distortion = document.getElementById('distortion');
    const dtimer = document.getElementById('distortion-timer');
    dtimer.textContent = '00 : 00 : 00';
    Tone.chord([82, 110, 164, 220], { gain: 0.05, dur: 4 });
    await wait(2400);
    distortion.innerHTML = `
      <div style="text-align:center; display:flex; flex-direction:column; gap:1.6rem; align-items:center;">
        <div style="font-size:9px; letter-spacing:0.22em; color:rgba(242,237,232,0.3); text-transform:uppercase;">PP-25-A1</div>
        <div style="font-family:Georgia,serif; font-style:italic; font-size:clamp(1rem,2.5vw,1.4rem); color:#f2ede8; max-width:320px; line-height:1.9; opacity:0; transition:opacity 2s ease;" id="revelation-text">
          What you witness<br>is not what you see.<br>It is what you carried in.
        </div>
        <div style="margin-top:1.6rem; font-size:9px; letter-spacing:0.18em; color:rgba(242,237,232,0.2); text-transform:uppercase; cursor:crosshair;" id="return-btn">
          — return to threshold
        </div>
      </div>`;
    distortion.style.background = 'var(--ink)';
    await wait(200);
    document.getElementById('revelation-text').style.opacity = '1';
    document.getElementById('return-btn').addEventListener('click', () => {
      window.go('threshold');
      location.reload();
    });
  },

  startGlitchInterval() {
    setInterval(() => {
      if (Math.random() < 0.28) this.flashGlitch();
    }, 3000);
  },

  async flashGlitch() {
    const s = document.getElementById('silhouette');
    if (s.classList.contains('glitching')) return;
    s.style.transform = `translateX(${(Math.random() - 0.5) * 6}px)`;
    s.style.borderColor = 'rgba(230,0,126,0.35)';
    await wait(100);
    s.style.transform = '';
    s.style.borderColor = '';
  },

  initTimeline() {
    const zone = document.getElementById('timeline-zone');
    let isDragging = false, startX, scrollLeft;
    zone.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.pageX - zone.offsetLeft;
      scrollLeft = zone.scrollLeft;
      zone.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
      zone.style.cursor = 'grab';
    });
    zone.addEventListener('mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      zone.scrollLeft = scrollLeft - (e.pageX - zone.offsetLeft - startX);
    });
    zone.addEventListener('wheel', e => {
      e.preventDefault();
      zone.scrollLeft += e.deltaY * 0.6;
    }, { passive: false });
  }
};