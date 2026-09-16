import { ActivityRepository } from '../repositories/activity-repository.js';
import { M2IntegrationPort } from '../integrations/m2-port.js';
import { Clock } from '../clock/clock.js';
import { ActivityData, DomainError, getEarliestEncontroInicio } from '../domain/activity.js';
import { NotFoundError } from './errors.js';

export class CancelActivityUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private m2Port: M2IntegrationPort,
    private clock: Clock
  ) {}

  execute(id: string): ActivityData {
    const activity = this.activityRepository.findById(id);
    if (!activity) {
      throw new NotFoundError('Atividade não encontrada');
    }

    if (activity.cancelada) {
      throw new DomainError('ATIVIDADE_CANCELADA', 'Atividade já está cancelada');
    }

    const agora = this.clock.now();
    const primeiroInicio = getEarliestEncontroInicio(activity.encontros);

    if (agora >= primeiroInicio) {
      throw new DomainError('ATIVIDADE_JA_INICIADA', 'Atividade já iniciada');
    }

    this.activityRepository.cancel(id);
    this.m2Port.cancelarInscricoes(id);

    const updated = this.activityRepository.findById(id);
    if (!updated) {
      throw new NotFoundError('Atividade não encontrada');
    }

    return updated;
  }
}
