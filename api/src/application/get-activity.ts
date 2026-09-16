import { ActivityRepository } from '../repositories/activity-repository.js';
import { ActivityData } from '../domain/activity.js';
import { NotFoundError } from './errors.js';

export class GetActivityUseCase {
  constructor(private activityRepository: ActivityRepository) {}

  execute(id: string): ActivityData {
    const activity = this.activityRepository.findById(id);
    if (!activity) {
      throw new NotFoundError('Atividade não encontrada');
    }
    return activity;
  }
}
