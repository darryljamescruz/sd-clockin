import { fromZonedTime } from 'date-fns-tz';
import CheckIn from '../models/CheckIn.js';
import Shift from '../models/Shift.js';
import cache from '../utils/cache.js';
import { getPSTDateAsUTC, getPSTDayBoundaries } from '../utils/timezone.js';

const PST_TIMEZONE = 'America/Los_Angeles';

let lastRunDateKey: string | null = null;

function getPstNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: PST_TIMEZONE }));
}

function getPstDateKey(pstDate: Date): string {
  return pstDate.toLocaleDateString('en-CA', { timeZone: PST_TIMEZONE });
}

async function performAutoClockOut(): Promise<number> {
  const now = new Date();
  const pstNow = getPstNow();

  // Only run on weekdays (Mon-Fri)
  const day = pstNow.getDay();
  if (day === 0 || day === 6) {
    return 0;
  }

  const shiftDate = getPSTDateAsUTC(now);
  const dateKey = shiftDate.toISOString().split('T')[0];
  const { startOfDay } = getPSTDayBoundaries(now);

  // Build a timestamp representing exactly 5:30 PM PST for today
  const autoOutTimestamp = fromZonedTime(
    new Date(
      pstNow.getFullYear(),
      pstNow.getMonth(),
      pstNow.getDate(),
      17,
      20,
      0,
      0
    ),
    PST_TIMEZONE
  );

  const activeShifts = await Shift.find({
    date: shiftDate,
    status: 'started',
  });

  let processed = 0;

  for (const shift of activeShifts) {
    // Skip if an "out" check-in already exists for today
    const latestCheckIn = await CheckIn.findOne({
      studentId: shift.studentId,
      termId: shift.termId,
      timestamp: { $gte: startOfDay },
    })
      .sort({ timestamp: -1 })
      .lean();

    if (latestCheckIn && latestCheckIn.type === 'out') {
      continue;
    }

    await CheckIn.create({
      studentId: shift.studentId,
      termId: shift.termId,
      type: 'out',
      timestamp: autoOutTimestamp,
      isManual: true, // mark as system-driven/manual to distinguish from swipes
      isAutoClockOut: true,
    });

    shift.actualEnd = autoOutTimestamp;
    shift.status = 'completed';
    shift.notes = shift.notes
      ? `${shift.notes} | Auto clock-out at 5:20 PM PST`
      : 'Auto clock-out at 5:20 PM PST';

    await shift.save();

    // Invalidate caches for accurate dashboards
    await Promise.all([
      cache.invalidateStudent(shift.studentId.toString(), shift.termId.toString()),
      cache.invalidateTodayShifts(shift.termId.toString(), dateKey),
    ]);

    processed += 1;
  }

  return processed;
}

export function startAutoClockOutJob(): void {
  const runIfNeeded = async (reason: string): Promise<void> => {
    const pstNow = getPstNow();
    const dateKey = getPstDateKey(pstNow);
    const isWeekday = pstNow.getDay() >= 1 && pstNow.getDay() <= 5;
    const isFiveThirtyPm =
      pstNow.getHours() === 17 && pstNow.getMinutes() === 30;
    const alreadyRanToday = lastRunDateKey === dateKey;

    // On cold start, also run if we're already past 5:30 PM PST
    const pastFiveThirtyPm =
      pstNow.getHours() > 17 ||
      (pstNow.getHours() === 17 && pstNow.getMinutes() >= 30);

    if (!isWeekday) return;

    if (
      (isFiveThirtyPm || (reason === 'startup' && pastFiveThirtyPm)) &&
      !alreadyRanToday
    ) {
      try {
        const processed = await performAutoClockOut();
        lastRunDateKey = dateKey;
        console.log(
          `✓ Auto clock-out executed (${reason}) — processed ${processed} shift(s)`
        );
      } catch (error) {
        console.error('✗ Auto clock-out failed:', error);
      }
    }
  };

  // Initial check on startup in case the server comes up after 5:30 PM PST
  void runIfNeeded('startup');

  // Check every minute for the 5:30 PM PST window
  setInterval(() => {
    void runIfNeeded('interval');
  }, 60 * 1000);
}
