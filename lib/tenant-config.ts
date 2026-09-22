export interface TenantVertical {
  id: 'clinica' | 'pet' | 'salao' | 'unhas' | 'bemestar' | 'spa';
  labels: {
    paciente: string;
    prontuario: string;
    evolucao: string;
    medico: string;
    receituario: string;
    consultorio: string;
  };
  templates: {
    ficha_admissao: string;
    relatorio: string;
  };
}

export const VERTICAL_CONFIGS: Record<string, TenantVertical> = {
  clinica: {
    id: 'clinica',
    labels: { paciente: 'Paciente', prontuario: 'Prontuário', evolucao: 'Evolução Clínica', medico: 'Médico', receituario: 'Receituário', consultorio: 'Consultório' },
    templates: { ficha_admissao: 'Ficha de Admissão Integral', relatorio: 'Relatório Médico' }
  },
  pet: {
    id: 'pet',
    labels: { paciente: 'Pet', prontuario: 'Ficha Veterinária', evolucao: 'Evolução', medico: 'Veterinário', receituario: 'Prescrição', consultorio: 'Consultório' },
    templates: { ficha_admissao: 'Ficha de Admissão Pet', relatorio: 'Relatório Veterinário' }
  },
  salao: {
    id: 'salao',
    labels: { paciente: 'Cliente', prontuario: 'Ficha de Cliente', evolucao: 'Histórico', medico: 'Profissional', receituario: 'Recomendação', consultorio: 'Cadeira' },
    templates: { ficha_admissao: 'Ficha de Admissão Cliente', relatorio: 'Relatório de Atendimento' }
  },
  unhas: {
    id: 'unhas',
    labels: { paciente: 'Cliente', prontuario: 'Ficha de Cliente', evolucao: 'Histórico', medico: 'Manicure', receituario: 'Recomendação', consultorio: 'Mesa' },
    templates: { ficha_admissao: 'Ficha de Admissão Cliente', relatorio: 'Relatório de Atendimento' }
  },
  bemestar: {
    id: 'bemestar',
    labels: { paciente: 'Cliente', prontuario: 'Ficha de Acompanhamento', evolucao: 'Evolução', medico: 'Terapeuta', receituario: 'Plano de Cuidados', consultorio: 'Sala' },
    templates: { ficha_admissao: 'Ficha de Bem-Estar', relatorio: 'Relatório Terapêutico' }
  },
  spa: {
    id: 'spa',
    labels: { paciente: 'Hóspede', prontuario: 'Ficha de Tratamento', evolucao: 'Histórico', medico: 'Especialista', receituario: 'Recomendação', consultorio: 'Cabine' },
    templates: { ficha_admissao: 'Ficha de Entrada SPA', relatorio: 'Relatório de Sessão' }
  }
};
