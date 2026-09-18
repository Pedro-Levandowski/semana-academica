import { InscricaoRepository } from '../repositories/inscricao-repository.js';

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
  constructor(private inscricaoRepository: InscricaoRepository) {}

  getOcupadas(atividadeId: string): number {
    return this.inscricaoRepository.countOccupied(atividadeId);
  }

  getEmEspera(atividadeId: string): number {
    return this.inscricaoRepository.countInWaitlist(atividadeId);
  }

  convocarEspera(_atividadeId: string): void {
    // no-op
  }

  cancelarInscricoes(_atividadeId: string): void {
    // no-op
  }
}
