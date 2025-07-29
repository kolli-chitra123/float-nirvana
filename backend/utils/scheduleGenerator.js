const generateScheduleMap = (startDate, endDate, timeSlots) => {
  const schedule = new Map();
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateKey = current.toISOString().split('T')[0];
    schedule.set(dateKey, timeSlots.map(time => ({
      time,
      available: true,
      booked: false,
      userId: null
    })));
    current.setDate(current.getDate() + 1);
  }

  return schedule;
};

const getDefaultTimeSlots = () => {
  return [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00'
  ];
};

const extendSchedule = (existingSchedule, newEndDate, timeSlots) => {
  const schedule = new Map(existingSchedule);
  const lastDate = Math.max(...Array.from(schedule.keys()).map(date => new Date(date)));
  const current = new Date(lastDate);
  current.setDate(current.getDate() + 1);
  const end = new Date(newEndDate);

  while (current <= end) {
    const dateKey = current.toISOString().split('T')[0];
    schedule.set(dateKey, timeSlots.map(time => ({
      time,
      available: true,
      booked: false,
      userId: null
    })));
    current.setDate(current.getDate() + 1);
  }

  return schedule;
};

const cleanPastDates = (schedule) => {
  const today = new Date().toISOString().split('T')[0];
  const cleanedSchedule = new Map();

  for (const [date, slots] of schedule) {
    if (date >= today) {
      cleanedSchedule.set(date, slots);
    }
  }

  return cleanedSchedule;
};

module.exports = {
  generateScheduleMap,
  getDefaultTimeSlots,
  extendSchedule,
  cleanPastDates
};
