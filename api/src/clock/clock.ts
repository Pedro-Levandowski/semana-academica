import { DateTime } from 'luxon';

export interface Clock {
  now(): DateTime;
}

export class RealClock implements Clock {
  now(): DateTime {
    return DateTime.now();
  }
}
