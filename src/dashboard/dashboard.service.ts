import { Injectable } from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(private readonly activities: ActivitiesService) {}

  latestActivities(user: CurrentUserPayload) {
    return this.activities.latestActivities(user);
  }
}
