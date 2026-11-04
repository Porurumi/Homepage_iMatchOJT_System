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



/* =========================================
   FIRST-LOAD GUIDED SECTION SCROLLING

   - Active whenever the page is loaded/refreshed
   - Downward scrolling moves section by section
   - Upward scrolling remains manual
   - Reaching the bottom disables guided scrolling
   - Returning to the top keeps normal scrolling
   - Refreshing activates guided scrolling again
   ========================================= */

const sectionScrollEnabled = window.matchMedia(
  '(min-width: 901px) and (pointer: fine)'
);

const pageScrollSections = Array.from(
  document.querySelectorAll(
    'main > section, footer.footer'
  )
);

// State resets automatically with every page load.
let guidedScrollActive = true;
let sectionScrollLocked = false;
let sectionScrollStarted = 0;
let lastDownWheelTime = 0;
let sectionScrollTimer = null;

// On refresh, start from the homepage introduction.
// Preserve links that intentionally open a specific section.
const navigationEntry =
  performance.getEntriesByType('navigation')[0];

if (
  navigationEntry?.type === 'reload' &&
  !window.location.hash
) {
  const previousRestoration =
    history.scrollRestoration;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  window.addEventListener('pageshow', () => {
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });

    requestAnimationFrame(() => {
      if ('scrollRestoration' in history) {
        history.scrollRestoration =
          previousRestoration;
      }
    });
  }, { once: true });
}

// Disable guided scrolling for the rest of this page load.
function finishGuidedScrolling() {
  guidedScrollActive = false;
  sectionScrollLocked = false;

  clearTimeout(sectionScrollTimer);
  sectionScrollTimer = null;
}

// Check whether the visitor reached the actual page bottom.
function isAtPageBottom() {
  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight -
      window.innerHeight
  );

  return (
    maxScroll > 0 &&
    window.scrollY >= maxScroll - 5
  );
}

// Disable guided scrolling when the bottom is reached,
// including when using the scrollbar or keyboard.
window.addEventListener('scroll', () => {
  if (
    guidedScrollActive &&
    isAtPageBottom()
  ) {
    finishGuidedScrolling();
  }
}, { passive: true });

// Calculate each section's scrolling position.
function getSectionScrollStops() {
  const headerHeight = siteHeader
    ? siteHeader.offsetHeight
    : 0;

  const visibleHeight = Math.max(
    250,
    window.innerHeight - headerHeight
  );

  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight -
      window.innerHeight
  );

  const stops = [0];

  pageScrollSections.forEach(section => {
    const rect = section.getBoundingClientRect();

    const sectionTop =
      rect.top + window.scrollY;

    const start = Math.max(
      0,
      Math.min(
        maxScroll,
        sectionTop - headerHeight
      )
    );

    const scrollableDistance = Math.max(
      0,
      rect.height - visibleHeight
    );

    const step = Math.max(
      300,
      visibleHeight * 0.8
    );

    // Stop at the beginning of the section.
    stops.push(start);

    // Divide long sections into readable portions.
    for (
      let distance = step;
      distance < scrollableDistance - 100;
      distance += step
    ) {
      stops.push(
        Math.min(maxScroll, start + distance)
      );
    }

    // Add a final stop for longer sections.
    if (scrollableDistance > 150) {
      stops.push(
        Math.min(
          maxScroll,
          start + scrollableDistance
        )
      );
    }
  });

  // Always allow the final scroll to reach the footer bottom.
  stops.push(maxScroll);

  const sorted = stops
    .map(value => Math.round(value))
    .sort((a, b) => a - b);

  const unique = sorted.filter(
    (value, index) =>
      index === 0 ||
      value - sorted[index - 1] > 40
  );

  // Keep the actual bottom reachable.
  const bottom = Math.round(maxScroll);

  if (unique[unique.length - 1] !== bottom) {
    unique.push(bottom);
  }

  return unique;
}

// Prevent one wheel gesture from skipping sections.
function scheduleSectionScrollUnlock() {
  clearTimeout(sectionScrollTimer);

  function checkScrollFinished() {
    if (!guidedScrollActive) return;

    const now = performance.now();

    const minimumDuration =
      now - sectionScrollStarted >= 700;

    const wheelStopped =
      now - lastDownWheelTime >= 180;

    if (minimumDuration && wheelStopped) {
      sectionScrollLocked = false;
    } else {
      sectionScrollTimer = setTimeout(
        checkScrollFinished,
        100
      );
    }
  }

  sectionScrollTimer = setTimeout(
    checkScrollFinished,
    700
  );
}

// Handle desktop mouse-wheel and trackpad scrolling.
window.addEventListener('wheel', event => {
  if (
    !guidedScrollActive ||
    !sectionScrollEnabled.matches ||
    reducedMotion.matches ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return;
  }

  // Preserve horizontal scrolling.
  if (
    Math.abs(event.deltaX) >
    Math.abs(event.deltaY)
  ) {
    return;
  }

  // UPWARD SCROLLING: always manual.
  // The guide stays available until the bottom is reached.
  if (event.deltaY < 0) {
    if (sectionScrollLocked) {
      sectionScrollLocked = false;
      clearTimeout(sectionScrollTimer);

      // Cancel the current downward smooth transition.
      window.scrollTo({
        top: window.scrollY,
        behavior: 'instant'
      });
    }

    return;
  }

  if (event.deltaY === 0) return;

  // Preserve native scrolling in interactive controls.
  if (
    event.target instanceof Element &&
    event.target.closest(
      'textarea, select, ' +
      '[contenteditable="true"], ' +
      '[role="dialog"], ' +
      '.showcase-tabs'
    )
  ) {
    return;
  }

  // End the guide when the footer bottom is reached.
  if (isAtPageBottom()) {
    finishGuidedScrolling();
    return;
  }

  if (!event.cancelable) return;

  // Control downward movement while guided mode is active.
  event.preventDefault();

  // Avoid skipping multiple sections in one gesture.
  if (sectionScrollLocked) {
    lastDownWheelTime = performance.now();
    return;
  }

  const currentPosition = window.scrollY;

  const nextStop = getSectionScrollStops().find(
    position => position > currentPosition + 35
  );

  if (nextStop === undefined) {
    finishGuidedScrolling();
    return;
  }

  sectionScrollLocked = true;
  sectionScrollStarted = performance.now();
  lastDownWheelTime = sectionScrollStarted;

  // Move smoothly to the next section.
  window.scrollTo({
    top: nextStop,
    behavior: 'smooth'
  });

  scheduleSectionScrollUnlock();

}, { passive: false });

// The closing "Back to the beginning" button also
// finishes guided scrolling for the current page load.
document.querySelector(
  '.closing a[href="#top"]'
)?.addEventListener(
  'click',
  finishGuidedScrolling
);


/* Adaptive Hero Floating Cards */

const heroInner = document.querySelector('.hero-inner');

const heroFloaties = heroInner
  ? Array.from(heroInner.querySelectorAll('.float-chip'))
  : [];

const heroContent = heroInner
  ? [
      '.hero-pill',
      '.hero-title',
      '.hero-lead',
      '.hero-actions',
      '.hero-proof',
      '.hero-scroll-cue'
    ]
      .map(selector => heroInner.querySelector(selector))
      .filter(Boolean)
  : [];

const floatMobileBreakpoint =
  window.matchMedia('(max-width: 700px)');

let floatUpdateFrame = 0;

// Calculate the overlapping area between two elements.
function getOverlapArea(a, b, padding = 0) {
  const width = Math.max(
    0,
    Math.min(a.right, b.right + padding) -
    Math.max(a.left, b.left - padding)
  );

  const height = Math.max(
    0,
    Math.min(a.bottom, b.bottom + padding) -
    Math.max(a.top, b.top - padding)
  );

  return width * height;
}

// Adjust each floating card independently.
function updateHeroFloaties() {
  floatUpdateFrame = 0;

  if (!heroFloaties.length) return;

  // Hide all floating cards on mobile.
  if (floatMobileBreakpoint.matches) {
    heroFloaties.forEach(chip => {
      chip.style.setProperty('--float-opacity', '0');
    });
    return;
  }

  const contentRects = heroContent.map(element =>
    element.getBoundingClientRect()
  );

  const floatRects = heroFloaties.map(chip =>
    chip.getBoundingClientRect()
  );

  // Gradually fade from 820px down to 700px.
  const screenFade = Math.max(
    0,
    Math.min(1, (window.innerWidth - 700) / 120)
  );

  heroFloaties.forEach((chip, index) => {
    const rect = floatRects[index];
    const area = Math.max(1, rect.width * rect.height);

    let opacity = 1;

    // Fade when approaching or overlapping main content.
    contentRects.forEach(contentRect => {
      const overlap =
        getOverlapArea(rect, contentRect, 12) / area;

      const fade = Math.max(
        0,
        1 - overlap / 0.55
      );

      opacity = Math.min(opacity, fade);
    });

    // Fade when floating cards overlap one another.
    floatRects.forEach((other, otherIndex) => {
      if (index === otherIndex) return;

      const overlap =
        getOverlapArea(rect, other, 5) / area;

      const fade = Math.max(
        0,
        1 - overlap / 0.7
      );

      opacity = Math.min(opacity, fade);
    });

    opacity = Math.min(opacity, screenFade);

    chip.style.setProperty(
      '--float-opacity',
      opacity.toFixed(3)
    );
  });
}

// Schedule updates without continuously recalculating.
function scheduleHeroFloatUpdate() {
  if (floatUpdateFrame) return;

  floatUpdateFrame = requestAnimationFrame(
    updateHeroFloaties
  );
}

if (heroFloaties.length) {
  window.addEventListener(
    'resize',
    scheduleHeroFloatUpdate,
    { passive: true }
  );

  window.addEventListener(
    'load',
    scheduleHeroFloatUpdate,
    { once: true }
  );

  // Recalculate after fonts finish loading.
  if (document.fonts?.ready) {
    document.fonts.ready.then(
      scheduleHeroFloatUpdate
    );
  }

  // Watch for changes to hero content dimensions.
  if ('ResizeObserver' in window) {
    const heroResizeObserver =
      new ResizeObserver(scheduleHeroFloatUpdate);

    heroContent.forEach(element => {
      heroResizeObserver.observe(element);
    });
  }

  // Recalculate after entrance animations.
  heroContent.forEach(element => {
    element.addEventListener(
      'animationend',
      scheduleHeroFloatUpdate
    );
  });

  scheduleHeroFloatUpdate();
}

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




/* Explore iMatchOJT modal: desktop and mobile */

const appDialog = document.getElementById(
  'app-entry-dialog'
);

const appOpenButtons = document.querySelectorAll(
  '#open-app-dialog, #open-app-dialog-mobile'
);

if (appDialog) {
  appOpenButtons.forEach(button => {
    button.addEventListener('click', () => {
      closeMobileMenu();
      appDialog.showModal();
    });
  });

  appDialog.addEventListener('click', event => {
    if (event.target === appDialog) {
      appDialog.close();
    }
  });
}


