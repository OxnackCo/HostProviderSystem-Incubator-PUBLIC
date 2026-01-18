(function(){
  const stored = localStorage.getItem('ox_lang');
  const defaultLang = stored || 'en'; // English by default
  let currentLang = defaultLang;
  const cache = {};

  async function loadLang(lang){
    if(cache[lang]){ apply(cache[lang]); return; }
    try{
      const res = await fetch(`/js/lang/${lang}.json`);
      if(!res.ok) throw new Error('Failed to load lang');
      const json = await res.json();
      cache[lang] = json;
      apply(json);
    }catch(e){
      console.error('i18n load error', e);
    }
  }

  function apply(trans){
    document.documentElement.lang = currentLang;
    Object.keys(trans).forEach(key => {
      const els = document.querySelectorAll(`[data-i18n="${key}"]`);
      els.forEach(el => {
        const tag = el.tagName.toLowerCase();
        if(tag === 'input' || tag === 'textarea'){
          if(el.placeholder !== undefined) el.placeholder = trans[key];
          else el.value = trans[key];
        } else {
          el.textContent = trans[key];
        }
      });
    });

    const yearEl = document.getElementById('current-year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    const sel = document.getElementById('langSelector');
    if(sel) sel.value = currentLang;
  }

  function initI18n(){
    const sel = document.getElementById('langSelector');
    if(sel){
      sel.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('ox_lang', currentLang);
        loadLang(currentLang);
      });
      sel.value = currentLang; // Ensure selector shows current language
    }
    loadLang(currentLang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    // If script is loaded dynamically after DOMContentLoaded
    setTimeout(initI18n, 0);
  }

})();
