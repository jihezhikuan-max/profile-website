'use strict';

const CONTACT_EMAIL = 'jihezhikuan@gmail.com';
const LAB_INSTAGRAM = 'https://www.instagram.com/ai_lab305/?hl=ja';
const LANGUAGES = ['ja', 'en'];
const cache = new Map();
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia('(max-width: 767px)');
let activeLanguage = 'ja';
let requestedLanguage = 'ja';
let requestId = 0;
let initialized = false;
let revealObserver;
let sectionObserver;

const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const paragraphs = values => values.map(value => `<p>${e(value)}</p>`).join('');
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const sectionLabel = (number, label) => `<div class="section-label"><span class="mono">${number} /</span><span>${e(label)}</span></div>`;

// Accept only local assets. An empty slot uses the editorial artwork, never a fake screenshot.
function imageMarkup(image) {
  const localImage = value => /^assets\/[a-z0-9][a-z0-9_-]*\.(?:png|jpe?g|webp|avif|svg)$/i.test(value || '');
  if (!localImage(image?.src)) return '';
  const width = Number.isInteger(image.width) && image.width > 0 ? image.width : 1600;
  const height = Number.isInteger(image.height) && image.height > 0 ? image.height : 1000;
  const responsive = localImage(image.smallSrc) ? ` srcset="${e(image.smallSrc)} 800w, ${e(image.src)} ${width}w" sizes="(min-width: 1440px) 689px, (min-width: 1024px) 48vw, (min-width: 768px) 90vw, calc(100vw - 48px)"` : '';
  return `<figure class="real-media"><img src="${e(image.src)}"${responsive} alt="${e(image.alt)}" width="${width}" height="${height}" loading="lazy" decoding="async">${image.caption ? `<figcaption>${e(image.caption)}</figcaption>` : ''}</figure>`;
}

function courtGraphic(caption) {
  return `<figure class="project-art reveal"><div class="art-meta mono" aria-hidden="true"><span>RYUDAI / HANDTRACK</span><span>01 — WEB APPLICATION</span></div><div class="court-wrap" aria-hidden="true"><svg class="court" viewBox="0 0 800 440" fill="none"><rect x="46" y="42" width="708" height="356" rx="2"/><path d="M400 42v356"/><circle cx="400" cy="220" r="48"/><path d="M46 92h25a128 128 0 0 1 0 256H46M754 92h-25a128 128 0 0 0 0 256h25"/><path class="court-dash" d="M46 60h30a160 160 0 0 1 0 320H46M754 60h-30a160 160 0 0 0 0 320h30"/><path d="M46 185H30v70h16M754 185h16v70h-16M135 210v20M665 210v20"/><path class="court-route" d="M320 300 430 174 580 240 716 218"/><circle class="court-dot" cx="320" cy="300" r="8"/><circle class="court-dot" cx="430" cy="174" r="8"/><circle class="court-dot" cx="580" cy="240" r="8"/><circle class="court-ball" cx="716" cy="218" r="12"/></svg></div><div class="art-word" aria-hidden="true">PLAY.<br><span>UNDERSTAND.</span></div><figcaption>${e(caption)}</figcaption></figure>`;
}

function renderContent(data) {
  return `<section class="hero" id="top" aria-labelledby="hero-title"><div class="container">
    <div class="hero-kicker mono"><span><i class="status-dot" aria-hidden="true"></i> PERSONAL PORTFOLIO</span><span>OKINAWA, JAPAN</span></div>
    <div class="hero-stage"><div class="hero-identity"><h1 id="hero-title" class="hero-title" lang="ja">${e(data.name)}</h1><p class="hero-romanized" lang="en">${e(data.romanizedName)}</p><p class="hero-tagline">${data.hero.lines.map(line=>`<span>${e(line)}</span>`).join('')}</p></div>
    <div class="connection-art" aria-hidden="true"><div class="connection-ring ring-one"></div><div class="connection-ring ring-two"></div><div class="connection-ring ring-three"></div><span class="connection-cross">✳</span><span class="connection-caption mono">THINK / ACT / CONNECT</span></div></div>
    <div class="hero-details"><div class="hero-intro"><p class="hero-subtitle">${(data.hero.subtitle.match(/[^｜・]+[｜・]?/gu) || []).map(part=>`<span>${e(part)}</span>`).join('')}</p><a class="round-link" href="#projects"><span>${e(data.hero.cta)}</span><span class="round-arrow" aria-hidden="true">↘</span></a></div><div class="hero-copy prose">${paragraphs(data.hero.paragraphs)}</div></div>
    <div class="hero-bottom mono"><span>AI / SYSTEM DEVELOPMENT / HANDBALL</span><a href="#about">${e(data.hero.scroll)} <span aria-hidden="true">↓</span></a></div>
  </div></section>
  <section class="about dark-section" id="about" aria-labelledby="about-title"><div class="container">${sectionLabel('01',data.about.label)}<div class="about-layout"><div class="about-heading reveal"><h2 id="about-title">${e(data.about.title)}<span class="blue-dot" aria-hidden="true">.</span></h2></div><div class="about-copy prose reveal">${paragraphs(data.about.paragraphs)}</div></div><div class="about-foot mono" aria-hidden="true"><span>UNIVERSITY OF THE RYUKYUS</span><span>305LAB</span><span>HANDBALL</span></div></div></section>
  <section class="projects light-section" id="projects" aria-labelledby="projects-title"><div class="container">${sectionLabel('02',data.projects.label)}<div class="section-title-row reveal"><h2 id="projects-title">${e(data.projects.title)}<span class="blue-dot" aria-hidden="true">.</span></h2><span class="section-counter mono" aria-hidden="true">${String(data.projects.items.length).padStart(2,'0')}</span></div>${data.projects.items.map((item,index)=>`<article class="project">${imageMarkup(item.image)||courtGraphic(item.visualCaption)}<div class="project-info"><div class="project-title reveal"><p class="mono category">${String(index+1).padStart(2,'0')} / ${e(item.category)}</p><h3>${e(item.title).replace('RYUDAIHandTrack','RYUDAI<wbr>HandTrack')}</h3></div><div class="prose reveal">${paragraphs(item.paragraphs)}</div></div></article>`).join('')}</div></section>
  <section class="experience light-section" id="experience" aria-labelledby="experience-title"><div class="container">${sectionLabel('03',data.experience.label)}<div class="section-title-row reveal"><h2 id="experience-title">${e(data.experience.title)}<span class="blue-dot" aria-hidden="true">.</span></h2><span class="section-counter mono" aria-hidden="true">${String(data.experience.items.length).padStart(2,'0')}</span></div><div class="experience-list">${data.experience.items.map((item,index)=>{
    const media = imageMarkup(item.image);
    return `<article class="experience-item${media?' has-media':''} reveal"><span class="experience-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div class="experience-content"><div class="experience-heading"><p class="category mono">${e(item.category)}</p><h3>${e(item.title)}</h3></div><div class="experience-details">${media}<div class="experience-body prose">${paragraphs(item.paragraphs)}</div></div></div></article>`;
  }).join('')}</div></div></section>
  <section class="contact dark-section" id="contact" aria-labelledby="contact-title"><div class="container">${sectionLabel('04',data.contact.label)}<div class="contact-title-wrap reveal"><h2 id="contact-title" lang="en">Let's<br><em>Connect.</em></h2><span class="contact-arrow" aria-hidden="true">↗</span></div><div class="contact-links"><a class="email-link reveal" href="mailto:${CONTACT_EMAIL}"><span class="contact-link-label mono">${e(data.contact.emailLabel)}</span><span class="email-address">${CONTACT_EMAIL}${arrow}</span></a><div class="lab-link reveal"><p class="contact-link-label mono">${e(data.contact.labLabel)}</p><a href="${LAB_INSTAGRAM}" target="_blank" rel="noopener noreferrer">${e(data.contact.instagramLabel)}${arrow}<span class="sr-only"> (${e(data.contact.externalLabel)})</span></a></div></div></div></section>`;
}

function closeMenu(returnFocus = false) {
  const toggle = document.querySelector('.menu-toggle');
  const wasOpen = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded','false');
  document.querySelector('.site-header').classList.remove('menu-open');
  toggle.setAttribute('aria-label',cache.get(activeLanguage)?.nav.menu || 'メニューを開く');
  if (returnFocus && wasOpen) toggle.focus();
}

function setupMotion() {
  revealObserver?.disconnect();
  document.querySelectorAll('.reveal').forEach(element => element.classList.remove('will-reveal'));
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('will-reveal');
      revealObserver.unobserve(entry.target);
    }
  }), {threshold:0.08});
  document.querySelectorAll('.reveal').forEach(element => {
    // Visible and above-the-fold content always stays readable, including after a language switch.
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('will-reveal');
      revealObserver.observe(element);
    }
  });
}

function setupSectionNavigation() {
  sectionObserver?.disconnect();
  if (!('IntersectionObserver' in window)) return;
  sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      document.querySelectorAll('#navigation a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    }
  }, {rootMargin:'-15% 0px -65% 0px'});
  document.querySelectorAll('#content > section').forEach(section => sectionObserver.observe(section));
}

function render(data, language) {
  const anchor = initialized ? [...document.querySelectorAll('#content > section')].reverse().find(section=>section.getBoundingClientRect().top<=140) : null;
  const anchorId = anchor?.id;
  const anchorOffset = anchor?.getBoundingClientRect().top;
  document.querySelector('#content').innerHTML = renderContent(data);
  document.querySelector('#navigation').innerHTML = ['about','projects','experience','contact'].map(id=>`<a href="#${id}">${e(data.nav[id])}${id==='contact'?'<span aria-hidden="true"> ↗</span>':''}</a>`).join('');
  document.documentElement.lang = language;
  document.title = data.meta.title;
  document.querySelector('meta[name="description"]').content = data.meta.description;
  document.querySelector('meta[property="og:title"]').content = data.meta.title;
  document.querySelector('meta[property="og:description"]').content = data.meta.description;
  document.querySelector('meta[property="og:locale"]').content = language === 'ja' ? 'ja_JP' : 'en_US';
  document.querySelector('#footer-name').textContent = data.footer.copyright;
  document.querySelector('#top-label').textContent = data.footer.top;
  document.querySelectorAll('[data-lang]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lang===language)));
  closeMenu();
  if (initialized) document.querySelector('#language-status').textContent = data.ui.languageChanged;
  // Preserve the reader's section when English and Japanese occupy different heights.
  if (anchorId && window.scrollY > 0) {
    const newAnchor = document.getElementById(anchorId);
    window.scrollTo({top:window.scrollY+newAnchor.getBoundingClientRect().top-anchorOffset,behavior:'instant'});
  } else if (!initialized && location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView({behavior:'instant'});
  }
  setupMotion();
  setupSectionNavigation();
}

async function setLanguage(language) {
  if (!LANGUAGES.includes(language)) language = 'ja';
  requestedLanguage = language;
  const currentRequest = ++requestId;
  try {
    if (!cache.has(language)) {
      const response = await fetch(`locales/${language}.json`);
      if (!response.ok) throw new Error('Locale unavailable');
      cache.set(language,await response.json());
    }
    if (currentRequest !== requestId) return;
    activeLanguage = language;
    render(cache.get(language),language);
    initialized = true;
    document.querySelector('#error').hidden = true;
    document.querySelector('#retry').textContent = cache.get(language).ui.retry;
    try { localStorage.setItem('profile-language',language); } catch { /* Storage is optional. */ }
  } catch {
    if (currentRequest !== requestId) return;
    // Keep the pre-rendered Japanese page (or current translation) available on failure.
    document.querySelector('#error-message').textContent = '翻訳データを読み込めませんでした。Windowsでは start-local.bat を起動し、http://127.0.0.1:8000/ を開いてください。 / Could not load translations. Run start-local.bat and open http://127.0.0.1:8000/.';
    document.querySelector('#error').hidden = false;
  }
}

// BROWSER_INITIALIZATION — the static snapshot helper evaluates only the renderer above.
const menuButton = document.querySelector('.menu-toggle');
menuButton.hidden = false;
document.documentElement.classList.add('js');
menuButton.addEventListener('click',()=>{
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded',String(open));
  document.querySelector('.site-header').classList.toggle('menu-open',open);
  const nav = cache.get(activeLanguage)?.nav;
  menuButton.setAttribute('aria-label',open ? (nav?.close || 'メニューを閉じる') : (nav?.menu || 'メニューを開く'));
});
document.querySelector('#navigation').addEventListener('click',event=>{
  if (event.target.closest('a')) closeMenu(true);
});
document.querySelector('.brand').addEventListener('click',()=>closeMenu());
document.addEventListener('keydown',event=>{if(event.key==='Escape') closeMenu(true);});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header')) closeMenu();});
mobileLayout.addEventListener('change',()=>closeMenu());
motionPreference.addEventListener('change',setupMotion);
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
document.querySelector('#retry').addEventListener('click',()=>setLanguage(requestedLanguage));
document.querySelector('#year').textContent = new Date().getFullYear();
let initialLanguage = 'ja';
try { initialLanguage = localStorage.getItem('profile-language') || 'ja'; } catch { /* Default to Japanese. */ }
setLanguage(initialLanguage);
