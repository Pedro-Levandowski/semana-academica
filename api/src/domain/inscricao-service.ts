import { DateTime } from 'luxon';
import { ActivityRepository } from '../repositories/activity-repository.js';
import { InscricaoRepository } from '../repositories/inscricao-repository.js';
import { sortEncontros } from './activity.js';

export function processExpirationsAndConvocations(
  activityRepository: ActivityRepository,
  inscricaoRepository: InscricaoRepository,
  agora: DateTime,
  targetAtividadeId?: string
): void {
  const atividadeIds = targetAtividadeId
    ? [targetAtividadeId]
    : inscricaoRepository.findDistinctActivityIdsWithInscricoes();

  for (const atividadeId of atividadeIds) {
    const activity = activityRepository.findById(atividadeId);
    if (!activity || activity.cancelada === 1) {
      continue;
    }

    const sortedEncontros = sortEncontros(activity.encontros || []);
    if (!sortedEncontros || sortedEncontros.length === 0) {
      continue;
    }

    const primeiroInicio = DateTime.fromISO(sortedEncontros[0].inicio, { setZone: true });
    const limiteEncerramento = primeiroInicio.minus({ minutes: 30 });

    // 1. Expire convocations if agora >= convocadaAte
    const convocadas = inscricaoRepository.findConvocadas(atividadeId);
    for (const convocada of convocadas) {
      if (convocada.convocadaAte) {
        const convocadaAteDt = DateTime.fromISO(convocada.convocadaAte, { setZone: true });
        if (agora >= convocadaAteDt) {
          inscricaoRepository.expireInscricao(convocada.id);
        }
      }
    }

    // 2. Promote from waitlist if there are available seats and agora < limiteEncerramento
    if (agora < limiteEncerramento) {
      while (inscricaoRepository.countOccupied(atividadeId) < activity.vagas) {
        const firstInWaitlist = inscricaoRepository.findFirstInWaitlist(atividadeId);
        if (!firstInWaitlist) {
          break;
        }

        const defaultConvocadaAte = agora.plus({ hours: 2 });
        const finalConvocadaAte = defaultConvocadaAte > limiteEncerramento ? limiteEncerramento : defaultConvocadaAte;

        inscricaoRepository.promoteToConvocada(firstInWaitlist.id, finalConvocadaAte.toISO({ suppressMilliseconds: true }) || '');
      }
    }

    // 3. Reorder waitlist positions
    inscricaoRepository.reorderWaitlist(atividadeId);
  }
}
