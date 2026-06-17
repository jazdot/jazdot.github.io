/// <reference types="vite-plugin-pwa/client" />
// @ts-ignore - Ignores TS error if vite-env.d.ts doesn't explicitly declare the virtual module
import { useRegisterSW } from 'virtual:pwa-register/react';
import { m, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export default function PWAReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        // Periodically check for updates every hour
        setInterval(async () => {
          if (r.installing || !navigator) return;
          if (('connection' in navigator) && !navigator.onLine) return;
          try {
            // Force fetch bypassing cache
            const resp = await fetch(swUrl, { cache: 'no-store', headers: { cache: 'no-store', 'cache-control': 'no-cache' } });
            if (resp?.status === 200) await r.update();
          } catch (err) {
            // Ignore offline network errors
          }
        }, 60 * 60 * 1000);
      }
    }
  });

  // Proactively check for updates when the user returns to the tab
  useEffect(() => {
    const handleFocus = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration) await registration.update();
        } catch (err) {}
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <AnimatePresence>
      {needRefresh && (
        <m.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm z-[10000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 md:p-5 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 flex flex-col gap-3 md:gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 21v-5h5"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Update Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">A new version of this portfolio is ready.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:scale-105 active:scale-95 transition-transform"
            >
              Reload & Update
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="flex-1 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}