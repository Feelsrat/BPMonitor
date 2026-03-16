import jwt from 'jsonwebtoken';

export function verifyAuth(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return { valid: false, error: 'Unauthorized. Please log in.' };
  }
  
  try {
    const secret = process.env.JWT_SECRET || process.env.PWORD || 'defaultpassword';
    jwt.verify(token, secret);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Unauthorized. Invalid or expired token.' };
  }
}

export function generateToken() {
  const secret = process.env.JWT_SECRET || process.env.PWORD || 'defaultpassword';
  return jwt.sign({ authenticated: true }, secret, { expiresIn: '7d' });
}
