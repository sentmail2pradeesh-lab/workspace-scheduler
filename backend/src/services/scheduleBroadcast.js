const { formatDateString } = require('../utils/date');
const { getBookingsByDate } = require('./bookings');

function formatBooking(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: formatDateString(row.date),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    userName: row.user_name,
    userEmail: row.user_email,
    createdAt: row.created_at,
  };
}

async function broadcastSchedule(io, date) {
  const dateStr = formatDateString(date);
  const rows = await getBookingsByDate(dateStr);
  io.emit('schedule:updated', {
    date: dateStr,
    bookings: rows.map(formatBooking),
  });
}

module.exports = { formatBooking, broadcastSchedule };
