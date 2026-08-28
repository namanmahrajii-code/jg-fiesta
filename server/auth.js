const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rock-on-cafe-super-secret-key-2026-xyz';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role || 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken,
  requireAdmin
};
