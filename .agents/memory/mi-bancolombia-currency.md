---
name: Mi Bancolombia currency formatting
description: Canonical way to display balances and amounts in the Mi Bancolombia Expo app
---

The function `formatBalance(amount, currencyCode, currencySymbol, showCode)` lives in `artifacts/mi-bancolombia/constants/countries.ts`.

Format: `[symbol] [number] [code]` e.g. `$ 2.654.112 COP`, `US$ 1,234.56 USD`, `€ 1.234,00 EUR`

**Why:** The app supports multiple countries/currencies. Using `Intl.NumberFormat` with hardcoded "COP" was wrong for multi-currency accounts. The canonical formatter handles locale (en-US for USD/GBP/CAD, es-CO for the rest) and whole-number currencies (COP, CLP, PYG, VES, CRC, DOP have 0 decimals).

**How to apply:** Import `{ formatBalance }` from `@/constants/countries` in any component that displays money. Pass `showCode=true` for full display, `showCode=false` for compact display without the ISO code suffix.
