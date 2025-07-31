export const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const getTodaySchedule = (staff, date = new Date()) => {
  const dayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const dayName = dayNames[date.getDay()];
  return staff.weeklySchedule?.[dayName] || [];
};

export const getExpectedStartTime = (staff, date = new Date()) => {
  const todaySchedule = getTodaySchedule(staff, date);
  if (todaySchedule.length === 0) return null;

  const firstBlock = todaySchedule[0];
  const startTime = firstBlock.split('-')[0].trim();

  if (startTime.includes(':')) {
    return startTime.includes('AM') || startTime.includes('PM')
      ? startTime
      : startTime + ' AM';
  } else {
    const hour = Number.parseInt(startTime);
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  }
};

export const getWeeklyStats = (staffData) => {
  const totalStaff = staffData.length;
  const presentStaff = staffData.filter(
    (s) => s.currentStatus === 'present'
  ).length;
  const lateToday = staffData.filter((s) => {
    if (!s.todayActual) return false;
    const expected = new Date(`2000-01-01 ${getExpectedStartTime(s)}`);
    const actual = new Date(`2000-01-01 ${s.todayActual}`);
    return actual > expected;
  }).length;
  const studentLeads = staffData.filter(
    (s) => s.role === 'Student Lead'
  ).length;

  return { totalStaff, presentStaff, lateToday, studentLeads };
};

export const getCurrentTerm = (terms, selectedTerm) => {
  return terms.find((term) => term.name === selectedTerm) || terms[0];
};

export const getTermWeekdays = (term) => {
  const weekdays = [];
  const start = new Date(term.startDate);
  const end = new Date(term.endDate);
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return weekdays;
};

export const getTermStatus = (term, today = new Date()) => {
  const startDate = new Date(term.startDate);
  const endDate = new Date(term.endDate);

  if (today < startDate) {
    return { status: 'future' };
  } else if (today > endDate) {
    return { status: 'past' };
  }
  return { status: 'current' };
};
