import { ActivityRepository } from '../repositories/activity-repository.js';
import { PresencaRepository, PresencaRow } from '../repositories/presenca-repository.js';
import { Clock } from '../clock/clock.js';
import { DomainError } from '../domain/activity.js';
import { NotFoundError } from './errors.js';
import crypto from 'crypto';

export class RegisterPresencaManualUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private presencaRepository: PresencaRepository,
    private clock: Clock
  ) {}

  execute(encontroId: string, participanteId: string, input: { participanteId?: string; justificativa?: string }): { presenca: PresencaRow; statusCode: number } {
    const result = this.activityRepository.findEncounterWithActivity(encontroId);
    if (!result) {
      throw new NotFoundError('Encontro não encontrado');
    }

    const justificativa = input.justificativa;
    if (!justificativa || typeof justificativa !== 'string' || justificativa.trim().length < 10) {
      throw new DomainError('JUSTIFICATIVA_OBRIGATORIA', 'Justificativa obrigatória com no mínimo 10 caracteres');
    }

    const existing = this.presencaRepository.findByEncontroAndParticipante(encontroId, participanteId);
    if (existing) {
      return { presenca: existing, statusCode: 200 };
    }

    const agora = this.clock.now();
    const id = 'pre_' + crypto.randomBytes(4).toString('hex');
    const presenca: PresencaRow = {
      id,
      encontroId,
      participanteId,
      origem: 'manual',
      lidoEm: agora.toISO()!,
      registradaEm: agora.toISO()!,
      justificativa
    };

    this.presencaRepository.create(presenca);

    return { presenca, statusCode: 201 };
  }
}
