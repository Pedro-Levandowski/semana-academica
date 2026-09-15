import { ActivityRepository, ActivityRow, EncounterRow } from '../repositories/activity-repository.js';
import { sortActivities } from '../domain/activity.js';

export class ListActivitiesUseCase {
  constructor(private activityRepository: ActivityRepository) {}

  execute(): Array<ActivityRow & { encontros: EncounterRow[] }> {
    const activities = this.activityRepository.findAll();
    return sortActivities(activities);
  }
}
