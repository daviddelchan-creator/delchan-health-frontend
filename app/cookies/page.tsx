"use client";

import Link from 'next/link';
import { LegalFooter } from '@/components/shared/LegalFooter';

export default function CookiesPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Header Actions (Hidden in print) */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row print:hidden">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            &larr; Voltar ao Início
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Política
          </button>
        </div>

        {/* Document Content */}
        <article className="prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4">
          <h1 className="text-center mb-12">Política de Cookies e Armazenamento Local</h1>

          <section>
            <h2>1. Utilização Técnica e Essencial</h2>
            <p>
              A Delchan Health OS utiliza mecanismos de armazenamento local no navegador do usuário exclusivamente para fins técnicos operacionais essenciais, garantindo a segurança de autenticação e a disponibilidade em modo offline da aplicação (arquitetura PWA).
              <strong>Não utilizamos cookies para rastreamento de publicidade de terceiros, remarketing ou venda de perfilamento.</strong>
            </p>
          </section>

          <section>
            <h2>2. Tecnologias de Armazenamento Empregadas</h2>
            <p>
              Nossa infraestrutura tecnológica faz uso estrito das seguintes APIs web:
            </p>
            <ul>
              <li>
                <strong>Armazenamento Local (localStorage) e Sessão (sessionStorage):</strong>
                Utilizados para manter tokens de segurança temporários, identificadores criptográficos de sessão (como as sessões gerenciadas pelo Medplum) e parâmetros do banner de consentimento (ex: <code>delchan_cookie_consent</code>).
              </li>
              <li>
                <strong>IndexedDB (Modo Offline PWA e Android):</strong>
                Banco de dados no lado do cliente utilizado de forma crítica para fazer o cache seguro de dados do prontuário, permitindo que profissionais em áreas remotas ou com conectividade instável possam continuar atendendo. Estes dados são sincronizados com o servidor de forma criptografada assim que a conexão é restabelecida.
              </li>
              <li>
                <strong>Tokens JWT e OAuth2 (Infraestrutura Medplum):</strong>
                Para garantir a identidade de quem acessa as APIs HL7 FHIR, armazenamos tokens JWT em memória e, temporariamente, nos mecanismos de storage supracitados, sob estrita política de expiração.
              </li>
              <li>
                <strong>Cache de Preferências White-Label (Multi-Tenant):</strong>
                Identificadores como o subdomínio ou tenant-id são armazenados para garantir que a interface seja corretamente adaptada às cores (ex: <code>tenantConfig.internalColor</code>) e logotipos específicos da Clínica contratante antes mesmo do total carregamento da página.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Gerenciamento e Revogação</h2>
            <p>
              Por tratarem-se de tecnologias estritamente necessárias para o provimento do software como serviço (SaaS) na área de saúde (autenticação e segurança), não é possível utilizar a plataforma Delchan Health OS desabilitando estas funções essenciais.
              Ao utilizar a plataforma, a Clínica e o Profissional concordam com a persistência técnica temporária de dados locais conforme descrito. O encerramento da sessão ou deslogar (logout) remove ativamente os tokens primários de acesso do navegador.
            </p>
          </section>

        </article>
      </div>

      <div className="print:hidden">
        <LegalFooter />
      </div>
    </div>
  );
}
