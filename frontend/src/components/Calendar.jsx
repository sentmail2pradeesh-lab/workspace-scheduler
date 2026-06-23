import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket, useSocketConnected } from '../context/SocketContext';
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

function StatCard({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-slate-900',
    danger: 'text-red-600',
    success: 'text-emerald-700',
  };
  return (
    <div className="card px-5 py-4">
      <p className={`text-2xl font-semibold tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function Calendar() {
  const { user, logout, isSupervisor } = useAuth();
  const socket = useSocket();
  const connected = useSocketConnected();
  const [date, setDate] = useState(todayString());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [actionError, setActionError] = useState('');
  const [cancelingId, setCancelingId] = useState(null);
  const dateRef = useRef(date);

  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  const refreshBookings = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const { bookings: data } = await api.getBookings(dateRef.current);
      setBookings(data);
    } catch (err) {
      setError(err.message);
      setBookings([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBookings(true);
  }, [date, refreshBookings]);

  useEffect(() => {
    if (!socket) return;

    const onScheduleUpdated = ({ date: eventDate, bookings: updated }) => {
      if (eventDate !== dateRef.current) return;
      setBookings(updated);
      setActionError('');
    };

    const onReconnect = () => refreshBookings(false);

    socket.on('schedule:updated', onScheduleUpdated);
    socket.on('connect', onReconnect);

    return () => {
      socket.off('schedule:updated', onScheduleUpdated);
      socket.off('connect', onReconnect);
    };
  }, [socket, refreshBookings]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val < todayString()) return;
    setDate(val);
  };

  const handleBook = async (payload) => {
    setActionError('');
    try {
      await api.createBooking(payload);
      await refreshBookings(false);
    } catch (err) {
      setActionError(err.message);
      throw err;
    }
  };

  const handleCancel = async (bookingId, override = false) => {
    const id = Number(bookingId);
    if (cancelingId === id) return;

    setActionError('');
    setCancelingId(id);

    try {
      await api.cancelBooking(id, override);
      setBookings((prev) => prev.filter((b) => Number(b.id) !== id));
    } catch (err) {
      if (err.message === 'Booking not found') {
        await refreshBookings(false);
        setActionError('This booking was already cancelled.');
      } else {
        setActionError(err.message);
      }
    } finally {
      setCancelingId(null);
    }
  };

  const timeRows = generateTimeSlots().slice(0, -1);

  const stats = useMemo(() => {
    let booked = 0;
    let past = 0;

    timeRows.forEach((slot) => {
      const slotStart = slot.hour * 60 + slot.minute;
      const slotEnd = slotStart + SLOT_MINUTES;
      if (isSlotInPast(date, slot.hour, slot.minute)) past += 1;
      else if (getBookingForSlot(bookings, slotStart, slotEnd)) booked += 1;
    });

    const total = timeRows.length;
    return { total, booked, available: total - booked - past, past };
  }, [bookings, date, timeRows]);

  const utilization = stats.total > 0 ? Math.round((stats.booked / stats.total) * 100) : 0;
  const initials = user.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              WS
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate">Premium Conference Room</h1>
              <p className="text-xs text-slate-500 truncate">Shared workspace scheduler</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              connected
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                : 'text-slate-500 bg-slate-50 border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {connected ? 'Live' : 'Connecting'}
            </span>
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            </div>
            <button type="button" onClick={logout} className="btn-secondary text-sm py-2">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{formatDisplayDate(date)}</h2>
            <p className="text-sm text-slate-500 mt-1">Operating hours: 9:00 AM – 6:00 PM · 30-minute slots</p>
          </div>
          <div>
            <label htmlFor="schedule-date" className="block text-xs font-medium text-slate-500 mb-1.5">Select date</label>
            <input
              id="schedule-date"
              type="date"
              value={date}
              min={todayString()}
              onChange={handleDateChange}
              className="input-field sm:w-auto"
            />
          </div>
        </div>

        {(actionError || error) && (
          <div className="alert-error mb-5">{actionError || error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <StatCard label="Total slots" value={stats.total} />
          <StatCard label="Booked" value={stats.booked} tone="danger" />
          <StatCard label="Available" value={stats.available} tone="success" />
        </div>

        <div className="card px-5 py-4 mb-5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">Room utilization</span>
            <span>{utilization}% booked · {stats.past} past</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-red-400 h-full transition-all duration-300" style={{ width: `${(stats.booked / stats.total) * 100}%` }} />
            <div className="bg-slate-300 h-full transition-all duration-300" style={{ width: `${(stats.past / stats.total) * 100}%` }} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Daily schedule</h3>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-200" /> Available</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-200" /> Reserved</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200" /> Past</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Loading schedule…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 w-32 font-medium">Time</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 w-44 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeRows.map((slot) => {
                    const slotStart = slot.hour * 60 + slot.minute;
                    const slotEnd = slotStart + SLOT_MINUTES;
                    const booking = getBookingForSlot(bookings, slotStart, slotEnd);
                    const isReserved = !!booking;
                    const isStart = isSlotStartOfBooking(booking, slotStart);
                    const isOwn = Number(booking?.userId) === Number(user.id);
                    const isPast = isSlotInPast(date, slot.hour, slot.minute);
                    const isCanceling = booking && cancelingId === Number(booking.id);

                    return (
                      <tr
                        key={`${slot.hour}-${slot.minute}`}
                        className={isPast ? 'bg-slate-50/80' : isReserved ? 'bg-red-50/40' : 'hover:bg-slate-50/60'}
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">{slot.label}</td>
                        <td className="px-5 py-3.5">
                          {isPast ? (
                            <span className="text-slate-400">Past</span>
                          ) : isReserved ? (
                            isStart ? (
                              <div>
                                <span className="inline-flex items-center gap-1.5 text-red-700 font-medium">Reserved</span>
                                <p className="text-slate-600 mt-0.5">
                                  {booking.userName}
                                  <span className="text-slate-400"> · {formatTime12(booking.startTime)}–{formatTime12(booking.endTime)}</span>
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )
                          ) : (
                            <span className="text-emerald-700 font-medium">Available</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {!isPast && isReserved && isStart && (
                            <div className="flex justify-end gap-2">
                              {isOwn && (
                                <button type="button" disabled={isCanceling} onClick={() => handleCancel(booking.id)} className="btn-danger">
                                  {isCanceling ? 'Cancelling…' : 'Cancel'}
                                </button>
                              )}
                              {isSupervisor && !isOwn && (
                                <button type="button" disabled={isCanceling} onClick={() => handleCancel(booking.id, true)} className="btn-warning">
                                  {isCanceling ? 'Cancelling…' : 'Cancel Override'}
                                </button>
                              )}
                            </div>
                          )}
                          {!isPast && !isReserved && (
                            <button type="button" onClick={() => setSelectedSlot(slot)} className="btn-primary text-xs py-1.5 px-3">
                              Book
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
