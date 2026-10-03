import { createHash, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';

const getSecret = () => process.env.JWT_SECRET || process.env.PWORD;

export function checkPassword(password) {
  const expected = process.env.PWORD;
  if (!expected || typeof password !== 'string') return false;
  // Hash both sides so the comparison is constant-time regardless of length
  const digest = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(password), digest(expected));
}

export function generateToken() {
  return jwt.sign({ authenticated: true }, getSecret(), { expiresIn: '7d' });
}

export function verifyAuth(req) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return false;
  try {
    jwt.verify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
