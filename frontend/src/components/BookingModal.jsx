import { useState } from 'react';
import { formatTime12, toTimeString } from '../utils/time';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-full max-w-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-medium text-gray-900">Book slot</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {date} · {formatTime12(startTime)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">End time</label>
            <select
              value={`${endHour}:${endMinute}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                setEndHour(h);
                setEndMinute(m);
              }}
              className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
            >
              {endOptions.map((opt) => (
                <option key={`${opt.hour}-${opt.minute}`} value={`${opt.hour}:${opt.minute}`}>
                  {formatTime12(toTimeString(opt.hour, opt.minute))}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 disabled:opacity-60"
            >
              {loading ? 'Booking…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
