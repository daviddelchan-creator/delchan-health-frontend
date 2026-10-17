import Link from 'next/link';

export function LegalFooter() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <Link href="/termos" className="hover:text-gray-900 hover:underline">
              Termos de Uso e SLA
            </Link>
            <Link href="/dpa-lgpd" className="hover:text-gray-900 hover:underline">
              DPA (LGPD)
            </Link>
            <Link href="/privacidade" className="hover:text-gray-900 hover:underline">
              Política de Privacidade
            </Link>
            <Link href="/cookies" className="hover:text-gray-900 hover:underline">
              Política de Cookies
            </Link>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold text-blue-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Compatível com LGPD & HL7 FHIR R4</span>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          &copy; 2026 Delchan Health OS - Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
