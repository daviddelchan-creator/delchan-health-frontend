"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('delchan_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('delchan_cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-gray-600">
          Utilizamos cookies essenciais e tecnologias semelhantes para garantir o funcionamento seguro e offline (PWA) da plataforma, além de gerenciar autenticação e preferências.
          Ao continuar navegando, você concorda com a nossa{' '}
          <Link href="/cookies" className="font-semibold text-blue-600 hover:underline">
            Política de Cookies
          </Link>.
        </p>
        <button
          onClick={handleAccept}
          className="whitespace-nowrap rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Aceitar e Continuar
        </button>
      </div>
    </div>
  );
}
