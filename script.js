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

function courtGraphic(caption, replayLabel) {
  return `<figure class="project-art"><div class="art-meta mono" aria-hidden="true"><span>RYUDAI / HANDTRACK</span><span>01 — WEB APPLICATION</span></div><div class="court-wrap" aria-hidden="true"><svg class="court" viewBox="0 0 800 440" fill="none"><rect pathLength="1" x="46" y="42" width="708" height="356" rx="2"/><path pathLength="1" d="M400 42v356"/><circle pathLength="1" cx="400" cy="220" r="48"/><path pathLength="1" d="M46 92h25a128 128 0 0 1 0 256H46M754 92h-25a128 128 0 0 0 0 256h25"/><path class="court-dash" d="M46 60h30a160 160 0 0 1 0 320H46M754 60h-30a160 160 0 0 0 0 320h30"/><path pathLength="1" d="M46 185H30v70h16M754 185h16v70h-16M135 210v20M665 210v20"/><path class="court-route" d="M320 300 430 174 580 240 716 218"/><circle class="court-dot" cx="320" cy="300" r="8"/><circle class="court-dot" cx="430" cy="174" r="8"/><circle class="court-dot" cx="580" cy="240" r="8"/><circle class="court-ball" cx="716" cy="218" r="12"/></svg></div><div class="art-word" aria-hidden="true"><b>PLAY.</b><span>UNDERSTAND.</span></div><figcaption>${e(caption)}</figcaption><button class="replay-pass" type="button">${e(replayLabel)} <span aria-hidden="true">↻</span></button></figure>`;
}

function renderContent(data) {
  return `<section class="cover" id="top" aria-labelledby="hero-title">
    <div class="cover-track"><div class="cover-stage">
      <div class="cover-photo"><img src="assets/handball.jpg" srcset="assets/handball-800.jpg 800w, assets/handball.jpg 1600w" sizes="100vw" width="1600" height="1066" fetchpriority="high" alt="${e(data.hero.photoAlt)}"></div>
      <svg class="cover-arc" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true"><path d="M-12 460 C80 160 480 -40 780 80 M1205 585 Q1100 880 760 895"/></svg>
      <div class="cover-name"><p>PERSONAL PORTFOLIO</p><h1 id="hero-title" aria-label="${e(data.romanizedName)}">${data.romanizedName.split(' ').map(word=>`<svg aria-hidden="true" viewBox="0 0 540 152"><text x="14" y="136" textLength="505" lengthAdjust="spacingAndGlyphs" transform="skewX(-10)" dx="12">${e(word)}</text></svg>`).join('')}</h1><small>OKINAWA, JAPAN<br>University of the Ryukyus</small></div>
      <div class="cover-copy"><h2>${data.hero.lines.map(line=>`<span>${e(line)}</span>`).join(' ')}</h2><p>${e(data.hero.subtitle)}</p></div>
      <a class="cover-scroll" href="#about">${e(data.hero.scroll)} ↓</a>
    </div></div></section>
  <section class="about mindset dark-section" id="about" aria-labelledby="about-title"><div class="container">${sectionLabel("01","MINDSET")}<h2 id="about-title" class="mindset-label">${e(data.about.title)}</h2><p class="mindset-statement">${e(data.hero.paragraphs[0])}</p><div class="mindset-columns"><div class="mindset-values prose">${paragraphs(data.hero.paragraphs.slice(1))}</div><div class="about-copy prose">${paragraphs(data.about.paragraphs)}</div></div><a class="round-link mindset-next" href="#projects">${e(data.hero.cta)} <span class="round-arrow">↘</span></a></div></section>
  <section class="projects build light-section" id="projects" aria-labelledby="projects-title"><div class="container">${sectionLabel("02","BUILD")}<h2 id="projects-title" class="build-label">${e(data.projects.title)}</h2>${data.projects.items.map(item=>`<article class="build-project"><header class="build-heading"><p class="category mono">${e(item.category)}</p><h3>${e(item.title).replace("RYUDAIHandTrack","RYUDAI<wbr>HandTrack")}</h3></header>${courtGraphic(item.visualCaption,data.projects.replayLabel)}<div class="build-result">${imageMarkup(item.image)}<div class="build-copy prose">${paragraphs(item.paragraphs)}</div></div></article>`).join("")}</div></section>
  <section class="experience light-section" id="experience" aria-labelledby="experience-title"><div class="container">${sectionLabel("03",data.experience.label)}<h2 id="experience-title">${e(data.experience.title)}</h2><div class="activity-stories">${data.experience.items.map((item,index)=>{const media=imageMarkup(item.image);const type=item.layout || "story";return `<article class="activity activity--${e(type)}"><header class="activity-heading"><p class="category mono">${String(index+1).padStart(2,"0")} / ${e(item.category)}</p><h3>${e(item.title)}</h3></header>${item.steps ? `<ol class="activity-flow">${item.steps.map(step=>`<li>${e(step)}</li>`).join("")}</ol>`:""}<div class="activity-detail">${media}<div class="prose">${paragraphs(item.paragraphs)}</div></div></article>`;}).join("")}</div></div></section>
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
  bindCoverScroll();
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

document.querySelector('#content').addEventListener('click', event => {
  const button = event.target.closest('.replay-pass');
  if (!button || motionPreference.matches) return;
  const ball = button.closest('figure').querySelector('.court-ball');
  ball.getAnimations().forEach(animation => animation.cancel());
  ball.animate([
    {transform:'translate(-396px,82px)',offset:0},
    {transform:'translate(-286px,-44px)',offset:.32},
    {transform:'translate(-136px,22px)',offset:.66},
    {transform:'translate(0,0)',offset:1}
  ], {duration:1500,easing:'ease-in-out'});
});

let releaseCoverScroll;
function bindCoverScroll() {
  releaseCoverScroll?.();
  const track = document.querySelector('.cover-track');
  if (!track || motionPreference.matches) return;
  track.classList.add('tracks-scroll');
  const stage = track.querySelector('.cover-stage');
  let frame = 0;
  const ramp = (value, start, end) => Math.min(1, Math.max(0, (value-start)/(end-start)));
  function paint() {
    frame = 0;
    const bounds = track.getBoundingClientRect();
    const progress = ramp(-bounds.top, 0, Math.max(1, Math.min(bounds.height, window.innerHeight)));
    const move = ramp(progress, 0, .68);
    const values = {
      '--split': ramp(progress, 0, .42),
      '--ink': 1-ramp(progress, .04, .38),
      '--shift': move,
      '--photo-alpha': 1-ramp(progress, .58, 1)
    };
    for (const [key,value] of Object.entries(values)) stage.style.setProperty(key, value);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  paint();
  releaseCoverScroll = () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    cancelAnimationFrame(frame);
    track.classList.remove('tracks-scroll');
    stage.removeAttribute('style');
  };
}
motionPreference.addEventListener('change', bindCoverScroll);
