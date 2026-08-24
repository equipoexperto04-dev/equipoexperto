import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const publicSite = (env.VITE_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')

  const chunkRecoveryScript = `
  <script>
    (function () {
      var countKey = 'mm_chunk_reload_count';
      var windowKey = 'mm_chunk_reload_at';
      var maxReloads = 2;
      var windowMs = 120000;

      function isAssetUrl(url) {
        return /\\/assets\\/[^?#]+\\.(js|css|mjs)(\\?|$)/i.test(url || '');
      }
      function isChunkLoadMessage(msg) {
        return /MIME type|module script|dynamically imported module|Loading chunk|Failed to fetch|Unexpected end of input|Invalid or unexpected token|does not provide an export named/i.test(msg || '');
      }
      function isAssetScriptError(e) {
        var fn = (e && (e.filename || (e.target && e.target.src))) || '';
        return isAssetUrl(fn);
      }
      function stripBuildParam() {
        try {
          var u = new URL(location.href);
          if (!u.searchParams.has('mm_build')) return;
          u.searchParams.delete('mm_build');
          history.replaceState(null, '', u.pathname + u.search + u.hash);
        } catch (err) { /* noop */ }
      }
      function getReloadCount() {
        var at = parseInt(sessionStorage.getItem(windowKey) || '0', 10);
        if (!at || Date.now() - at > windowMs) {
          sessionStorage.removeItem(countKey);
          sessionStorage.removeItem(windowKey);
          return 0;
        }
        return parseInt(sessionStorage.getItem(countKey) || '0', 10) || 0;
      }
      function reloadFresh() {
        var count = getReloadCount();
        if (count >= maxReloads) {
          console.warn('[Equipo Experto] Asset load recovery stopped after', count, 'attempts.');
          return;
        }
        sessionStorage.setItem(countKey, String(count + 1));
        sessionStorage.setItem(windowKey, String(Date.now()));
        try {
          var u = new URL(location.href);
          u.searchParams.set('mm_build', String(Date.now()));
          location.replace(u.pathname + u.search + u.hash);
        } catch (err) {
          location.reload();
        }
      }
      window.addEventListener('error', function (e) {
        var t = e.target;
        if (t && t.tagName === 'SCRIPT' && t.src && isAssetUrl(t.src)) {
          reloadFresh();
          return;
        }
        if (isAssetScriptError(e) && isChunkLoadMessage(e.message)) {
          reloadFresh();
        }
      }, true);
      window.addEventListener('unhandledrejection', function (e) {
        var reason = e.reason;
        var msg = reason && (reason.message || String(reason)) || '';
        if (isChunkLoadMessage(msg)) {
          reloadFresh();
          e.preventDefault();
        }
      });
      window.addEventListener('load', function () {
        stripBuildParam();
      });
      window.addEventListener('mm:app-ready', function () {
        sessionStorage.removeItem(countKey);
        sessionStorage.removeItem(windowKey);
        stripBuildParam();
      });
    })();
  </script>`

  return {
    define: {
      'import.meta.env.VITE_APP_BUILD_ID': JSON.stringify(String(Date.now())),
    },
    plugins: [
      react(),
      {
        name: 'replace-public-site-url-in-index-html',
        transformIndexHtml(html) {
          let out = html
          if (publicSite) {
            out = out.split('https://equipoexperto.com').join(publicSite)
          }
          if (mode === 'production' && !out.includes('mm_chunk_reload')) {
            out = out.replace('</head>', `${chunkRecoveryScript}</head>`)
          }
          return out
        },
      },
    ],
    build: {
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('html2pdf') || id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('@sanity')) return 'vendor-sanity';
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) return 'vendor-lucide';
          },
        },
      },
    },
  }
})
