export const WORK_START = 9;
export const WORK_END = 18;
export const SLOT_MINUTES = 30;

export function formatHour(hour) {
  if (hour === 0 || hour === 24) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

export function formatTime12(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function toTimeString(hour, minute = 0) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function currentTimeMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function isSlotInPast(date, slotHour, slotMinute) {
  if (date > todayString()) return false;
  if (date < todayString()) return true;
  return slotHour * 60 + slotMinute < currentTimeMinutes();
}

export function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function generateTimeSlots() {
  const slots = [];
  for (let h = WORK_START; h < WORK_END; h++) {
    slots.push({ hour: h, minute: 0, label: formatHour(h) });
    slots.push({ hour: h, minute: 30, label: formatTime12(toTimeString(h, 30)) });
  }
  slots.push({ hour: WORK_END, minute: 0, label: formatHour(WORK_END) });
  return slots;
}

export function getBookingForSlot(bookings, slotStart, slotEnd) {
  return bookings.find((b) => {
    const bStart = parseTime(b.startTime);
    const bEnd = parseTime(b.endTime);
    return timesOverlap(slotStart, slotEnd, bStart, bEnd);
  });
}

export function isSlotStartOfBooking(booking, slotStart) {
  return booking && parseTime(booking.startTime) === slotStart;
}

export function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
