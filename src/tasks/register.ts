import { type RecurrenceSpecObjLit, Range, scheduleJob } from 'node-schedule';
import { pruneTwitterClearVideos } from '#tasks/pruneTwitterClearVideos';
import { pruneLevels } from '#tasks/pruneLevels';

const recurrenceRule: RecurrenceSpecObjLit = { month: new Range(0, 12), date: 0, hour: 0, minute: 0 };

scheduleJob(recurrenceRule, pruneTwitterClearVideos);
scheduleJob(recurrenceRule, pruneLevels);
