import { checkPassword, generateToken } from './lib/auth.js';
import { createHandler } from './lib/handler.js';

export default createHandler({
  POST(req, res) {
    if (!process.env.PWORD) {
      return res.status(500).json({ error: 'Server password is not configured (set PWORD).' });
    }
    if (!checkPassword(req.body?.password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.status(200).json({ token: generateToken() });
  },
}, { auth: false });
