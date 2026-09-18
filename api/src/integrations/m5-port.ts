import { DateTime } from 'luxon';
import { InscricaoRepository } from '../repositories/inscricao-repository.js';

export interface M5IntegrationPort {
  isParticipantBlocked(participanteId: string, agora: DateTime): boolean;
}

export class NeutralM5Adapter implements M5IntegrationPort {
  isParticipantBlocked(_participanteId: string, _agora: DateTime): boolean {
    return false;
  }
}

export class SQLiteM5Adapter implements M5IntegrationPort {
  constructor(private inscricaoRepository: InscricaoRepository) {}

  isParticipantBlocked(participanteId: string, agora: DateTime): boolean {
    const endedActivities = this.inscricaoRepository.getEndedActivitiesForParticipant(participanteId);
    let zeroPresencaCount = 0;
    for (const endedAtv of endedActivities) {
      const maxFim = DateTime.fromISO(endedAtv.maxFim, { setZone: true });
      if (agora >= maxFim) {
        if (!this.inscricaoRepository.hasPresencaInActivity(endedAtv.atividadeId, participanteId)) {
          zeroPresencaCount++;
        }
      }
    }
    return zeroPresencaCount >= 2;
  }
}
