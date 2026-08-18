# Home Management App — Phase 0

This repository contains the Phase 0 scaffold for the Home Management App.

Goal: create the minimal project structure so the project opens locally and the architecture document remains the source of truth.

Project structure:

- `index.html`
- `css/styles.css`
- `js/app.js`
- `docs/PLAN-AND-ARCHITECTURE.md` — the source of truth for product and implementation decisions

Read `docs/PLAN-AND-ARCHITECTURE.md` before making implementation changes. The `data/` folder described there can be added when sample data is introduced in a later phase.

How to verify locally:

1. Open `index.html` in a browser (double-click it) — you should see "Phase 0 — Project scaffold".
2. Open the browser DevTools Console — you should see the message `Phase 0 scaffold loaded`.
3. Click "Open dashboard placeholder" — an alert should appear.

Optional local server (recommended for some browsers):

```bash
python -m http.server 8000
# then open http://localhost:8000/index.html
```

Recommended git commit message:

```
Phase 0: add minimal static scaffold (index.html, css, js, README)
```
