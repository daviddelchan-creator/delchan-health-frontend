"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  IconStethoscope,
  IconRobot,
  IconDeviceMobile,
  IconColorSwatch,
  IconCheck,
  IconArrowRight
} from '@tabler/icons-react';

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const togglePricing = () => setIsAnnual(!isAnnual);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-teal-600 text-white p-2 rounded-lg font-bold text-xl leading-none">
                  DH
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Delchan Health OS
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#funcionalidades" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Funcionalidades</a>
              <a href="#seguranca" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Segurança & FHIR</a>
              <a href="#planos" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">Planos e Preços</a>
              <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">FAQ</a>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-teal-600 transition-colors">
                Entrar no Sistema
              </Link>
              <a href="#planos" className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold py-2.5 px-4 rounded-full transition-all shadow-sm shadow-teal-600/20">
                Começar Teste Grátis
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 shadow-lg absolute w-full">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#funcionalidades" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50 rounded-md">Funcionalidades</a>
              <a href="#seguranca" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50 rounded-md">Segurança & FHIR</a>
              <a href="#planos" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50 rounded-md">Planos e Preços</a>
              <a href="#faq" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50 rounded-md">FAQ</a>
              <Link href="/login" className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50 rounded-md">
                Entrar no Sistema
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/80 to-slate-50/90 backdrop-blur-[2px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-teal-100 text-teal-800 text-sm font-semibold mb-6 border border-teal-200">
            A Nova Geração de Software Médico no Brasil
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-tight">
            O Sistema Operacional Clínico em <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">Padrão Internacional HL7 FHIR R4</span>
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Muito mais que um Prontuário Eletrônico. Integramos CRM Omnichannel com IA, Assinatura Digital ICP-Brasil e um Portal do Paciente nativo com Android Health Connect.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#planos" className="bg-teal-600 hover:bg-teal-700 text-white text-lg font-bold py-4 px-8 rounded-full transition-all shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2">
              Começar Teste Grátis <IconArrowRight size={20} />
            </a>
            <Link href="/login" className="bg-white hover:bg-slate-50 text-slate-800 text-lg font-bold py-4 px-8 rounded-full border border-slate-200 transition-all shadow-sm flex items-center justify-center">
              Entrar no Sistema
            </Link>
          </div>

          <div className="mt-16 flex justify-center items-center gap-8 opacity-70 grayscale">
            {/* Logos de tecnologias suportadas/integrações (simuladas) */}
            <div className="text-sm font-bold text-slate-500 flex items-center gap-2"><IconCheck size={18}/> HL7 FHIR</div>
            <div className="text-sm font-bold text-slate-500 flex items-center gap-2"><IconCheck size={18}/> ICP-Brasil</div>
            <div className="text-sm font-bold text-slate-500 flex items-center gap-2"><IconCheck size={18}/> LGPD</div>
            <div className="text-sm font-bold text-slate-500 flex items-center gap-2 hidden sm:flex"><IconCheck size={18}/> Health Connect</div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Módulos do Sistema</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Uma plataforma unificada projetada para otimizar desde a captação do paciente até o acompanhamento pós-consulta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:border-teal-200 transition-all group">
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <IconStethoscope size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Prontuário Eletrônico FHIR & Evolução SOAP</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Registro clínico estruturado nos padrões internacionais. Inclui receituário inteligente com geração de QR Code antifraude e assinatura digital ICP-Brasil integrada.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all group">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <IconRobot size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">CRM Médico Omnichannel & Agente IA</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Automatize a captação de pacientes. Envie links de pré-anamnese por WhatsApp antes da consulta e gerencie o funil de atendimento com assistência de inteligência artificial.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:border-purple-200 transition-all group">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <IconDeviceMobile size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Portal do Paciente UI 2.4.2 & App Mobile</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Ofereça uma experiência premium. Seus pacientes acessam resultados, agendamentos e documentos em um portal moderno, com integração ao Google Health Connect e OCR de exames.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:border-orange-200 transition-all group">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <IconColorSwatch size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Multi-Tenant White-Label</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Sua marca em evidência. Personalize o portal com o logo e as cores da sua clínica. A arquitetura multi-tenant garante isolamento total e segurança absoluta dos dados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos e Preços</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Escolha o plano ideal para o tamanho da sua operação clínica.
            </p>
            
            {/* Toggle Monthly/Annual */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Mensal</span>
              <button
                onClick={togglePricing}
                className="relative inline-flex h-7 w-14 items-center rounded-full bg-teal-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
                Anual <span className="text-teal-400 text-xs ml-1 bg-teal-400/10 px-2 py-0.5 rounded-full">-20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Starter Plan */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Plano Starter</h3>
                <p className="text-slate-400 text-sm">Consultório Individual</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">R$ {isAnnual ? '77' : '97'}</span>
                <span className="text-slate-400">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>1 profissional</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Prontuário FHIR & Evolução SOAP</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Receituário com QR Code</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Agenda básica</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Até 500 pacientes ativos</span>
                </li>
              </ul>
              <Link
                href={`/cadastro?plan=starter&billing=${isAnnual ? 'annual' : 'monthly'}`}
                className="w-full py-3 px-4 rounded-xl text-center font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Escolher Plano Starter
              </Link>
            </div>

            {/* Pro Plan - Highlighted */}
            <div className="bg-gradient-to-b from-teal-900 to-teal-800 rounded-3xl p-8 border-2 border-teal-500 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-teal-900/50">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                Mais Popular
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Plano Clínica Pro</h3>
                <p className="text-teal-200 text-sm">Pequenas e médias clínicas</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">R$ {isAnnual ? '157' : '197'}</span>
                <span className="text-teal-200">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-white">
                  <IconCheck size={20} className="text-teal-300 shrink-0 mt-0.5" />
                  <span className="font-medium">Até 5 profissionais</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <IconCheck size={20} className="text-teal-300 shrink-0 mt-0.5" />
                  <span>Tudo do plano Starter</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <IconCheck size={20} className="text-teal-300 shrink-0 mt-0.5" />
                  <span>CRM Omnichannel WhatsApp</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <IconCheck size={20} className="text-teal-300 shrink-0 mt-0.5" />
                  <span>Link de Pré-Anamnese dinâmico</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <IconCheck size={20} className="text-teal-300 shrink-0 mt-0.5" />
                  <span>Sincronização Google Calendar</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <IconCheck size={20} className="text-teal-300 shrink-0 mt-0.5" />
                  <span>Portal do Paciente Completo</span>
                </li>
              </ul>
              <Link
                href={`/cadastro?plan=pro&billing=${isAnnual ? 'annual' : 'monthly'}`}
                className="w-full py-3 px-4 rounded-xl text-center font-bold bg-teal-500 hover:bg-teal-400 text-slate-900 transition-colors shadow-lg"
              >
                Testar 7 Dias Grátis no Pro
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Plano Enterprise</h3>
                <p className="text-slate-400 text-sm">Redes de clínicas e hospitais</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-white">R$ {isAnnual ? '317' : '397'}</span>
                <span className="text-slate-400">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Profissionais ilimitados</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Personalização Total White-Label (Logo/Cores)</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>OCR Inteligente de Documentos</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Controle de Acesso Avançado (RBAC)</span>
                </li>
                <li className="flex items-start gap-3 text-slate-300">
                  <IconCheck size={20} className="text-teal-500 shrink-0 mt-0.5" />
                  <span>Suporte Dedicado Prioritário</span>
                </li>
              </ul>
              <Link
                href={`/cadastro?plan=enterprise&billing=${isAnnual ? 'annual' : 'monthly'}`}
                className="w-full py-3 px-4 rounded-xl text-center font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Escolher Enterprise
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-teal-700 text-white p-1.5 rounded font-bold text-sm leading-none">DH</div>
            <span className="font-bold text-slate-200">Delchan Health OS</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link href="/dpa-lgpd" className="hover:text-white transition-colors">DPA & LGPD</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Política de Cookies</Link>
          </div>

          <div className="text-sm">
            &copy; {new Date().getFullYear()} Delchan Health OS. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
