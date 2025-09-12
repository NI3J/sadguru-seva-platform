// static/js/harijaplogin.js
class HariJapLogin {
  constructor() {
    this.config = { redirectDelay: 800 };
    this.state = { processing: false };
    this.init();
  }

  init() {
    this.bindInputs();
    this.checkExistingSession();
  }

  bindInputs() {
    const mobile = document.getElementById('mobile');
    if (mobile) {
      mobile.addEventListener('input', (e) => {
        const v = e.target.value.replace(/[^0-9+ -]/g, '');
        e.target.value = v;
      });
    }
  }

  async api(endpoint, options = {}) {
    const base = {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin'
    };
    const res = await fetch(endpoint, { ...base, ...options });
    return res.json();
  }

  setBtnLoading(id, loading) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const t = btn.querySelector('.btn-text');
    const l = btn.querySelector('.loading');
    btn.disabled = loading;
    if (t) t.style.display = loading ? 'none' : 'inline';
    if (l) l.classList.toggle('show', loading);
  }

  showMessage(msg, type = 'error') {
    const c = document.getElementById('messageContainer');
    c.innerHTML = `<div class="message ${type}">${msg}</div>`;
  }

  validateName(name) {
    return !!name && name.trim().length >= 2 && name.trim().length <= 50 && /^[A-Za-z\s]+$/.test(name.trim());
  }

  validateMobile(mobile) {
    const digits = (mobile || '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(digits.slice(-10));
  }

  async checkExistingSession() {
    try {
      const r = await this.api('/harijap/auth/check_session');
      if (r.authenticated) {
        this.showMessage('आप पहले से लॉगिन हैं। रीडायरेक्ट किया जा रहा है…', 'success');
        setTimeout(() => location.href = '/harijap', this.config.redirectDelay);
      }
    } catch (_) {}
  }

  async login() {
    if (this.state.processing) return;
    const name = (document.getElementById('name') || {}).value || '';
    const mobile = (document.getElementById('mobile') || {}).value || '';

    if (!this.validateName(name)) {
      this.showMessage('कृपया वैध नाम दर्ज करें (केवल अक्षर, 2-50 वर्ण)');
      return;
    }
    if (!this.validateMobile(mobile)) {
      this.showMessage('कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें');
      return;
    }

    this.state.processing = true;
    this.setBtnLoading('sendOtpBtn', true);

    try {
      const r = await this.api('/harijap/auth/login', {
        method: 'POST',
        body: JSON.stringify({ name, mobile })
      });

      if (r.success) {
        this.showMessage(r.message || 'सफलतापूर्वक लॉगिन', 'success');
        setTimeout(() => location.href = r.redirect_url || '/harijap', this.config.redirectDelay);
      } else {
        this.showMessage(r.error || 'प्रवेश असफल');
      }
    } catch (e) {
      this.showMessage('नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।');
    } finally {
      this.state.processing = false;
      this.setBtnLoading('sendOtpBtn', false);
    }
  }
}

// expose for onclick
function sendOTP() { window.hariJapLogin?.login(); }

document.addEventListener('DOMContentLoaded', () => {
  window.hariJapLogin = new HariJapLogin();
});
