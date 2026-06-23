const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireSupervisor(req, res, next) {
  if (req.user?.role !== 'Supervisor') {
    return res.status(403).json({ error: 'Supervisor access required' });
  }
  next();
}

module.exports = { authenticate, requireSupervisor };
