import { ActivityRepository, ActivityRow, EncounterRow } from '../repositories/activity-repository.js';
import { sortActivities, filterActivities } from '../domain/activity.js';

export class ListActivitiesUseCase {
  constructor(private activityRepository: ActivityRepository) {}

  execute(filters?: { dia?: string; tipo?: string }): Array<ActivityRow & { encontros: EncounterRow[] }> {
    const activities = this.activityRepository.findAll();
    const filtered = filters ? filterActivities(activities, filters) : activities;
    return sortActivities(filtered);
  }
}
