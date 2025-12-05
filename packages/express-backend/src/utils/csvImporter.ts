/**
 * CSV Importer for Teams Shift Data
 * Converts Teams shift exports to student schedules
 */

import { normalizeTimeBlock } from './scheduleParser.js';

export interface TeamsShiftRow {
  name: string;
  startDate: string; // MM/DD/YYYY
  startTime: string; // HH:MM
  endDate: string; // MM/DD/YYYY
  endTime: string; // HH:MM
}

export interface ProcessedSchedule {
  name: string;
  availability: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
  };
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Parse Teams CSV row
 * Format: Name,Email,Role,StartDate,StartTime,EndDate,EndTime,...
 * We extract Name, StartDate, StartTime, EndDate, EndTime (ignoring Role column)
 */
export function parseTeamsCSVRow(line: string): TeamsShiftRow | null {
  // Skip header row
  if (line.trim().toLowerCase().startsWith('name')) {
    return null;
  }

  const parts = parseCSVLine(line);

  if (parts.length < 7) {
    console.warn(`CSV row has insufficient columns (${parts.length}):`, line);
    return null;
  }

  const name = parts[0]?.trim() || '';
  const startDate = parts[3]?.trim() || '';
  const endDate = parts[5]?.trim() || '';
  const startTime = parts[4]?.trim() || '';
  const endTime = parts[6]?.trim() || '';

  if (!name) {
    console.warn('Skipping row with empty name');
    return null;
  }

  if (!startDate || !endDate) {
    console.warn('Skipping row with missing dates:', line);
    return null;
  }

  if (!startTime || !endTime) {
    console.warn('Skipping row with missing times:', line);
    return null;
  }

  return {
    name: name,
    startDate,
    startTime,
    endDate,
    endTime,
  };
}

/**
 * Find the earliest date in all shifts to use as Monday reference
 */
export function findEarliestDate(shifts: TeamsShiftRow[]): Date {
  let earliest: Date | null = null;

  for (const shift of shifts) {
    const [month, day, year] = shift.startDate
      .split('/')
      .map((n) => parseInt(n));
    const date = new Date(year, month - 1, day);

    // Skip invalid dates instead of poisoning the calculation
    if (Number.isNaN(date.getTime())) {
      console.warn(`Skipping invalid start date: ${shift.startDate}`);
      continue;
    }

    if (!earliest || date < earliest) {
      earliest = date;
    }
  }

  return earliest || new Date();
}

/**
 * Get day of week based on offset from Monday (earliest date)
 * Assumes earliest date in CSV is Monday
 */
export function getDayOfWeekFromMonday(
  dateStr: string,
  mondayDate: Date
): string {
  const [month, day, year] = dateStr.split('/').map((n) => parseInt(n));
  const date = new Date(year, month - 1, day);

  // Calculate days difference from Monday
  const diffTime = date.getTime() - mondayDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const dayIndex = diffDays % 7;

  return days[dayIndex] || 'monday';
}

/**
 * Convert parsed shifts to aggregated schedules by student
 * Assumes earliest date in the dataset is Monday
 */
export function aggregateSchedules(
  shifts: TeamsShiftRow[]
): ProcessedSchedule[] {
  if (shifts.length === 0) {
    return [];
  }

  // Find the earliest date (this is our Monday reference)
  const mondayDate = findEarliestDate(shifts);
  console.log('Using reference Monday date:', mondayDate.toISOString());

  const studentMap = new Map<string, ProcessedSchedule>();

  for (const shift of shifts) {
    const key = shift.name.toLowerCase().trim();

    // Initialize student entry if not exists
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        name: shift.name,
        availability: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
        },
      });
    }

    const student = studentMap.get(key)!;

    // Get day of week based on offset from Monday
    const dayOfWeek = getDayOfWeekFromMonday(shift.startDate, mondayDate);

    // Skip weekends
    if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
      continue;
    }

    // Create time block (e.g., "12:00-16:00")
    const timeBlock = `${shift.startTime}-${shift.endTime}`;

    try {
      // Normalize the time block
      const normalized = normalizeTimeBlock(timeBlock);

      // Add to the appropriate day if not already there
      const dayKey = dayOfWeek as keyof typeof student.availability;
      if (!student.availability[dayKey].includes(normalized)) {
        student.availability[dayKey].push(normalized);
      }
    } catch (error) {
      console.warn(
        `Skipping invalid time block for ${shift.name}: ${timeBlock}`,
        error
      );
    }
  }

  // Sort time blocks for each day
  for (const student of studentMap.values()) {
    for (const day of Object.keys(student.availability) as Array<
      keyof typeof student.availability
    >) {
      student.availability[day].sort();
    }
  }

  return Array.from(studentMap.values());
}

/**
 * Parse full CSV content and return processed schedules
 */
export function parseTeamsCSV(csvContent: string): ProcessedSchedule[] {
  const lines = csvContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const shifts: TeamsShiftRow[] = [];

  for (const line of lines) {
    const row = parseTeamsCSVRow(line);
    if (row && row.name) {
      shifts.push(row);
    }
  }

  return aggregateSchedules(shifts);
}

/**
 * Extract first name from full name
 */
function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0].toLowerCase();
}

/**
 * Match processed schedules to existing students by first name
 * More flexible matching that handles name variations
 */
export function matchStudentsByName(
  processedSchedules: ProcessedSchedule[],
  existingStudents: Array<{ id: string; name: string }>
): Array<{
  studentId: string;
  studentName: string;
  csvName: string;
  availability: ProcessedSchedule['availability'];
  matched: boolean;
}> {
  return processedSchedules.map((schedule) => {
    const csvFirstName = getFirstName(schedule.name);

    // Try to find matching student by first name (case-insensitive)
    const matchedStudent = existingStudents.find((s) => {
      const existingFirstName = getFirstName(s.name);
      return existingFirstName === csvFirstName;
    });

    return {
      studentId: matchedStudent?.id || '',
      studentName: matchedStudent?.name || schedule.name,
      csvName: schedule.name,
      availability: schedule.availability,
      matched: !!matchedStudent,
    };
  });
}
