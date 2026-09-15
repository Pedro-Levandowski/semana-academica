import { DateTime } from 'luxon';
import { Clock } from '../clock/clock.js';

export class ControllableClock implements Clock {
  private currentTime: DateTime;

  constructor(initialTime: string | DateTime = '2026-10-13T09:00:00-03:00') {
    this.currentTime = typeof initialTime === 'string' 
      ? DateTime.fromISO(initialTime) 
      : initialTime;
  }

  now(): DateTime {
    return this.currentTime;
  }

  set(time: string | DateTime): void {
    this.currentTime = typeof time === 'string'
      ? DateTime.fromISO(time)
      : time;
  }
}
