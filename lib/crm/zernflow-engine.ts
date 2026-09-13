/**
 * ZernFlow Engine - Motor de Nodos Condicionales y Enrutamiento Omnicanal
 * 
 * Basado en la arquitectura visual de ZernFlow (https://github.com/zernio-dev/zernflow):
 * - Trigger Nodes (Webhook Inbound / Comment-to-DM)
 * - Condition Nodes (If/Else: Urgencia Médica, Intención de Cita, Solicitud de Humano)
 * - Action Nodes (Envío de DM, Creación FHIR, Envío de Link de Anamnesis)
 * - Handoff Nodes (Transferencia a Bandeja Unificada con Notificación al Personal)
 */

import { ExtractedLeadIntent, AntigravityContext } from './antigravity-agent';

export type ZernNodeType = 'TRIGGER' | 'CONDITION_IF_ELSE' | 'ACTION_DM' | 'ACTION_FHIR' | 'HANDOFF_HUMAN' | 'INTAKE_LINK';

export interface ZernNodeExecution {
  nodeId: string;
  nodeType: ZernNodeType;
  title: string;
  evaluatedCondition?: string;
  result: boolean | string;
  timestamp: string;
}

export interface ZernFlowResult {
  flowId: string;
  executionPath: ZernNodeExecution[];
  requiresHumanHandoff: boolean;
  handoffReason?: string;
  nextStep: 'SEND_DM' | 'TRANSFER_TO_HUMAN' | 'SEND_INTAKE_LINK' | 'WAIT_USER';
  finalMessage: string;
  alertNotification?: {
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'urgent';
    targetTeam: string;
  };
}

/**
 * Validador de Nodos Condicionales ZernFlow
 */
export function executeZernFlowPipeline(
  messageText: string,
  intent: ExtractedLeadIntent,
  context: AntigravityContext,
  intakeUrl?: string
): ZernFlowResult {
  const executionPath: ZernNodeExecution[] = [];
  const lower = messageText.toLowerCase();
  const now = new Date().toISOString();

  // 1. NODO TRIGGER: Recepción del evento omnicanal
  executionPath.push({
    nodeId: 'node_trigger_01',
    nodeType: 'TRIGGER',
    title: `Trigger Omnicanal: ${context.channel.toUpperCase()}`,
    result: true,
    timestamp: now
  });

  // 2. NODO CONDICIONAL 1: ¿Solicitó explícitamente hablar con un humano o el bot se detuvo?
  const humanKeywords = ['atendente', 'falar com humano', 'falar com atendente', 'pessoa', 'humano', 'recepcao', 'recepção', 'secretaria', 'secretária'];
  const wantsHuman = humanKeywords.some(kw => lower.includes(kw));

  executionPath.push({
    nodeId: 'node_cond_human_02',
    nodeType: 'CONDITION_IF_ELSE',
    title: 'Condicional: Solicitud de Agente Humano',
    evaluatedCondition: 'Contém palavras-chave de transferência humana',
    result: wantsHuman,
    timestamp: now
  });

  if (wantsHuman) {
    executionPath.push({
      nodeId: 'node_handoff_03',
      nodeType: 'HANDOFF_HUMAN',
      title: 'Handoff: Transferência para Inbox Unificada',
      result: 'Transferido para Equipe da Recepção',
      timestamp: now
    });

    return {
      flowId: `zern-${Date.now()}`,
      executionPath,
      requiresHumanHandoff: true,
      handoffReason: 'Solicitação direta do paciente por atendimento humano',
      nextStep: 'TRANSFER_TO_HUMAN',
      finalMessage: 'Com certeza! Já transferi seu chat para nossa equipe humana da clínica. Um de nossos atendentes irá responder aqui em instantes.',
      alertNotification: {
        title: `💬 Transferência Solicitada: ${intent.patientName || 'Lead'}`,
        description: `Paciente solicitou atendimento humano via ${context.channel}. Mensagem: "${messageText}"`,
        severity: 'warning',
        targetTeam: 'Recepção / Atendimento'
      }
    };
  }

  // 3. NODO CONDICIONAL 2: ¿Detección de Riesgo Clínico o Urgencia (Red Flag)?
  const isEmergency = intent.urgencyLevel === 'emergency' || intent.intentType === 'emergency_urgent';

  executionPath.push({
    nodeId: 'node_cond_emergency_04',
    nodeType: 'CONDITION_IF_ELSE',
    title: 'Condicional: Triagem de Risco Clínico / Alerta',
    evaluatedCondition: 'Classificação de Urgência pelo Antigravity Agent',
    result: isEmergency,
    timestamp: now
  });

  if (isEmergency) {
    executionPath.push({
      nodeId: 'node_handoff_urgent_05',
      nodeType: 'HANDOFF_HUMAN',
      title: 'Escalada Médica Crítica Imediata',
      result: 'Notificação Prioritária para Corpo Clínico',
      timestamp: now
    });

    return {
      flowId: `zern-${Date.now()}`,
      executionPath,
      requiresHumanHandoff: true,
      handoffReason: 'Sintomas ou queixas de risco clínico detectados na conversa',
      nextStep: 'TRANSFER_TO_HUMAN',
      finalMessage: intent.suggestedDmReply,
      alertNotification: {
        title: `🚨 URGÊNCIA CLÍNICA NO CRM: ${intent.patientName || 'Paciente'}`,
        description: `Sintomas com alerta vermelho detectados no canal ${context.channel}: "${messageText}". Atendimento médico imediato requerido.`,
        severity: 'urgent',
        targetTeam: 'Corpo Clínico / Plantão'
      }
    };
  }

  // 4. NODO CONDICIONAL 3: ¿Lead calificado para agendamiento / pre-atendimiento?
  const isQualified = Boolean(intent.patientName && (intent.phone || context.senderPhone));

  executionPath.push({
    nodeId: 'node_cond_qualified_06',
    nodeType: 'CONDITION_IF_ELSE',
    title: 'Condicional: Lead Qualificado com Dados de Contato',
    evaluatedCondition: 'Possui Nome e Telefone identificados',
    result: isQualified,
    timestamp: now
  });

  // Si está calificado y tenemos URL de ficha de anamnesis previa y consentimiento
  if (isQualified && intakeUrl) {
    executionPath.push({
      nodeId: 'node_intake_link_07',
      nodeType: 'INTAKE_LINK',
      title: 'Ação: Geração e Envio de Link de Pré-Anamnese & Consentimento',
      result: intakeUrl,
      timestamp: now
    });

    const concatenatedMsg = `${intent.suggestedDmReply}\n\n📋 Para agilizar seu prontuário e garantir seu atendimento personalizado, por favor preencha sua ficha rápida de pré-atendimento e termo de privacidade:\n🔗 ${intakeUrl}`;

    return {
      flowId: `zern-${Date.now()}`,
      executionPath,
      requiresHumanHandoff: false,
      nextStep: 'SEND_INTAKE_LINK',
      finalMessage: concatenatedMsg
    };
  }

  // 5. NODO DEFAULT: Respuesta Automática Informativa de DM
  executionPath.push({
    nodeId: 'node_action_dm_08',
    nodeType: 'ACTION_DM',
    title: 'Ação: Resposta Automática DM (IA Antigravity)',
    result: 'Mensagem DM enviada ao usuário',
    timestamp: now
  });

  return {
    flowId: `zern-${Date.now()}`,
    executionPath,
    requiresHumanHandoff: false,
    nextStep: 'SEND_DM',
    finalMessage: intent.suggestedDmReply
  };
}
