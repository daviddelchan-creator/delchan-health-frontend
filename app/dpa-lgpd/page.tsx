"use client";

import Link from 'next/link';
import { LegalFooter } from '@/components/shared/LegalFooter';

export default function DpaPage() {
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
            Imprimir DPA
          </button>
        </div>

        {/* Document Content */}
        <article className="prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4">
          <h1 className="text-center mb-12">Acordo de Processamento de Dados Pessoais (DPA - LGPD)</h1>

          <p className="text-sm text-gray-500 mb-8">
            Documento Complementar aos Termos de Uso (Data Processing Agreement) conforme Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>

          <section>
            <h2>1. Definição de Papéis (Art. 5º da LGPD)</h2>
            <p>
              Em estrita conformidade com o Artigo 5º da Lei Geral de Proteção de Dados (LGPD):
            </p>
            <ul>
              <li>
                <strong>Controladora de Dados:</strong> A Clínica, Consultório ou Profissional de Saúde assinante é, para todos os efeitos jurídicos, a Controladora primária e detentora do consentimento ou base legal adequada para o tratamento dos dados sensíveis de saúde de seus pacientes (Art. 11 da LGPD).
              </li>
              <li>
                <strong>Operadora Tecnológica:</strong> A Delchan Health OS atua exclusivamente como Operadora, processando os dados de pacientes única e estritamente sob as diretrizes, comandos no sistema e propósitos definidos pela Controladora (Clínica/Médico). A Delchan não toma decisões sobre a finalidade ou destinação dos dados clínicos de pacientes.
              </li>
            </ul>
          </section>

          <section>
            <h2>2. Medidas Técnicas e Administrativas de Segurança (Art. 46)</h2>
            <p>
              A Operadora compromete-se a implementar e manter os mais altos padrões de segurança da informação (Art. 46 da LGPD), incluindo:
            </p>
            <ul>
              <li><strong>Isolamento Multi-Tenant:</strong> Separação lógica estrita dos dados de diferentes Controladoras (Clínicas).</li>
              <li><strong>Criptografia:</strong> Proteção de dados em trânsito (TLS 1.3) e em repouso nos bancos de dados gerenciados.</li>
              <li><strong>Sanitização de Dados:</strong> Aplicação contínua de medidas contra ataques de injeção de código (XSS) através de bibliotecas como DOMPurify no componente <code>ProntuarioPrintView</code>.</li>
              <li><strong>Segurança de Anexos:</strong> Validação server-side de integridade (<em>magic bytes</em>) para upload de documentos e exames binários, prevenindo malwares.</li>
              <li><strong>Rastreabilidade de Acesso (Auditoria):</strong> Geração nativa de logs inalteráveis no padrão <code>AuditEvent</code> do protocolo HL7 FHIR para rastreamento de leitura e modificação de prontuários.</li>
            </ul>
          </section>

          <section>
            <h2>3. Exclusão de Responsabilidade Solidária (Art. 43)</h2>
            <p>
              Conforme as disposições de exclusão de responsabilidade da LGPD (Art. 43, III), a Delchan Health OS não será responsabilizada civil ou administrativamente por incidentes de segurança, vazamentos ou violações decorrentes de ações ou omissões exclusivas da Controladora (Clínica) ou de seus funcionários, tais como:
            </p>
            <ul>
              <li>Compartilhamento indevido, perda ou reutilização de senhas e credenciais de acesso corporativas por membros da equipe da Clínica.</li>
              <li>Envio humano equivocado de mensagens, resultados ou prontuários a destinatários incorretos através do módulo CRM/WhatsApp.</li>
              <li>Acesso não autorizado em dispositivos destravados (terminais físicos) presentes no interior da clínica sob guarda da Controladora.</li>
            </ul>
          </section>

        </article>
      </div>

      <div className="print:hidden">
        <LegalFooter />
      </div>
    </div>
  );
}
