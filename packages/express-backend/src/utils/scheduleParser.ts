/**
 * Schedule Parser Utility
 * Normalizes various time formats into a standard format
 */

export interface ParsedTimeBlock {
  start: string; // HH:MM in 24-hour format
  end: string;   // HH:MM in 24-hour format
  original: string;
}

/**
 * Convert 12-hour time to 24-hour format
 * Examples: "5 PM" -> "17:00", "12:30 pm" -> "12:30", "9" -> "09:00"
 */
export function convertTo24Hour(timeStr: string): string {
  const cleaned = timeStr.trim().toLowerCase();
  
  // Check for AM/PM
  const hasAM = cleaned.includes('am');
  const hasPM = cleaned.includes('pm');
  
  // Extract numbers and optional colon
  const timeMatch = cleaned.match(/(\d+)(?::(\d+))?/);
  if (!timeMatch) {
    throw new Error(`Invalid time format: ${timeStr}`);
  }
  
  let hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  
  // Validate
  if (hours < 0 || hours > 23) {
    throw new Error(`Invalid hour: ${hours}`);
  }
  if (minutes < 0 || minutes > 59) {
    throw new Error(`Invalid minutes: ${minutes}`);
  }
  
  // Handle 12-hour conversion
  if (hasAM || hasPM) {
    if (hours === 12 && hasAM) {
      hours = 0; // 12 AM is 00:00
    } else if (hours !== 12 && hasPM) {
      hours += 12; // PM adds 12 hours (except for 12 PM)
    }
  }
  // If no AM/PM specified and hour is 1-7, assume PM (common for end times)
  else if (hours >= 1 && hours <= 7 && !timeMatch[2]) {
    hours += 12;
  }
  
  // Format as HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse a time block string into start and end times
 * Supports formats:
 * - "12:30-5" or "12:30-17"
 * - "12:30 PM - 5 PM" or "12:30 pm - 5:00 pm"
 * - "9-5", "9-17"
 * - "9:00 AM - 5:00 PM"
 */
export function parseTimeBlock(block: string): ParsedTimeBlock {
  const cleaned = block.trim();
  
  if (!cleaned) {
    throw new Error('Empty time block');
  }
  
  // Split on dash or hyphen with optional spaces
  const parts = cleaned.split(/\s*[-–—]\s*/);
  
  if (parts.length !== 2) {
    throw new Error(`Invalid time block format: ${block}. Expected format like "9-5" or "9 AM - 5 PM"`);
  }
  
  try {
    const start = convertTo24Hour(parts[0]);
    const end = convertTo24Hour(parts[1]);
    
    // Validate that end is after start
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    
    if (endMinutes <= startMinutes) {
      throw new Error(`End time (${end}) must be after start time (${start})`);
    }
    
    return {
      start,
      end,
      original: cleaned,
    };
  } catch (error) {
    throw new Error(`Failed to parse time block "${block}": ${(error as Error).message}`);
  }
}

/**
 * Normalize a time block to standard format (HH:MM-HH:MM)
 */
export function normalizeTimeBlock(block: string): string {
  const parsed = parseTimeBlock(block);
  return `${parsed.start}-${parsed.end}`;
}

/**
 * Normalize an array of time blocks
 */
export function normalizeScheduleBlocks(blocks: string[]): string[] {
  return blocks
    .map(block => block.trim())
    .filter(block => block.length > 0)
    .map(block => {
      try {
        return normalizeTimeBlock(block);
      } catch (error) {
        console.warn(`Skipping invalid time block "${block}": ${(error as Error).message}`);
        return null;
      }
    })
    .filter((block): block is string => block !== null);
}

/**
 * Parse and normalize a full schedule availability object
 */
export function normalizeSchedule(availability: {
  monday?: string[];
  tuesday?: string[];
  wednesday?: string[];
  thursday?: string[];
  friday?: string[];
}): {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
} {
  return {
    monday: normalizeScheduleBlocks(availability.monday || []),
    tuesday: normalizeScheduleBlocks(availability.tuesday || []),
    wednesday: normalizeScheduleBlocks(availability.wednesday || []),
    thursday: normalizeScheduleBlocks(availability.thursday || []),
    friday: normalizeScheduleBlocks(availability.friday || []),
  };
}

/**
 * Convert normalized time block to 12-hour format for display
 * Example: "09:00-17:00" -> "9:00 AM - 5:00 PM"
 */
export function formatTimeBlockForDisplay(block: string): string {
  const parts = block.split('-');
  if (parts.length !== 2) return block;
  
  const formatTime = (time24: string): string => {
    const [hourStr, minuteStr] = time24.split(':');
    let hour = parseInt(hourStr);
    const minute = minuteStr || '00';
    
    const period = hour >= 12 ? 'PM' : 'AM';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;
    
    return `${hour}:${minute} ${period}`;
  };
  
  return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
}

