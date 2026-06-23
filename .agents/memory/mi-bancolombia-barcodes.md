---
name: Mi Bancolombia barcode architecture
description: How barcodes are generated and scanned in the unblock flow.
---

## Barcode Generation
- `components/BarcodeDisplay.web.tsx`: Uses jsbarcode (installed) rendering Code128 to a real `<svg>` DOM element via ref. Gives real, scannable barcodes on web/PWA.
- `components/BarcodeDisplay.tsx`: Native fallback — renders pseudo-barcode bars using react-native-svg Rect elements.
- Props: `value`, `label`, `width`, `height`, `showValue`, `lineColor`, `background`

**Why:** jsbarcode only works in browser context (document, SVG DOM). Platform split (.web.tsx) is required to avoid crashing native.

## Barcode Scanning
- In `UnblockProcessModal.tsx` → `handleScan()` / `processPickedImage()`:
  1. `expo-image-picker.launchCameraAsync()` for camera, `launchImageLibraryAsync()` for gallery
  2. `detectBarcodeFromImageUri(uri)` calls `BarcodeDetector` API (Chrome/Android only)
  3. Falls back to manual radicado entry with optional pre-fill on failure

**BarcodeDetector availability:** Chrome 83+ / Android WebView. NOT available on iOS (WebKit), Firefox, or older Edge. The fallback always works.

## Where barcodes appear
- **Admin** (`app/admin/usuarios.tsx`): Step list shows generated barcode when step has `radicadoNumber` + type `document` or `tax_certificate`.
- **User** (`components/UnblockProcessModal.tsx`): QR tab shows the assigned barcode for reference; scanning detects and pre-fills the radicado field.

## Transaction receipts
- `components/TransactionReceiptModal.tsx`: Invoice-style modal (pageSheet). Currency comes from the `account` prop (Transaction type has no currency fields).
- `components/TransactionItem.tsx`: Now accepts `onPress` prop → wraps in TouchableOpacity + shows chevron when tappable.
- `app/(tabs)/movements.tsx`: `selectedTx` state drives the receipt modal.
