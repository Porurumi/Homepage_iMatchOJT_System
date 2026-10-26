/* Lightweight interactions, no framework or external animation dependency. */
'use strict';

document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollIndicator = document.getElementById('scroll-indicator');
const siteHeader = document.querySelector('.site-header');
const mobileToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
const navLinks = Array.from(document.querySelectorAll('.desktop-nav .nav-link'));
const sections = Array.from(document.querySelectorAll('main section[id]'));

// A single requestAnimationFrame per scroll frame for the progress indicator and header.
let pendingScrollFrame = false;
function updateScrollState() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  scrollIndicator.style.width = `${Math.max(0, Math.min(100, window.scrollY / maxScroll * 100))}%`;
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
  pendingScrollFrame = false;
}
window.addEventListener('scroll', () => {
  if (pendingScrollFrame) return;
  pendingScrollFrame = true;
  window.requestAnimationFrame(updateScrollState);
}, { passive: true });
updateScrollState();

function closeMobileMenu() {
  if (!mobileToggle || !mobileNav) return;
  mobileToggle.setAttribute('aria-expanded', 'false');
  mobileToggle.setAttribute('aria-label', 'Open navigation');
  mobileNav.hidden = true;
}

if (mobileToggle && mobileNav) {
  mobileToggle.addEventListener('click', () => {
    const opening = mobileToggle.getAttribute('aria-expanded') !== 'true';
    mobileToggle.setAttribute('aria-expanded', String(opening));
    mobileToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !opening;
  });
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMobileMenu();
  });
  const desktopBreakpoint = window.matchMedia('(min-width: 901px)');
  desktopBreakpoint.addEventListener('change', e => { if (e.matches) closeMobileMenu(); });
}

// Reveal as content enters view; the CSS fallback shows everything without JavaScript.
const reveals = document.querySelectorAll('.reveal');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  reveals.forEach(el => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 40px 0px' });
  reveals.forEach(el => revealObserver.observe(el));
}

// Highlight the relevant nav item while reading different sections.
if ('IntersectionObserver' in window && sections.length) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const isActive = link.hash === `#${entry.target.id}`;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-24% 0px -58% 0px' });
  sections.forEach(section => navObserver.observe(section));
}

// Accessible single-selection tabs, including keyboard arrow support.
function createTabGroup(buttonSelector, panelSelector) {
  const tabs = Array.from(document.querySelectorAll(buttonSelector));
  const panels = Array.from(document.querySelectorAll(panelSelector));
  if (!tabs.length || !panels.length) return;
  function activate(tab, focus = false) {
    tabs.forEach(t => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = panel.id !== tab.getAttribute('aria-controls');
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(tabs[next], true);
    });
  });
}
createTabGroup('.showcase-tab', '.showcase-panel');
createTabGroup('.role-tab', '.role-panel');

const year = document.getElementById('current-year');
if (year) year.textContent = String(new Date().getFullYear());
