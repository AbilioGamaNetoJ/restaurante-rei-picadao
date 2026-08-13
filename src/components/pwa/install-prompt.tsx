'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa_install_dismiss_count';
const MAX_DISMISSES = 3;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(standalone);

    if (standalone) return;

    // Check dismiss count
    const dismissCount = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (dismissCount >= MAX_DISMISSES) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so user has time to see the page first
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] App installed');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    const current = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    localStorage.setItem(DISMISS_KEY, String(current + 1));
    setIsVisible(false);
  };

  if (isStandalone || !isVisible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 p-5 relative overflow-hidden">
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-red-50 p-3 rounded-2xl">
            <Smartphone className="h-7 w-7 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-gray-900 text-base tracking-tight">
              Instale nosso app! 🚀
            </h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Acesse mais rápido direto da tela inicial do seu dispositivo.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-4 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Agora não
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-200 hover:shadow-red-300 flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Instalar
          </button>
        </div>
      </div>
    </div>
  );
}
