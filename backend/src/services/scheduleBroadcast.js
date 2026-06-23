const { formatDateString } = require('../utils/date');
const { fetchBookingsForDate } = require('./bookings');

function formatBooking(row) {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    date: formatDateString(row.date),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    userName: row.user_name,
    userEmail: row.user_email,
    createdAt: row.created_at,
  };
}

async function broadcastSchedule(io, date) {
  if (!io) {
    console.error('Socket.io not available for broadcast');
    return;
  }

  try {
    const dateStr = formatDateString(date);
    const rows = await fetchBookingsForDate(dateStr);
    io.emit('schedule:updated', {
      date: dateStr,
      bookings: rows.map(formatBooking),
    });
  } catch (err) {
    console.error('Schedule broadcast failed:', err.message);
  }
}

module.exports = { formatBooking, broadcastSchedule };
