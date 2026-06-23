import { useState } from 'react';
import { api } from '../api/client';

export default function RegisterForm({ onRegister }) {
  const [step, setStep] = useState('details');
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Standard',
  });
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const buildPayload = () => {
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };
    if (form.mobile.trim()) payload.mobile = form.mobile.trim();
    return payload;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.requestOtp(buildPayload());
      if (res.devOtp) setDevOtp(res.devOtp);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onRegister({ email: form.email, otp });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-gray-600">
          Enter the 6-digit code sent to <span className="font-medium text-gray-800">{form.email}</span>
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200">
            {error}
          </div>
        )}

        {devOtp && (
          <div className="bg-yellow-50 text-yellow-800 text-sm px-3 py-2 rounded border border-yellow-200">
            Dev OTP: <span className="font-mono font-medium">{devOtp}</span>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-700 mb-1">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-center text-lg tracking-widest font-mono"
            placeholder="000000"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white text-sm font-medium rounded transition"
        >
          {loading ? 'Verifying…' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => { setStep('details'); setOtp(''); setError(''); }}
          className="w-full text-sm text-gray-500 hover:text-gray-700"
        >
          Back
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestOtp} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-700 mb-1">Full name</label>
        <input
          type="text"
          value={form.name}
          onChange={update('name')}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={update('email')}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Mobile <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          value={form.mobile}
          onChange={update('mobile')}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
          placeholder="9876543210"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={form.password}
          onChange={update('password')}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
          minLength={6}
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Role</label>
        <select
          value={form.role}
          onChange={update('role')}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-sm bg-white"
        >
          <option value="Standard">Standard</option>
          <option value="Supervisor">Supervisor</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">Supervisors can cancel any booking.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white text-sm font-medium rounded transition"
      >
        {loading ? 'Sending code…' : 'Send verification code'}
      </button>
    </form>
  );
}
