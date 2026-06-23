---
name: Mi Bancolombia TextInput fontSize rule
description: All TextInput components must use fontSize >= 16 to prevent iOS zoom
---

# TextInput fontSize Rule

## The Rule
Every `TextInput` component in the app must have `fontSize: 16` (or higher). Never use fontSize < 16 on any input.

**Why:** iOS Safari/WebKit zooms the viewport on focus when input fontSize < 16px. This breaks the PWA experience completely — the page zooms in and never returns to normal.

**How to apply:** Check all StyleSheet definitions for `input`, `editInput`, `searchInput`, `noteInput`, `inputStyle` variables. The global `+html.tsx` includes `input, textarea, select { font-size: 16px !important }` as a CSS safety net, but the RN style values should also be 16.

## Files fixed (as of 2026-06-23)
- login.tsx, register.tsx — inputStyle
- forgot-password.tsx — styles.input (already 16)
- cards.tsx — editInput
- payments.tsx — bS.modalInput
- transfers.tsx — inputStyle, searchInput, noteInput
- admin/usuarios.tsx — searchInput, editInput
- admin/cuentas.tsx — searchInput, editInput
- admin/auditoria.tsx — searchInput + inline TextInput
- admin/movimientos.tsx — searchInput
