import express, { Request, Response, RequestHandler } from 'express';
import Student from '../models/Student.js';
import Schedule, { ISchedule } from '../models/Schedule.js';
import CheckIn from '../models/CheckIn.js';
import Shift from '../models/Shift.js';
import {
  getPSTDayBoundaries,
  getPSTDateComponents,
} from '../utils/timezone.js';
import cache, { CacheKeys, CacheTTL } from '../utils/cache.js';

const router = express.Router();

interface TimeRange {
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
}

function parseTimeToMinutes(time: string): number {
  const [hourStr, minuteStr] = time.trim().split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return -1;
  }

  return hour * 60 + minute;
}

function aggregateConsecutiveScheduleBlocks(
  blocks: string[],
  toleranceMinutes: number = 5
): TimeRange[] {
  const parsedBlocks = blocks
    .map((block) => {
      const [startTimeRaw, endTimeRaw] = block.split('-');
      if (!startTimeRaw || !endTimeRaw) return null;

      const startTime = startTimeRaw.trim();
      const endTime = endTimeRaw.trim();
      const startMinutes = parseTimeToMinutes(startTime);
      const endMinutes = parseTimeToMinutes(endTime);

      if (startMinutes < 0 || endMinutes < 0 || endMinutes <= startMinutes) {
        return null;
      }

      return {
        startTime,
        endTime,
        startMinutes,
        endMinutes,
      };
    })
    .filter((block): block is TimeRange => block !== null)
    .sort((a, b) => a.startMinutes - b.startMinutes);

  if (parsedBlocks.length === 0) return [];

  const aggregated: TimeRange[] = [];
  let current = { ...parsedBlocks[0] };

  for (let i = 1; i < parsedBlocks.length; i++) {
    const next = parsedBlocks[i];
    if (next.startMinutes <= current.endMinutes + toleranceMinutes) {
      if (next.endMinutes > current.endMinutes) {
        current.endMinutes = next.endMinutes;
        current.endTime = next.endTime;
      }
    } else {
      aggregated.push(current);
      current = { ...next };
    }
  }

  aggregated.push(current);
  return aggregated;
}

// GET all students with their schedules for a specific term
router.get('/', (async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    // Admin panel (no termId): Get ALL students for management
    // Dashboard (with termId): Get all students, compute clock-in status dynamically

    // Cache the student list to avoid repeated queries
    const students = await cache.wrapper(
      CacheKeys.STUDENT_LIST,
      CacheTTL.STUDENT_LIST,
      async () => await Student.find({}).lean()
    );

    // If termId is provided, get schedules and check-ins for that term
    if (termId) {
      const now = new Date();

      // Use PST timezone for determining "today" since schedules are in PST
      // This ensures consistent behavior across different server timezones (local vs Vercel UTC)
      const { startOfDay, endOfDay } = getPSTDayBoundaries(now);
      const { pstYear, pstMonth, pstDate } = getPSTDateComponents(now);
      const today = new Date(Date.UTC(pstYear, pstMonth, pstDate));

      // OPTIMIZATION: Fetch all data in bulk instead of N+1 queries
      // This reduces 400+ queries to just 4 queries for 100 students!
      const [allSchedules, allTodayShifts, allTodayCheckIns, allHistoricalCheckIns] = await Promise.all([
        // 1. Get all schedules for this term
        Schedule.find({ termId }).lean(),

        // 2. Get all shifts for today
        Shift.find({ termId, date: today }).lean(),

        // 3. Get all today's check-ins
        CheckIn.find({
          termId,
          timestamp: { $gte: startOfDay, $lte: endOfDay },
        }).sort({ timestamp: -1 }).lean(),

        // 4. Get recent historical check-ins for all students (limited for performance)
        CheckIn.find({ termId })
          .sort({ timestamp: -1 })
          .limit(students.length * 50) // 50 per student max
          .lean(),
      ]);

      // Build lookup maps for O(1) access
      const schedulesMap = new Map();
      allSchedules.forEach(s => schedulesMap.set(s.studentId.toString(), s));

      const shiftsMap = new Map();
      allTodayShifts.forEach(s => shiftsMap.set(s.studentId.toString(), s));

      const todayCheckInsMap = new Map();
      allTodayCheckIns.forEach(c => {
        const key = c.studentId.toString();
        if (!todayCheckInsMap.has(key)) {
          todayCheckInsMap.set(key, []);
        }
        todayCheckInsMap.get(key).push(c);
      });

      const historicalCheckInsMap = new Map();
      allHistoricalCheckIns.forEach(c => {
        const key = c.studentId.toString();
        if (!historicalCheckInsMap.has(key)) {
          historicalCheckInsMap.set(key, []);
        }
        if (historicalCheckInsMap.get(key).length < 50) {
          historicalCheckInsMap.get(key).push(c);
        }
      });

      // Process each student with pre-fetched data (no more queries!)
      const studentsWithData = students.map((student) => {
        const studentIdStr = student._id.toString();
        const schedule = schedulesMap.get(studentIdStr);
        const todayShift = shiftsMap.get(studentIdStr);

          // Determine current status from shift and schedule
          // IMPORTANT: For main page, status should be based on ACTUAL clock-in, not schedule
          let currentStatus = 'off';
          let todayActual: string | null = null;
          let expectedStartShift: string | null = null;
          let expectedEndShift: string | null = null;
          let isClockedIn = false; // Track if they actually clocked in

          // First check if there's an actual shift record (clocked in)
          if (todayShift) {
            console.log('Found todayShift for', student.name, ':', {
              status: todayShift.status,
              scheduledStart: todayShift.scheduledStart,
              scheduledEnd: todayShift.scheduledEnd,
              actualStart: todayShift.actualStart,
            });

            // Map shift status to frontend status
            if (todayShift.status === 'started') {
              currentStatus = 'present'; // Currently clocked in
              isClockedIn = true;
            } else if (todayShift.status === 'completed') {
              currentStatus = 'clocked_out'; // Finished shift
            } else if (todayShift.status === 'missed') {
              currentStatus = 'absent'; // Didn't show up
            }

            // Get actual clock-in time (return as ISO string, let frontend format)
            if (todayShift.actualStart) {
              todayActual = todayShift.actualStart.toISOString();
            }

            // Get expected start and end times from shift (if available)
            expectedStartShift = todayShift.scheduledStart || null;
            expectedEndShift = todayShift.scheduledEnd || null;
          } else {
            console.log('No todayShift found for', student.name);
          }

          // If not clocked in yet, check fallback: manual check-ins without shift
          if (currentStatus === 'off') {
            const todayCheckIns = todayCheckInsMap.get(studentIdStr) || [];

            if (todayCheckIns.length > 0) {
              const lastCheckIn = todayCheckIns[0];
              if (lastCheckIn.type === 'in') {
                currentStatus = 'present'; // Currently clocked in
                isClockedIn = true;
                todayActual = lastCheckIn.timestamp.toISOString();
              } else if (lastCheckIn.type === 'out') {
                currentStatus = 'clocked_out'; // Already clocked out
              }
            }
          }

          // If currently clocked in, calculate shift end time from schedule for display
          // Status should remain 'present' - we're just getting the end time to show
          if (
            isClockedIn &&
            currentStatus === 'present' &&
            schedule &&
            todayActual
          ) {
            // If we don't have expectedEndShift, calculate it from schedule
            if (!expectedEndShift) {
              console.log(
                '>>> Calculating shift end for clocked-in user:',
                student.name
              );

              // Use PST timezone for schedule matching
              const nowPST = new Date(
                now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
              );
              const dayOfWeek = nowPST.getDay();
              const dayNames: Record<
                number,
                keyof ISchedule['availability'] | null
              > = {
                0: null,
                1: 'monday',
                2: 'tuesday',
                3: 'wednesday',
                4: 'thursday',
                5: 'friday',
                6: null,
              };
              const dayName = dayNames[dayOfWeek];
              const todaySchedule = dayName
                ? schedule.availability[dayName] || []
                : [];
              const mergedTodaySchedule =
                aggregateConsecutiveScheduleBlocks(todaySchedule);

              console.log('Server time (now):', now.toString());
              console.log('Current time (PST):', nowPST.toString());
              console.log('Day of week:', dayOfWeek, '(', dayName, ')');
              console.log('Clock-in time (ISO):', todayActual);
              console.log('Today schedule:', todaySchedule);

              if (todaySchedule.length > 0) {
                // Get the clock-in time in PST
                const clockInTime = new Date(todayActual);
                const clockInPST = new Date(
                  clockInTime.toLocaleString('en-US', {
                    timeZone: 'America/Los_Angeles',
                  })
                );
                const clockInMinutes =
                  clockInPST.getHours() * 60 + clockInPST.getMinutes();

                console.log('Clock-in time (UTC):', clockInTime.toISOString());
                console.log('Clock-in time (PST):', clockInPST.toString());
                console.log('Clock-in total minutes (PST):', clockInMinutes);

                // Find the shift they clocked into (match to closest shift for multiple shifts per day)
                // For longer shifts, we need to check if they're within ANY shift window, not just starting soon
                let bestMatch: {
                  startTime: string;
                  endTime: string;
                  distance: number;
                } | null = null;

              for (const shift of mergedTodaySchedule) {
                  const shiftStartMinutes = shift.startMinutes;
                  const shiftEndMinutes = shift.endMinutes;

                  console.log(
                    `Checking shift ${shift.startTime}-${shift.endTime}: start=${shiftStartMinutes}, end=${shiftEndMinutes}`
                  );

                  // Check if clocked in within the shift window (including up to 4 hours before start)
                  // This handles longer shifts better - if they're anywhere in the shift, match it
                  if (
                    clockInMinutes >= shiftStartMinutes - 240 &&
                    clockInMinutes <= shiftEndMinutes
                  ) {
                    // Calculate distance to shift start (prefer closest shift)
                    const distance = Math.abs(
                      clockInMinutes - shiftStartMinutes
                    );

                    if (!bestMatch || distance < bestMatch.distance) {
                      bestMatch = {
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                        distance,
                      };
                      console.log(
                        `  → Potential match (distance: ${distance} min)`
                      );
                    }
                  }
                }

                if (bestMatch) {
                  expectedStartShift = bestMatch.startTime;
                  expectedEndShift = bestMatch.endTime;
                  console.log(
                    '✓ Best match:',
                    expectedStartShift,
                    '-',
                    expectedEndShift
                  );
                } else {
                  // If no matching shift found, they clocked in outside schedule
                  expectedEndShift = 'No schedule';
                  console.log(
                    '✗ No matching shift found (clocked in outside schedule)'
                  );
                }
              } else {
                // No schedule for today
                expectedEndShift = 'No schedule';
                console.log('✗ No schedule for today');
              }
            }
          }

          // IMPORTANT: If someone is clocked in, their status should be based on clock-in, NOT schedule
          // Only check schedule for expected arrivals if they're NOT clocked in
          // If they're clocked in, status stays 'present' regardless of schedule

          // If still 'off' (not clocked in), check weekly schedule for expected arrivals
          console.log('=== Checking expected arrivals for:', student.name);
          console.log('Current status:', currentStatus);
          console.log('Is clocked in?', isClockedIn);
          console.log('Has schedule?', !!schedule);

          // Only check schedule if they're NOT clocked in
          if (!isClockedIn && currentStatus === 'off' && schedule) {
            // Convert current time to PST for comparison with schedules
            const nowPST = new Date(
              now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
            );

            // Map getDay() (0=Sunday, 1=Monday...6=Saturday) to weekday names
            const dayOfWeek = nowPST.getDay(); // 0-6
            const dayNames: Record<
              number,
              keyof ISchedule['availability'] | null
            > = {
              0: null, // Sunday - no schedule
              1: 'monday',
              2: 'tuesday',
              3: 'wednesday',
              4: 'thursday',
              5: 'friday',
              6: null, // Saturday - no schedule
            };
            const dayName = dayNames[dayOfWeek];

            console.log('Server time (UTC):', now.toString());
            console.log('Current time (PST):', nowPST.toString());
            console.log(
              'Day of week (PST):',
              dayOfWeek,
              '(',
              dayName || 'weekend',
              ')'
            );
            console.log(
              'Schedule availability keys:',
              Object.keys(schedule.availability)
            );

            // Only check if it's a weekday
            const todaySchedule = dayName
              ? schedule.availability[dayName] || []
              : [];
            const mergedTodaySchedule =
              aggregateConsecutiveScheduleBlocks(todaySchedule);

            console.log('Today schedule:', todaySchedule);

            // Check if any shift starts within the next 3 hours (use PST time)
            const currentHour = nowPST.getHours();
            const currentMinute = nowPST.getMinutes();
            const currentTotalMinutes = currentHour * 60 + currentMinute;

            console.log(
              'Current time (PST):',
              `${currentHour}:${currentMinute}`,
              '(',
              currentTotalMinutes,
              'minutes)'
            );

            for (const shift of mergedTodaySchedule) {
              console.log(
                'Processing shift block:',
                `${shift.startTime}-${shift.endTime}`
              );
              const shiftStartTotalMinutes = shift.startMinutes;
              const shiftEndTotalMinutes = shift.endMinutes;

              console.log(
                'Shift time:',
                shift.startTime,
                '-',
                shift.endTime
              );
              console.log(
                'Shift minutes:',
                shiftStartTotalMinutes,
                '-',
                shiftEndTotalMinutes
              );
              console.log('Current time minutes:', currentTotalMinutes);

              // Check if we're currently within an active shift window
              const isCurrentlyInShift =
                currentTotalMinutes >= shiftStartTotalMinutes &&
                currentTotalMinutes < shiftEndTotalMinutes;

              // Check if shift starts within next 3 hours (180 minutes)
              const minutesUntilShift =
                shiftStartTotalMinutes - currentTotalMinutes;

              console.log('Is currently in shift?', isCurrentlyInShift);
              console.log('Minutes until shift:', minutesUntilShift);
              console.log(
                'Is within 3 hours?',
                minutesUntilShift >= 0 && minutesUntilShift <= 180
              );

              // If currently in an active shift, mark as incoming (they should be here)
              if (isCurrentlyInShift) {
                currentStatus = 'incoming'; // Currently in shift window but not clocked in
                expectedStartShift = shift.startTime;
                expectedEndShift = shift.endTime;
                console.log(
                  '✓ Setting as INCOMING (currently in shift) with shift:',
                  expectedStartShift,
                  '-',
                  expectedEndShift
                );
                break; // Use the first matching shift
              } else if (minutesUntilShift >= 0 && minutesUntilShift <= 180) {
                currentStatus = 'incoming'; // Expected to arrive within 3 hours
                expectedStartShift = shift.startTime;
                expectedEndShift = shift.endTime;
                console.log(
                  '✓ Setting as INCOMING (shift starting soon) with shift:',
                  expectedStartShift,
                  '-',
                  expectedEndShift
                );
                break; // Use the first matching shift
              }
            }
          }

          // CRITICAL: If they're clocked in, ensure status stays 'present'
          // This is a final safeguard - status should already be 'present' if isClockedIn is true
          if (isClockedIn && currentStatus !== 'present') {
            console.log(
              '⚠ WARNING: Clocked in but status is',
              currentStatus,
              'for',
              student.name
            );
            console.log(
              '⚠ Correcting status to present (they are clocked in)'
            );
            currentStatus = 'present';
          }

          console.log('Final status for', student.name, ':', currentStatus);
          console.log('Is clocked in:', isClockedIn);
          console.log('Expected shift end:', expectedEndShift);
          console.log('---');

          // Get historical check-ins from pre-fetched data
          const checkIns = historicalCheckInsMap.get(studentIdStr) || [];

          return {
            id: String(student._id),
            name: student.name,
            cardId: student.iso,
            role: student.role,
            currentStatus,
            todayActual,
            expectedStartShift,
            expectedEndShift,
            weeklySchedule: schedule?.availability || {
              monday: [],
              tuesday: [],
              wednesday: [],
              thursday: [],
              friday: [],
            },
            clockEntries: checkIns.map((entry: any) => ({
              id: entry._id.toString(),
              timestamp: entry.timestamp,
              type: entry.type,
              isManual: entry.isManual,
              isAutoClockOut: entry.isAutoClockOut || false,
            })),
          };
        });

      return res.json(studentsWithData);
    }

    // Return basic student info if no termId provided
    const studentsBasic = students.map((student) => ({
      id: String(student._id),
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    }));

    res.json(studentsBasic);
  } catch (error) {
    console.error('Error fetching students:', error);
    res
      .status(500)
      .json({
        message: 'Error fetching students',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

// GET a single student by ID, optionally with term-specific data
router.get('/:id', (async (req: Request, res: Response) => {
  try {
    const { termId } = req.query;
    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // If termId is provided, include term-specific data (schedules, check-ins)
    if (termId && typeof termId === 'string' && termId.trim() !== '') {
      const now = new Date();
      const { startOfDay, endOfDay } = getPSTDayBoundaries(now);
      const { pstYear, pstMonth, pstDate } = getPSTDateComponents(now);

      const schedule = await Schedule.findOne({
        studentId: student._id,
        termId,
      }).lean();

      // Get today's shift for this student
      const today = new Date(Date.UTC(pstYear, pstMonth, pstDate));
      const todayShift = await Shift.findOne({
        studentId: student._id,
        termId,
        date: today,
      }).lean();

      // Determine current status from shift and schedule
      let currentStatus = 'off';
      let todayActual: string | null = null;
      let expectedStartShift: string | null = null;
      let expectedEndShift: string | null = null;
      let isClockedIn = false;

      // First check if there's an actual shift record (clocked in)
      if (todayShift) {
        if (todayShift.status === 'started') {
          currentStatus = 'present';
          isClockedIn = true;
        } else if (todayShift.status === 'completed') {
          currentStatus = 'clocked_out';
        } else if (todayShift.status === 'missed') {
          currentStatus = 'absent';
        }

        if (todayShift.actualStart) {
          todayActual = todayShift.actualStart.toISOString();
        }

        expectedStartShift = todayShift.scheduledStart || null;
        expectedEndShift = todayShift.scheduledEnd || null;
      }

      // If not clocked in yet, check fallback: manual check-ins without shift
      if (currentStatus === 'off') {
        const todayCheckIns = await CheckIn.find({
          studentId: student._id,
          termId,
          timestamp: { $gte: startOfDay, $lte: endOfDay },
        })
          .sort({ timestamp: -1 })
          .lean();

        if (todayCheckIns.length > 0) {
          const lastCheckIn = todayCheckIns[0];
          if (lastCheckIn.type === 'in') {
            currentStatus = 'present';
            isClockedIn = true;
            todayActual = lastCheckIn.timestamp.toISOString();
          } else if (lastCheckIn.type === 'out') {
            currentStatus = 'clocked_out';
          }
        }
      }

      // If currently clocked in, calculate shift end time from schedule for display
      if (
        isClockedIn &&
        currentStatus === 'present' &&
        schedule &&
        todayActual
      ) {
        if (!expectedEndShift) {
          const nowPST = new Date(
            now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
          );
          const dayOfWeek = nowPST.getDay();
          const dayNames: Record<
            number,
            keyof ISchedule['availability'] | null
          > = {
            0: null,
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: null,
          };
          const dayName = dayNames[dayOfWeek];
          const todaySchedule = dayName
            ? schedule.availability[dayName] || []
            : [];
          const mergedTodaySchedule =
            aggregateConsecutiveScheduleBlocks(todaySchedule);

          if (todaySchedule.length > 0) {
            const clockInTime = new Date(todayActual);
            const clockInPST = new Date(
              clockInTime.toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
              })
            );
            const clockInMinutes =
              clockInPST.getHours() * 60 + clockInPST.getMinutes();

            let bestMatch: {
              startTime: string;
              endTime: string;
              distance: number;
            } | null = null;

            for (const shift of mergedTodaySchedule) {
              const shiftStartMinutes = shift.startMinutes;
              const shiftEndMinutes = shift.endMinutes;

              if (
                clockInMinutes >= shiftStartMinutes - 240 &&
                clockInMinutes <= shiftEndMinutes
              ) {
                const distance = Math.abs(clockInMinutes - shiftStartMinutes);
                if (!bestMatch || distance < bestMatch.distance) {
                  bestMatch = {
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    distance,
                  };
                }
              }
            }

            if (bestMatch) {
              expectedStartShift = bestMatch.startTime;
              expectedEndShift = bestMatch.endTime;
            } else {
              expectedEndShift = 'No schedule';
            }
          } else {
            expectedEndShift = 'No schedule';
          }
        }
      }

      // If still 'off' (not clocked in), check weekly schedule for expected arrivals
      if (!isClockedIn && currentStatus === 'off' && schedule) {
        const nowPST = new Date(
          now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
        );
        const dayOfWeek = nowPST.getDay();
        const dayNames: Record<number, keyof ISchedule['availability'] | null> =
          {
            0: null,
            1: 'monday',
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: null,
          };
        const dayName = dayNames[dayOfWeek];
        const todaySchedule = dayName
          ? schedule.availability[dayName] || []
          : [];
        const mergedTodaySchedule =
          aggregateConsecutiveScheduleBlocks(todaySchedule);

        const currentHour = nowPST.getHours();
        const currentMinute = nowPST.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        for (const shift of mergedTodaySchedule) {
          const shiftStartTotalMinutes = shift.startMinutes;
          const shiftEndTotalMinutes = shift.endMinutes;

          const isCurrentlyInShift =
            currentTotalMinutes >= shiftStartTotalMinutes &&
            currentTotalMinutes < shiftEndTotalMinutes;
          const minutesUntilShift =
            shiftStartTotalMinutes - currentTotalMinutes;

          if (isCurrentlyInShift) {
            currentStatus = 'incoming';
            expectedStartShift = shift.startTime;
            expectedEndShift = shift.endTime;
            break;
          } else if (minutesUntilShift >= 0 && minutesUntilShift <= 180) {
            currentStatus = 'incoming';
            expectedStartShift = shift.startTime;
            expectedEndShift = shift.endTime;
            break;
          }
        }
      }

      // Final safeguard
      if (isClockedIn && currentStatus !== 'present') {
        currentStatus = 'present';
      }

      // Get all check-ins for historical data
      const checkIns = await CheckIn.find({
        studentId: student._id,
        termId,
      })
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();

      return res.json({
        id: String(student._id),
        name: student.name,
        cardId: student.iso,
        role: student.role,
        currentStatus,
        todayActual,
        expectedStartShift,
        expectedEndShift,
        weeklySchedule: schedule?.availability || {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        },
        clockEntries: checkIns.map((entry) => ({
          id: entry._id.toString(),
          timestamp: entry.timestamp,
          type: entry.type,
          isManual: entry.isManual,
          isAutoClockOut: entry.isAutoClockOut || false,
        })),
      });
    }

    // Return basic student info if no termId provided
    res.json({
      id: String(student._id),
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res
      .status(500)
      .json({
        message: 'Error fetching student',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

// POST - Create a new student
router.post('/', (async (req: Request, res: Response) => {
  try {
    const { name, cardId, role } = req.body;

    if (!name || !cardId || !role) {
      return res
        .status(400)
        .json({ message: 'Name, cardId, and role are required' });
    }

    const existingStudent = await Student.findOne({ iso: cardId });
    if (existingStudent) {
      return res
        .status(409)
        .json({ message: 'A student with this card ID already exists' });
    }

    const newStudent = new Student({
      name,
      iso: cardId,
      role,
      status: 'active',
    });

    await newStudent.save();

    // Invalidate student list cache
    await cache.delete(CacheKeys.STUDENT_LIST);

    res.status(201).json({
      id: String(newStudent._id),
      name: newStudent.name,
      cardId: newStudent.iso,
      role: newStudent.role,
      currentStatus: newStudent.status,
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res
      .status(500)
      .json({
        message: 'Error creating student',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

// PUT - Update a student
router.put('/:id', (async (req: Request, res: Response) => {
  try {
    const { name, cardId, role } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if cardId is being changed and if it's already in use
    if (cardId && cardId !== student.iso) {
      const existingStudent = await Student.findOne({ iso: cardId });
      if (existingStudent) {
        return res
          .status(409)
          .json({ message: 'A student with this card ID already exists' });
      }
    }

    if (name) student.name = name;
    if (cardId) student.iso = cardId;
    if (role) student.role = role;

    await student.save();

    // Invalidate caches for this student
    await cache.invalidateStudent(String(student._id));

    res.json({
      id: String(student._id),
      name: student.name,
      cardId: student.iso,
      role: student.role,
      currentStatus: student.status,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res
      .status(500)
      .json({
        message: 'Error updating student',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

// DELETE - Delete a student
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Also delete associated schedules and check-ins
    await Schedule.deleteMany({ studentId: req.params.id });
    await CheckIn.deleteMany({ studentId: req.params.id });

    // Invalidate caches for this student
    await cache.invalidateStudent(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res
      .status(500)
      .json({
        message: 'Error deleting student',
        error: (error as Error).message,
      });
  }
}) as RequestHandler);

export default router;
