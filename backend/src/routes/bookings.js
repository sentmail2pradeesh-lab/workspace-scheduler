const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getBookingsByDate,
  createBooking,
  deleteBooking,
} = require('../services/bookings');
const { formatBooking, broadcastSchedule } = require('../services/scheduleBroadcast');

const router = express.Router();

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
    const booking = formatBooking(
      created || { ...row, user_name: req.user.name, user_email: req.user.email }
    );

    const io = req.app.get('io');
    await broadcastSchedule(io, date);

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

    const io = req.app.get('io');
    await broadcastSchedule(io, deleted.date);

    res.json({
      success: true,
      bookingId: deleted.id,
      override,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Failed to delete booking' });
  }
});

module.exports = router;
