export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateRegisterForm(form) {
  const errors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const mobile = form.mobile.trim();

  if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (mobile && !/^\d{10,15}$/.test(mobile.replace(/\D/g, ''))) {
    errors.mobile = 'Mobile must be 10–15 digits';
  }
  if (!['Standard', 'Supervisor'].includes(form.role)) {
    errors.role = 'Select a valid role';
  }

  return errors;
}

export function validateLoginForm(email, password) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}
