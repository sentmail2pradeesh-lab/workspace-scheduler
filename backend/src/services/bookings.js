const pool = require('../db/pool');

const WORK_START = '09:00';
const WORK_END = '18:00';

function isWithinWorkHours(startTime, endTime) {
  return startTime >= WORK_START && endTime <= WORK_END && startTime < endTime;
}

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function currentTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function validateBookingDateTime(date, startTime) {
  const today = todayDateString();
  if (date < today) {
    const err = new Error('Cannot book slots on past dates');
    err.status = 400;
    throw err;
  }
  if (date === today && startTime < currentTimeString()) {
    const err = new Error('Cannot book slots in the past');
    err.status = 400;
    throw err;
  }
}

async function getBookingsByDate(date) {
  if (date < todayDateString()) {
    const err = new Error('Cannot view schedules for past dates');
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    `SELECT b.id, b.user_id, b.date, b.start_time, b.end_time, b.created_at,
            u.name AS user_name, u.email AS user_email
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     WHERE b.date = $1
     ORDER BY b.start_time`,
    [date]
  );
  return result.rows;
}

async function createBooking({ userId, date, startTime, endTime }) {
  validateBookingDateTime(date, startTime);

  if (!isWithinWorkHours(startTime, endTime)) {
    const err = new Error(`Bookings must be between ${WORK_START} and ${WORK_END}`);
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const overlap = await client.query(
      `SELECT id FROM bookings
       WHERE date = $1
         AND start_time < $3::time
         AND end_time > $2::time
       FOR UPDATE`,
      [date, startTime, endTime]
    );

    if (overlap.rows.length > 0) {
      const err = new Error('This time slot overlaps with an existing booking');
      err.status = 409;
      throw err;
    }

    const result = await client.query(
      `INSERT INTO bookings (user_id, date, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, date, start_time, end_time, created_at`,
      [userId, date, startTime, endTime]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function deleteBooking({ bookingId, userId, role, override = false }) {
  const existing = await pool.query(
    `SELECT b.*, u.name AS user_name
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     WHERE b.id = $1`,
    [bookingId]
  );

  if (existing.rows.length === 0) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }

  const booking = existing.rows[0];
  const isOwner = booking.user_id === userId;
  const isSupervisorOverride = override && role === 'Supervisor';

  if (!isOwner && !isSupervisorOverride) {
    const err = new Error('You can only cancel your own bookings');
    err.status = 403;
    throw err;
  }

  await pool.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
  return booking;
}

module.exports = {
  WORK_START,
  WORK_END,
  todayDateString,
  getBookingsByDate,
  createBooking,
  deleteBooking,
};
