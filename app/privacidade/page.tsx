"use client";

import Link from 'next/link';
import { LegalFooter } from '@/components/shared/LegalFooter';

export default function PrivacidadePage() {
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
          <h1 className="text-center mb-12">Política de Privacidade</h1>

          <section>
            <h2>1. Distinção no Tratamento de Dados (B2B x B2B2C)</h2>
            <p>A Delchan Health OS faz uma distinção técnica e jurídica fundamental em suas operações de tratamento de dados:</p>
            <ul>
              <li>
                <strong>Dados Cadastrais e Financeiros dos Clientes Diretos (Clínicas e Médicos - B2B):</strong> A Delchan atua como <strong>Controladora</strong> no que tange aos dados de faturamento, contato, e-mail corporativo e dados de pagamento da Clínica assinante do software, tratando-os para finalidades de execução de contrato e cobrança.
              </li>
              <li>
                <strong>Dados Clínicos Sensíveis de Pacientes (B2B2C):</strong> A Delchan atua estritamente como <strong>Operadora</strong>, conforme detalhado no Acordo DPA-LGPD. A finalidade do tratamento desses dados é ditada exclusivamente pela Clínica e pelo Profissional de Saúde assistente.
              </li>
            </ul>
          </section>

          <section>
            <h2>2. Declaração Obrigatória de Uso Restrito (Google API Services User Data Policy)</h2>
            <p>
              A Delchan Health OS integra funcionalidades de calendário com as APIs do Google Workspace. O uso e a transferência para qualquer outro aplicativo de informações recebidas das APIs do Google aderirão integralmente à <strong>Google API Services User Data Policy</strong>, incluindo os requisitos de <em>Limited Use</em> (Uso Restrito).
            </p>
            <p>
              Garantimos aos nossos usuários que o acesso via <em>Google Calendar API</em> destina-se exclusivamente à leitura e gravação de <strong>metadados de horários de consultas e agendamentos</strong> operados pelo profissional de saúde.
              Nenhum dado sensível de saúde transacionado via FHIR em nossos servidores é enviado para treinamento de IA de terceiros ou utilizado de qualquer forma para propósitos de marketing, publicidade ou remarketing pelo Google ou por nós.
            </p>
          </section>

          <section>
            <h2>3. Contato e Encarregado de Proteção de Dados (DPO)</h2>
            <p>
              Em cumprimento ao Artigo 41 da Lei Geral de Proteção de Dados (Lei 13.709/2018), disponibilizamos os dados de contato do nosso Encarregado de Tratamento de Dados Pessoais (DPO), que atua como canal de comunicação entre a Delchan Health OS, os Titulares dos Dados e a Autoridade Nacional de Proteção de Dados (ANPD):
            </p>
            <ul>
              <li><strong>Nome / Entidade do DPO:</strong> [Nome do DPO ou Comitê de Privacidade Delchan]</li>
              <li><strong>E-mail de Contato Exclusivo:</strong> privacidade@delchan.com</li>
              <li><strong>Sede / Foro da Operação:</strong> São Paulo, SP - Brasil</li>
            </ul>
            <p>
              *Pedidos de exclusão de prontuários (direito ao esquecimento) realizados por pacientes deverão ser direcionados primeiramente à Clínica (Controladora), uma vez que o médico possui dever legal de guarda da documentação (20 anos). A Delchan não exclui prontuários diretamente a pedido do paciente sem ordem do Controlador ou ordem judicial.
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
