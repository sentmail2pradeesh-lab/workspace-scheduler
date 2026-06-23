const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getBookingsByDate,
  createBooking,
  deleteBooking,
} = require('../services/bookings');

const router = express.Router();

function formatBooking(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date instanceof Date
      ? row.date.toISOString().slice(0, 10)
      : String(row.date).slice(0, 10),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    userName: row.user_name,
    userEmail: row.user_email,
    createdAt: row.created_at,
  };
}

router.get('/', authenticate, async (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Valid date query param required (YYYY-MM-DD)' });
  }

  try {
    const rows = await getBookingsByDate(date);
    res.json({ bookings: rows.map(formatBooking) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to fetch bookings' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { date, startTime, endTime } = req.body;

  if (!date || !startTime || !endTime) {
    return res.status(400).json({ error: 'date, startTime, and endTime are required' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD)' });
  }

  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return res.status(400).json({ error: 'Invalid time format (HH:MM)' });
  }

  try {
    const row = await createBooking({
      userId: req.user.id,
      date,
      startTime,
      endTime,
    });

    const full = await getBookingsByDate(date);
    const created = full.find((b) => b.id === row.id);

    const booking = formatBooking(created || { ...row, user_name: req.user.name, user_email: req.user.email });
    req.app.get('io').emit('booking:created', { date, booking });
    res.status(201).json({ booking });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to create booking' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  const override = req.query.override === 'true';

  if (Number.isNaN(bookingId)) {
    return res.status(400).json({ error: 'Invalid booking id' });
  }

  try {
    const deleted = await deleteBooking({
      bookingId,
      userId: req.user.id,
      role: req.user.role,
      override,
    });

    const date = deleted.date instanceof Date
      ? deleted.date.toISOString().slice(0, 10)
      : String(deleted.date).slice(0, 10);

    req.app.get('io').emit('booking:deleted', {
      date,
      bookingId: deleted.id,
    });

    res.json({ success: true, bookingId: deleted.id });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to delete booking' });
  }
});

module.exports = router;
