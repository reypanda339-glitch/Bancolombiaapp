---
name: Mi Bancolombia +html.tsx PWA CSS
description: Safe vs. unsafe CSS patterns in Expo Router's +html.tsx for React Native Web PWA
---

# +html.tsx Safe CSS for React Native Web

## The Rule
NEVER use `body { position: fixed }` in `+html.tsx`. It breaks React Native Web rendering completely (blank white screen).

**Why:** React Native Web renders its root into `#root` using absolute positioning internally. Adding `position: fixed` on `body` collapses the layout context and the app never appears.

**How to apply:** Use only these safe body styles:
```css
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overscroll-behavior: none;
  overscroll-behavior-y: none;
  -webkit-overflow-scrolling: touch;
  -webkit-user-select: none;
  user-select: none;
}
```
Allow `html { height: 100% }` — that's fine. Do NOT set `body { position: fixed }`, `body { overflow: hidden }`, or `#root { overflow: hidden; height: 100% }`.

## Safe PWA additions
- `-webkit-tap-highlight-color: transparent` on `*`
- `scrollbar-width: none` on `*` to hide scrollbars
- `input, textarea, select { font-size: 16px !important }` to prevent iOS zoom
- `overscroll-behavior: none` on body to prevent pull-to-refresh
