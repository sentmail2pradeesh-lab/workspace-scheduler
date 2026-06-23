import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white text-sm font-medium rounded transition"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
