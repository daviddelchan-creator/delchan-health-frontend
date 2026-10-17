"use client";

import Link from 'next/link';
import { LegalFooter } from '@/components/shared/LegalFooter';

export default function TermosPage() {
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
            Imprimir Documento
          </button>
        </div>

        {/* Document Content */}
        <article className="prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4">
          <h1 className="text-center mb-12">Termos de Uso e Licenciamento SaaS (SLA)</h1>

          <p className="text-sm text-gray-500 mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2>Cláusula 1 - Objeto e Isenção Clínica</h2>
            <p>
              A Delchan Health OS fornece uma plataforma SaaS baseada no padrão internacional de interoperabilidade HL7 FHIR R4.
              A Delchan atua estritamente como <strong>operadora tecnológica</strong> e não presta, sob nenhuma hipótese, serviços médicos, diagnósticos ou de saúde.
              A responsabilidade por diagnósticos, prescrições, tratamentos e a guarda do prontuário pelo prazo legal de 20 (vinte) anos, conforme estipulado pela Lei nº 13.787/2018,
              é exclusiva do profissional de saúde assistente e da clínica (registrados nos conselhos de classe competentes como CFM, COFEN, CFBM, CRO, etc.).
            </p>
          </section>

          <section>
            <h2>Cláusula 2 - Assinatura ICP-Brasil e Integrações de Terceiros</h2>
            <p>
              A plataforma oferece suporte técnico à geração de documentos com assinatura eletrônica e QR Code verificável.
              Para a emissão de documentos com validade jurídica via assinatura qualificada (ICP-Brasil), nos termos da Lei nº 14.063/2020,
              o profissional deverá vincular e utilizar seu próprio certificado digital A1 ou A3 ativo.
              A Delchan Health OS exime-se de qualquer responsabilidade decorrente de falhas, interrupções, bloqueios de contas ou instabilidades advindas de APIs
              e serviços de terceiros integrados à plataforma, incluindo, mas não se limitando a: WhatsApp/Meta, Google Calendar e gateways de pagamento/bancários.
            </p>
          </section>

          <section>
            <h2>Cláusula 3 - Nível de Serviço (SLA) e Disponibilidade</h2>
            <p>
              A Delchan Health OS compromete-se com uma meta de <strong>99,0% de uptime mensal</strong> dos serviços críticos,
              prestada em regime de melhores esforços (<em>best-effort</em>).
              Excluem-se do cálculo de indisponibilidade as manutenções preventivas ou corretivas programadas (previamente comunicadas),
              bem como falhas generalizadas em infraestruturas de provedores de nuvem externos (Cloud Providers) ou problemas de conectividade de internet do próprio Usuário/Clínica.
            </p>
          </section>

          <section>
            <h2>Cláusula 4 - Condições de Pagamento e Inadimplência (B2B)</h2>
            <p>
              O uso da plataforma é condicionado ao pagamento recorrente conforme o plano contratado.
              Em caso de inadimplência superior a <strong>5 (cinco) dias</strong> corridos do vencimento, o acesso ao ambiente do Tenant poderá ser suspenso temporariamente.
              Persistindo o atraso por <strong>30 (trinta) dias</strong>, a Delchan Health OS reserva-se o direito de excluir permanentemente o Tenant e seus dados,
              mediante notificação prévia de 7 (sete) dias para que a Clínica realize a exportação de seus dados (Backup estruturado).
            </p>
          </section>

          <section>
            <h2>Cláusula 5 - Cancelamento B2B e Fidelidade</h2>
            <p>
              Para assinaturas de planos mensais, <strong>não há prazo de fidelidade</strong>.
              O cancelamento poderá ser solicitado a qualquer momento, mediante aviso prévio formal com antecedência mínima de <strong>15 (quinze) dias</strong> antes da próxima renovação.
              Planos anuais ou com condições comerciais especiais seguirão as regras de rescisão especificadas na proposta comercial aceita no momento da contratação.
            </p>
          </section>

          <section>
            <h2>Cláusula 6 - Propriedade Intelectual</h2>
            <p>
              A plataforma, seus códigos, interfaces, arquitetura e banco de dados são de propriedade exclusiva da Delchan Health OS
              e estão protegidos pela legislação de Propriedade Intelectual e de Direitos Autorais, em especial a Lei do Software (Lei nº 9.609/1998).
              É vedada a cópia, engenharia reversa, cessão ou sublicenciamento não autorizado da plataforma a terceiros.
            </p>
          </section>

          <section>
            <h2>Cláusula 7 - Limitação de Responsabilidade Civil</h2>
            <p>
              Com fulcro na liberdade contratual (Art. 421-A do Código Civil Brasileiro),
              fica pactuado que a responsabilidade civil máxima da Delchan Health OS por quaisquer danos comprovados (diretos, indiretos, lucros cessantes ou danos morais)
              decorrentes de falhas no software ou violação deste contrato, ficará expressamente limitada, em seu valor global,
              ao montante equivalente ao total efetivamente pago pela Clínica/Contratante nos últimos <strong>3 (três) meses</strong> imediatamente anteriores à ocorrência do evento danoso.
            </p>
          </section>

          <section>
            <h2>Cláusula 8 - Foro de Eleição</h2>
            <p>
              As partes elegem o <strong>Foro Central da Comarca da Capital de São Paulo - SP</strong> para dirimir quaisquer dúvidas,
              controvérsias ou litígios oriundos do presente Termo de Uso e Licenciamento,
              com renúncia expressa a qualquer outro, por mais privilegiado que seja ou venha a ser.
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
