import { InscricaoRepository } from '../repositories/inscricao-repository.js';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { Clock } from '../clock/clock.js';
import { processExpirationsAndConvocations } from '../domain/inscricao-service.js';

export interface M2IntegrationPort {
  getOcupadas(atividadeId: string): number;
  getEmEspera(atividadeId: string): number;
  convocarEspera(atividadeId: string): void;
  cancelarInscricoes(atividadeId: string): void;
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

  cancelarInscricoes(_atividadeId: string): void {
    // no-op
  }
}
