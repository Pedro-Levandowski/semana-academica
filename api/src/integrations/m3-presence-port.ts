import { ActivityRepository } from '../repositories/activity-repository.js';
import { PresencaRepository } from '../repositories/presenca-repository.js';

export interface M3PresencePort {
  countPresencas(atividadeId: string, participanteId: string): number;
}

export class NeutralM3PresenceAdapter implements M3PresencePort {
  countPresencas(): number {
    return 0;
  }
}

export class SQLiteM3PresenceAdapter implements M3PresencePort {
  constructor(
    private activityRepository: ActivityRepository,
    private presencaRepository: PresencaRepository
  ) {}

  countPresencas(atividadeId: string, participanteId: string): number {
    const atividade = this.activityRepository.findById(atividadeId);
    if (!atividade) {
      return 0;
    }
    return atividade.encontros.filter(
      (encontro) => this.presencaRepository.findByEncontroAndParticipante(encontro.id, participanteId)
    ).length;
  }
}