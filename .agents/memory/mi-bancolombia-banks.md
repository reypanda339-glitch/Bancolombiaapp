---
name: Mi Bancolombia banks by currency
description: Real bank lists per currency/country for the Mi Bancolombia transfer screens
---

`BANKS_BY_CURRENCY` in `artifacts/mi-bancolombia/constants/countries.ts` maps currency code (e.g. "COP", "USD", "EUR") to an array of real, full bank names.

`getBanksByCountry(countryCode)` derives the right bank list from the user's country code.

**Why:** The user explicitly requires real banks per country — no fake/placeholder names. Colombian users (COP) must see Bancolombia, Davivienda, Banco de Bogotá, etc. USD users see Chase, Bank of America, Wells Fargo, etc.

**How to apply:** In the transfer screen, `const banks = BANKS_BY_CURRENCY[currencyCode] ?? BANKS_BY_CURRENCY.COP` and use those bank names for contact/bank-picker lists. Never hardcode bank names in component files.
