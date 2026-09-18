import { ActivityRepository } from '../repositories/activity-repository.js';
import { PresencaRepository, PresencaRow } from '../repositories/presenca-repository.js';
import { NotFoundError } from './errors.js';

export class ListPresencasUseCase {
  constructor(
    private activityRepository: ActivityRepository,
    private presencaRepository: PresencaRepository
  ) {}

  execute(encontroId: string): PresencaRow[] {
    const result = this.activityRepository.findEncounterWithActivity(encontroId);
    if (!result) {
      throw new NotFoundError('Encontro não encontrado');
    }
    return this.presencaRepository.findByEncontro(encontroId);
  }
}
