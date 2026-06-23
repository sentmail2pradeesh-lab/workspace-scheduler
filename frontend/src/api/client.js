const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  requestOtp: (payload) =>
    request('/auth/register/request-otp', { method: 'POST', body: JSON.stringify(payload) }),

  verifyOtp: (payload) =>
    request('/auth/register/verify', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () => request('/auth/me'),

  getBookings: (date) => request(`/bookings?date=${date}`),

  createBooking: (payload) =>
    request('/bookings', { method: 'POST', body: JSON.stringify(payload) }),

  cancelBooking: (id, override = false) =>
    request(`/bookings/${id}${override ? '?override=true' : ''}`, { method: 'DELETE' }),
};
