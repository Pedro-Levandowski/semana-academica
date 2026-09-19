import { M2IntegrationPort } from '../integrations/m2-port.js';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { CertificateRepository } from '../repositories/certificate-repository.js';
import { calcularAproveitadoMinutos, somarCargasBrutas } from './horas-complementares.js';

export interface ExtratoItem {
  atividadeId: string;
  titulo: string;
  tipo: 'palestra' | 'minicurso';
  cargaHorariaMinutos: number;
  codigo: string | null;
}

export interface Extrato {
  itens: ExtratoItem[];
  palestrasMinutos: number;
  minicursosMinutos: number;
  totalMinutos: number;
  aproveitadoMinutos: number;
}

export class ConsultarExtrato {
  constructor(
    private readonly m2Port: M2IntegrationPort,
    private readonly activityRepository: ActivityRepository,
    private readonly certificateRepository: CertificateRepository
  ) {}

  execute(participanteId: string): Extrato {
    const inscricoes = this.m2Port.listarInscricoesDoParticipante?.(participanteId) ?? [];
    const itens: ExtratoItem[] = [];

    for (const inscricao of inscricoes) {
      if (inscricao.status !== 'confirmada') {
        continue;
      }
      const atividade = this.activityRepository.findById(inscricao.atividadeId);
      if (!atividade || atividade.cancelada === 1) {
        continue;
      }
      const certificado = this.certificateRepository.findByAtividadeEParticipante(atividade.id, participanteId);
      itens.push({
        atividadeId: atividade.id,
        titulo: atividade.titulo,
        tipo: atividade.tipo as 'palestra' | 'minicurso',
        cargaHorariaMinutos: atividade.cargaHorariaMinutos,
        codigo: certificado ? certificado.codigo : null
      });
    }

    const { palestrasMinutos, minicursosMinutos, totalMinutos } = somarCargasBrutas(itens);
    return {
      itens,
      palestrasMinutos,
      minicursosMinutos,
      totalMinutos,
      aproveitadoMinutos: calcularAproveitadoMinutos(palestrasMinutos, minicursosMinutos)
    };
  }
}