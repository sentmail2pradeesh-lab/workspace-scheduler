import { useState } from 'react';
import { formatDisplayDate, formatTime12, toTimeString } from '../utils/time';

export default function BookingModal({ slot, date, onClose, onBook }) {
  const defaultEndHour = slot.hour + (slot.minute === 30 ? 1 : 0);
  const defaultEndMinute = slot.minute === 0 ? 30 : 0;

  const [endHour, setEndHour] = useState(defaultEndHour);
  const [endMinute, setEndMinute] = useState(defaultEndMinute);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startTime = toTimeString(slot.hour, slot.minute);
  const endTime = toTimeString(endHour, endMinute);

  const startMins = slot.hour * 60 + slot.minute;
  const endOptions = [];
  for (let mins = startMins + 30; mins <= 18 * 60; mins += 30) {
    endOptions.push({ hour: Math.floor(mins / 60), minute: mins % 60 });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onBook({ date, startTime, endTime });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="card shadow-panel w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Reserve conference room</h2>
          <p className="text-sm text-slate-500 mt-1">
            {formatDisplayDate(date)} · starting {formatTime12(startTime)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="alert-error">{error}</div>}

          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-slate-700 mb-1.5">
              End time
            </label>
            <select
              id="end-time"
              value={`${endHour}:${endMinute}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                setEndHour(h);
                setEndMinute(m);
              }}
              className="input-field"
            >
              {endOptions.map((opt) => (
                <option key={`${opt.hour}-${opt.minute}`} value={`${opt.hour}:${opt.minute}`}>
                  {formatTime12(toTimeString(opt.hour, opt.minute))}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">Minimum duration is 30 minutes.</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Close
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
