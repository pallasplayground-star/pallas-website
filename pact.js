const PactRitual = {
  async init() {
    const greeting = document.getElementById('pact-greeting');
    await typeInto(greeting, '— identify yourself.', 52);
    await wait(500);
    document.getElementById('pact-prompt').classList.remove('hidden-el');

    document.getElementById('insta-btn').addEventListener('click', () => this.showInsta());
    document.getElementById('email-btn').addEventListener('click', () => this.showEmail());
    document.getElementById('consent-check').addEventListener('change', e => {
      if (e.target.checked) this.ascend();
    });

    document.getElementById('insta-verify-btn').addEventListener('click', () => this.verifyInsta());
    document.getElementById('insta-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.verifyInsta();
    });
    document.getElementById('email-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.verifyEmail();
    });
  },

  showInsta() {
    document.getElementById('pact-prompt').classList.add('hidden-el');
    document.getElementById('verify-section').classList.add('visible');
    document.getElementById('verify-insta').style.display = 'flex';
    document.getElementById('insta-input').focus();
  },

  showEmail() {
    document.getElementById('pact-prompt').classList.add('hidden-el');
    document.getElementById('verify-section').classList.add('visible');
    document.getElementById('verify-email').style.display = 'flex';
    document.getElementById('email-input').focus();
  },

  async verifyInsta() {
    const input  = document.getElementById('insta-input');
    const status = document.getElementById('insta-status');
    const btn    = document.getElementById('insta-verify-btn');
    const handle = input.value.trim().replace(/^@/, '');
    if (!handle) return;

    input.disabled = true;
    btn.disabled = true;
    btn.style.opacity = '0.3';
    await typeInto(status, 'verifying...', 40);
    await wait(1600);
    status.textContent = '✓  verified';
    window.P.name = handle;
    await wait(600);
    this.showConsent();
  },

  async verifyEmail() {
    const input  = document.getElementById('email-input');
    const status = document.getElementById('email-status');
    const email  = input.value.trim();
    if (!email || !email.includes('@')) { status.textContent = 'invalid.'; return; }

    input.disabled = true;
    await typeInto(status, 'verifying...', 40);
    await wait(1800);
    const derived = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
    window.P.name = derived;
    status.textContent = '✓  welcome, ' + derived;
    await wait(600);
    this.showConsent();
  },

  showConsent() {
    document.getElementById('consent-section').classList.add('visible');
    Tone.hum(196, 0.04, 2.4);
  },

  async ascend() {
    document.getElementById('consent-check').disabled = true;
    const pact = document.getElementById('pact');
    pact.classList.add('ascended');

    await wait(1200);
    document.querySelector('.pact-body').style.opacity = '0';
    document.querySelector('.pact-body').style.transition = 'opacity 1.2s ease';
    await wait(1400);

    document.getElementById('ascension-msg').classList.add('visible');
    Tone.chord([261, 329, 392], { gain: 0.035, dur: 3.2 });
    await wait(2800);

    document.getElementById('ascension-msg').style.opacity = '0';
    await wait(1000);
    window.go('veil');
  }
};