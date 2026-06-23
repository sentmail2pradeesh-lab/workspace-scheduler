import { useState } from 'react';
import { validateLoginForm } from '../utils/validation';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = validateLoginForm(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-1">Sign in to manage your bookings</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`input-field ${fieldErrors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
          placeholder="you@company.com"
        />
        {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`input-field ${fieldErrors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
          placeholder="Enter your password"
        />
        {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
