import { generateToken } from './lib/auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  const PASSWORD = process.env.PWORD || 'defaultpassword';

  if (password !== PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = generateToken();
  res.status(200).json({ success: true, token });
}
