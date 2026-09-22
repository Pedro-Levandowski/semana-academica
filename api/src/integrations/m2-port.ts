import { InscricaoRepository } from '../repositories/inscricao-repository.js';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { Clock } from '../clock/clock.js';
import { processExpirationsAndConvocations } from '../domain/inscricao-service.js';

export interface InscricaoDoParticipante {
  atividadeId: string;
  status: 'confirmada' | 'em_espera' | 'convocada' | 'cancelada' | 'expirada';
}

export interface M2IntegrationPort {
  getOcupadas(atividadeId: string): number;
  getEmEspera(atividadeId: string): number;
  convocarEspera(atividadeId: string): void;
  cancelarInscricoes(atividadeId: string): void;
  listarInscricoesDoParticipante?(participanteId: string): InscricaoDoParticipante[];
}

export class NeutralM2Adapter implements M2IntegrationPort {
  getOcupadas(_atividadeId: string): number {
    return 0;
  }

  getEmEspera(_atividadeId: string): number {
    return 0;
  }

  convocarEspera(_atividadeId: string): void {
    // no-op
  }

  cancelarInscricoes(_atividadeId: string): void {
    // no-op
  }

  listarInscricoesDoParticipante(_participanteId: string): InscricaoDoParticipante[] {
    return [];
  }
}

export class SQLiteM2Adapter implements M2IntegrationPort {
  constructor(
    private inscricaoRepository: InscricaoRepository,
    private activityRepository?: ActivityRepository,
    private clock?: Clock
  ) {}

  getOcupadas(atividadeId: string): number {
    if (this.activityRepository && this.clock) {
      processExpirationsAndConvocations(this.activityRepository, this.inscricaoRepository, this.clock.now(), atividadeId);
    }
    return this.inscricaoRepository.countOccupied(atividadeId);
  }

  getEmEspera(atividadeId: string): number {
    if (this.activityRepository && this.clock) {
      processExpirationsAndConvocations(this.activityRepository, this.inscricaoRepository, this.clock.now(), atividadeId);
    }
    return this.inscricaoRepository.countInWaitlist(atividadeId);
  }

  convocarEspera(atividadeId: string): void {
    if (this.activityRepository && this.clock) {
      processExpirationsAndConvocations(this.activityRepository, this.inscricaoRepository, this.clock.now(), atividadeId);
    }
  }

  cancelarInscricoes(atividadeId: string): void {
    this.inscricaoRepository.cancelActiveInscricoesForActivity(atividadeId);
  }

  listarInscricoesDoParticipante(participanteId: string): InscricaoDoParticipante[] {
    if (this.activityRepository && this.clock) {
      processExpirationsAndConvocations(this.activityRepository, this.inscricaoRepository, this.clock.now());
    }
    const inscricoes = this.inscricaoRepository.findByParticipant(participanteId);
    const atividadeIds = Array.from(new Set(inscricoes.map((i) => i.atividadeId)));
    const resultado: InscricaoDoParticipante[] = [];
    for (const atividadeId of atividadeIds) {
      const atual = this.inscricaoRepository.findByActivityAndParticipant(atividadeId, participanteId);
      if (atual) {
        resultado.push({ atividadeId, status: atual.status });
      }
    }
    return resultado;
  }
}
