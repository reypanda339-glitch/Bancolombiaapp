import { ScrollViewStyleReset } from "expo-router/html";
import React from "react";

const PWA_CSS = `
  * {
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  *::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
  * {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  html {
    height: 100%;
  }
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    overscroll-behavior: none;
    overscroll-behavior-y: none;
    -webkit-overflow-scrolling: touch;
    -webkit-user-select: none;
    user-select: none;
    background-color: #0F0F0F;
  }
  input, textarea, select {
    font-size: 16px !important;
    -webkit-appearance: none;
    appearance: none;
    border-radius: 0;
    -webkit-user-select: text;
    user-select: text;
  }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }
  ::selection {
    background: rgba(253, 218, 36, 0.25);
  }
`;

const PWA_INSTALL_SCRIPT = `
(function () {
  // Capture beforeinstallprompt as early as possible — before React mounts.
  // Stored on window so any component can access it after hydration.
  window.__pwaInstallPrompt = null;
  window.__pwaInstalled = false;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    window.__pwaInstallPrompt = e;
    // Notify any listeners that may have registered after this event fired.
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', function () {
    window.__pwaInstallPrompt = null;
    window.__pwaInstalled = true;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
})();
`;

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0F0F0F" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" type="image/png" href="/assets/assets/images/pwa-icon.png" />
        <link rel="apple-touch-icon" href="/assets/assets/images/pwa-icon.png" />
        <title>Mi Bancolombia</title>
        {/* Capture PWA install prompt before React boots */}
        <script dangerouslySetInnerHTML={{ __html: PWA_INSTALL_SCRIPT }} />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: PWA_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
