// Shared UI helpers: theme toggle, toasts, confetti
(function(){
  const D = document.documentElement;
  // Safe storage (works in Safari privé)
  const SafeStorage = (function(){
    try { const t='__test__'; window.localStorage.setItem(t,'1'); window.localStorage.removeItem(t); return window.localStorage; }
    catch(e){ const mem={}; return { getItem:(k)=> (k in mem? mem[k] : null), setItem:(k,v)=>{ mem[k]=String(v); }, removeItem:(k)=>{ delete mem[k]; } }; }
  })();
  const prefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const getTheme = () => SafeStorage.getItem('theme') || 'auto';
  const setThemeAttr = (mode) => {
    if(mode==='light') D.setAttribute('data-theme','light');
    else if(mode==='dark') D.setAttribute('data-theme','dark');
    else D.removeAttribute('data-theme');
  };
  const applyTheme = () => { const t=getTheme(); setThemeAttr(t); };
  applyTheme();

  function addThemeToggle(){
    const header = document.querySelector('header');
    if(!header) return; // nothing to do
    let btn = header.querySelector('#theme-toggle');
    if(!btn){
      btn = document.createElement('button'); btn.id='theme-toggle'; btn.className='theme-toggle';
      var right = header.querySelector('.right');
      if(right) right.appendChild(btn); else header.appendChild(btn);
    }
    function icon(){ const t=getTheme(); if(t==='light') return '🌞'; if(t==='dark') return '🌙'; return prefersDark()? '🌙' : '🌞'; }
    function title(){ const t=getTheme(); if(t==='light') return 'Thème clair (cliquer pour sombre)'; if(t==='dark') return 'Thème sombre (cliquer pour auto)'; return 'Thème auto (cliquer pour clair)'; }
    function cycle(){ const t=getTheme(); const next = t==='auto' ? 'light' : t==='light' ? 'dark' : 'auto'; SafeStorage.setItem('theme', next); applyTheme(); render(); toast('Thème: '+ (next==='auto' ? 'Auto' : next==='light' ? 'Clair' : 'Sombre')); }
    function render(){ btn.textContent = icon(); btn.setAttribute('aria-label', title()); }
    btn.addEventListener('click', cycle); render();
  }
  addThemeToggle();

  // Toasts
  const wrap = document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap);
  function toast(msg, ms=1600){ const d=document.createElement('div'); d.className='toast pop-in'; d.textContent=msg; wrap.appendChild(d); setTimeout(()=>{ d.remove(); }, ms); }

  // Confetti (simple)
  function confetti(duration=900, count=120){
    const colors=['#f87171','#fbbf24','#34d399','#60a5fa','#c084fc'];
    const bounds = document.body.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const p=document.createElement('div');
      const size = Math.random()*8+4;
      p.style.position='fixed';
      p.style.left = (Math.random()*bounds.width)+'px';
      p.style.top = '-10px';
      p.style.width = size+'px';
      p.style.height = size+'px';
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      p.style.borderRadius = '2px';
      p.style.opacity = '0.9';
      p.style.transform = `rotate(${Math.random()*360}deg)`;
      p.style.transition = `transform ${duration}ms linear, top ${duration}ms linear, opacity ${duration}ms ease-out`;
      document.body.appendChild(p);
      requestAnimationFrame(()=>{
        p.style.top = (bounds.height+20)+'px';
        p.style.transform += ` translate(${(Math.random()*2-1)*120}px, 0)`;
        p.style.opacity = '0.2';
      });
      setTimeout(()=>p.remove(), duration+300);
    }
  }

  // Expose helpers
  window.SiteUI = { toast, confetti };
  window.SafeStorage = SafeStorage;
})();

// CMP + Ads (AdSense placeholders)
(function(){
  const ADS_CLIENT = (window.SITE_ADS_CLIENT || 'ca-pub-XXXXXXXXXXXXXXXX'); // Configurable via assets/config.js
  const CONSENT_KEY = 'adsConsent'; // 'granted' | 'denied'
  try {
    var proto = window.location.protocol;
    if (proto !== 'http:' && proto !== 'https:') {
      document.querySelectorAll('.ad-wrap').forEach(function(el){ el.style.display = 'none'; });
      window.SiteAds = { showCMP: function(){}, resetConsent: function(){ try { (window.SafeStorage||localStorage).removeItem(CONSENT_KEY);}catch(e){} } };
      return; // skip ads fully on file://
    }
  } catch(e) {}
  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get('ads') === 'off') {
      document.querySelectorAll('.ad-wrap').forEach(function(el){ el.style.display = 'none'; });
      window.SiteAds = { showCMP: function(){}, resetConsent: function(){ try { (window.SafeStorage||localStorage).removeItem(CONSENT_KEY);}catch(e){} } };
      return; // skip ads fully
    }
  } catch(e) {}
  // Skip ads if client not configured
  if (!ADS_CLIENT || /X{4,}/.test(ADS_CLIENT)) {
    try { document.querySelectorAll('.ad-wrap').forEach(function(el){ el.style.display = 'none'; }); } catch(e) {}
    window.SiteAds = { showCMP: function(){}, resetConsent: function(){ try { (window.SafeStorage||localStorage).removeItem(CONSENT_KEY);}catch(e){} } };
    return;
  }

  function hasConsent(){ try { return (window.SafeStorage || localStorage).getItem(CONSENT_KEY) === 'granted'; } catch(e){ return false; } }
  function denied(){ try { return (window.SafeStorage || localStorage).getItem(CONSENT_KEY) === 'denied'; } catch(e){ return false; } }

  function injectScript(){
    if(document.querySelector('script[data-adsense]')) return;
    const s = document.createElement('script');
    s.async = true; s.setAttribute('data-adsense','');
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
    s.addEventListener('load', () => initSlots());
  }

  function initSlots(){
    const slots = document.querySelectorAll('ins.adsbygoogle');
    slots.forEach(function(el){
      if(!el.getAttribute('data-ad-client')) el.setAttribute('data-ad-client', ADS_CLIENT);
      else el.setAttribute('data-ad-client', ADS_CLIENT);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
    });
  }

  function showBanner(force=false){
    if(!force && (hasConsent() || denied())) return; // already decided
    const wrap = document.createElement('div');
    wrap.className = 'cmp-banner';
    wrap.innerHTML = `
      <div class="inner">
        <p>Nous utilisons des cookies afin d'afficher des publicités (Google AdSense). Vous pouvez accepter ou refuser. Vous pouvez changer d'avis plus tard en effaçant vos préférences de site.</p>
        <div class="cmp-actions">
          <button class="btn ghost" id="cmp-decline">Refuser</button>
          <button class="btn primary" id="cmp-accept">Accepter</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('#cmp-accept').addEventListener('click', function(){ try {(window.SafeStorage||localStorage).setItem(CONSENT_KEY,'granted');}catch(e){} wrap.remove(); injectScript(); if(window.SiteUI && window.SiteUI.toast) window.SiteUI.toast('Publicités activées'); });
    wrap.querySelector('#cmp-decline').addEventListener('click', function(){ try {(window.SafeStorage||localStorage).setItem(CONSENT_KEY,'denied');}catch(e){} wrap.remove(); if(window.SiteUI && window.SiteUI.toast) window.SiteUI.toast('Publicités désactivées'); });
  }

  function setup(){ if(hasConsent()) injectScript(); showBanner(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setup); else setup();

  // Expose controls
  window.SiteAds = {
    showCMP: function(){ showBanner(true); },
    resetConsent: function(){ try { (window.SafeStorage||localStorage).removeItem(CONSENT_KEY); } catch(e){} if(window.SiteUI && window.SiteUI.toast) window.SiteUI.toast('Préférence effacée'); }
  };
})();
