import { useState } from 'react';
import { api } from '../api/client';
import { validateRegisterForm } from '../utils/validation';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

export default function RegisterForm({ onRegister }) {
  const [step, setStep] = useState('details');
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Standard',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    };
    if (form.mobile.trim()) payload.mobile = form.mobile.trim();
    return payload;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const errors = validateRegisterForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const res = await api.requestOtp(buildPayload());
      setSuccess(res.message || 'Verification code sent to your email');
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
    if (otp.length !== 6) {
      setError('Enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      await onRegister({ email: form.email.trim().toLowerCase(), otp });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.requestOtp(buildPayload());
      setSuccess(res.message || 'A new code has been sent');
      setOtp('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerify} className="space-y-5" noValidate>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Verify your email</h2>
          <p className="text-sm text-slate-500 mt-1">
            Enter the code sent to <span className="font-medium text-slate-800">{form.email.trim()}</span>
          </p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1.5">
            Verification code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="input-field text-center text-xl tracking-[0.4em] font-mono"
            placeholder="000000"
          />
        </div>

        <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full">
          {loading ? 'Verifying…' : 'Create account'}
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => { setStep('details'); setOtp(''); setError(''); setSuccess(''); }}
            className="text-slate-500 hover:text-slate-800"
          >
            Back
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleResend}
            className="text-slate-700 hover:text-slate-900 font-medium disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Create an account</h2>
        <p className="text-sm text-slate-500 mt-1">Register with email verification</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div>
        <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full name</label>
        <input id="reg-name" type="text" value={form.name} onChange={update('name')} className="input-field" />
        <FieldError message={fieldErrors.name} />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
        <input id="reg-email" type="email" value={form.email} onChange={update('email')} className="input-field" placeholder="you@company.com" />
        <FieldError message={fieldErrors.email} />
      </div>

      <div>
        <label htmlFor="reg-mobile" className="block text-sm font-medium text-slate-700 mb-1.5">
          Mobile <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input id="reg-mobile" type="tel" value={form.mobile} onChange={update('mobile')} className="input-field" placeholder="9876543210" />
        <FieldError message={fieldErrors.mobile} />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
        <input id="reg-password" type="password" value={form.password} onChange={update('password')} className="input-field" placeholder="Minimum 6 characters" />
        <FieldError message={fieldErrors.password} />
      </div>

      <div>
        <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 mb-1.5">Account role</label>
        <select id="reg-role" value={form.role} onChange={update('role')} className="input-field">
          <option value="Standard">Standard — book and cancel own slots</option>
          <option value="Supervisor">Supervisor — can cancel any booking</option>
        </select>
        <FieldError message={fieldErrors.role} />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Sending code…' : 'Send verification code'}
      </button>
    </form>
  );
}
