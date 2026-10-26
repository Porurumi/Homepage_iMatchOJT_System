# iMatchOJT | InternAlly-inspired Informational Homepage

An original redesign of the previous standalone iMatchOJT informational homepage, inspired by the **overall clean SaaS design and soft interaction style** of internally.co.uk. This project does **not** reuse InternAlly's code, visual assets, text, or logo.

## Getting started

1. Extract the ZIP into a folder.
2. Open `index.html` in a browser, or use VS Code Live Server.
3. No installation, dependencies, login, API keys, or backend are needed.

## Files

- `index.html`: All homepage sections, interactive role guide, and feature illustrations.
- `css/homepage/style.css`: Responsive layouts, maroon theme, floating cards, transitions, and animations.
- `js/homepage/script.js`: Mobile navigation, scroll progress bar, IntersectionObserver reveals, active navigation highlighting, and accessible tabs.
- `assets/pup-santa-rosa-building.webp`: Optimized version of the **reference image supplied by the user**.

## Sections

Home hero → interface illustration → role strip → about → feature cards → interactive system feature showcase → How it works (four roles) → creator placeholders → closing section → footer.

## Motion and accessibility

- Staggered hero fade/slide entrance
- Floating cards and a subtly animated scroll cue
- Smooth in-page navigation and scroll progress line
- Content reveal on scroll, soft hover lift, tab crossfade
- Sticky navigation with scroll state and active-section highlighting
- `prefers-reduced-motion` support
- Accessible role/feature tabs with keyboard arrow navigation
- Lazy-loaded building photo
- Progressive enhancement: content is visible without JS

## Before publishing

- Replace the three creator cards with the real team members and their names, photos, and roles. Add/remove cards as needed.
- The dashboard and feature display are *illustrations*, **not** direct copies/screenshots of your live application. Swap them for real screenshots if desired.
- The photo was provided as a reference image; ensure you have permission to use it publicly.
- Verify each public-facing statement against the current system before deployment.

## GitHub Desktop suggestion

Work in a feature branch, review the changed homepage files, test at mobile/tablet/desktop sizes, then commit and push using GitHub Desktop.

**Suggested commit summary:** `feat(homepage): add animated informational landing page`

**Description:**
- Redesigned public homepage in a clean product showcase style
- Added scroll transitions, hero motion, hover interactions, and responsive views
- Added interactive feature showcase and four-role OJT guide
- Removed all login and registration functionality
- Added reduced-motion support and keyboard-accessible navigation
