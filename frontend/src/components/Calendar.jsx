import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import BookingModal from './BookingModal';
import {
  formatDisplayDate,
  formatTime12,
  generateTimeSlots,
  getBookingForSlot,
  isSlotInPast,
  isSlotStartOfBooking,
  SLOT_MINUTES,
  todayString,
} from '../utils/time';

export default function Calendar() {
  const { user, logout, isSupervisor } = useAuth();
  const socket = useSocket();
  const [date, setDate] = useState(todayString());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [actionError, setActionError] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { bookings: data } = await api.getBookings(date);
      setBookings(data);
    } catch (err) {
      setError(err.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!socket) return;

    const onCreated = ({ date: eventDate, booking }) => {
      if (eventDate !== date) return;
      setBookings((prev) => {
        if (prev.some((b) => b.id === booking.id)) return prev;
        return [...prev, booking].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });
    };

    const onDeleted = ({ date: eventDate, bookingId }) => {
      if (eventDate !== date) return;
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    };

    socket.on('booking:created', onCreated);
    socket.on('booking:deleted', onDeleted);

    return () => {
      socket.off('booking:created', onCreated);
      socket.off('booking:deleted', onDeleted);
    };
  }, [socket, date]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val < todayString()) return;
    setDate(val);
  };

  const handleBook = async (payload) => {
    setActionError('');
    try {
      const { booking } = await api.createBooking(payload);
      setBookings((prev) => {
        if (prev.some((b) => b.id === booking.id)) return prev;
        return [...prev, booking].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });
    } catch (err) {
      setActionError(err.message);
      throw err;
    }
  };

  const handleCancel = async (bookingId, override = false) => {
    setActionError('');
    try {
      await api.cancelBooking(bookingId, override);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      setActionError(err.message);
    }
  };

  const timeRows = generateTimeSlots().slice(0, -1);

  const stats = useMemo(() => {
    let booked = 0;
    let past = 0;

    timeRows.forEach((slot) => {
      const slotStart = slot.hour * 60 + slot.minute;
      const slotEnd = slotStart + SLOT_MINUTES;
      if (isSlotInPast(date, slot.hour, slot.minute)) {
        past += 1;
      } else if (getBookingForSlot(bookings, slotStart, slotEnd)) {
        booked += 1;
      }
    });

    const total = timeRows.length;
    const available = total - booked - past;
    const utilization = total > 0 ? Math.round((booked / total) * 100) : 0;

    return { total, booked, available, past, utilization };
  }, [bookings, date, timeRows]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Premium Conference Room</h1>
            <p className="text-xs text-gray-500">{user.name} · {user.role}</p>
          </div>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{formatDisplayDate(date)}</h2>
            <p className="text-xs text-gray-500">9:00 AM – 6:00 PM</p>
          </div>
          <input
            type="date"
            value={date}
            min={todayString()}
            onChange={handleDateChange}
            className="px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        {(actionError || error) && (
          <div className="mb-4 bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200">
            {actionError || error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total slots</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-2xl font-semibold text-red-600">{stats.booked}</p>
            <p className="text-xs text-gray-500 mt-0.5">Booked</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <p className="text-2xl font-semibold text-green-700">{stats.available}</p>
            <p className="text-xs text-gray-500 mt-0.5">Available</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Room utilization</span>
            <span>{stats.utilization}% booked · {stats.past} past</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="bg-red-400 h-full transition-all"
              style={{ width: `${(stats.booked / stats.total) * 100}%` }}
            />
            <div
              className="bg-gray-300 h-full transition-all"
              style={{ width: `${(stats.past / stats.total) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
                  <th className="px-4 py-2.5 w-28 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 w-36 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeRows.map((slot) => {
                  const slotStart = slot.hour * 60 + slot.minute;
                  const slotEnd = slotStart + SLOT_MINUTES;
                  const booking = getBookingForSlot(bookings, slotStart, slotEnd);
                  const isReserved = !!booking;
                  const isStart = isSlotStartOfBooking(booking, slotStart);
                  const isOwn = booking?.userId === user.id;
                  const isPast = isSlotInPast(date, slot.hour, slot.minute);

                  return (
                    <tr
                      key={`${slot.hour}-${slot.minute}`}
                      className={isPast ? 'bg-gray-50 text-gray-400' : isReserved ? 'bg-red-50/50' : ''}
                    >
                      <td className="px-4 py-3 font-medium text-gray-700">{slot.label}</td>
                      <td className="px-4 py-3">
                        {isPast ? (
                          <span className="text-gray-400">Past</span>
                        ) : isReserved ? (
                          isStart ? (
                            <span className="text-gray-800">
                              Booked by {booking.userName}
                              <span className="text-gray-500 ml-1">
                                ({formatTime12(booking.startTime)}–{formatTime12(booking.endTime)})
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">—</span>
                          )
                        ) : (
                          <span className="text-green-700">Available</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isPast && isReserved && isStart && (
                          <div className="flex justify-end gap-2">
                            {isOwn && (
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            )}
                            {isSupervisor && !isOwn && (
                              <button
                                onClick={() => handleCancel(booking.id, true)}
                                className="text-xs px-2.5 py-1 rounded border border-amber-400 text-amber-800 hover:bg-amber-50"
                              >
                                Override
                              </button>
                            )}
                          </div>
                        )}
                        {!isPast && !isReserved && (
                          <button
                            onClick={() => setSelectedSlot(slot)}
                            className="text-xs px-2.5 py-1 rounded bg-gray-800 text-white hover:bg-gray-900"
                          >
                            Book
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          date={date}
          onClose={() => setSelectedSlot(null)}
          onBook={handleBook}
        />
      )}
    </div>
  );
}
