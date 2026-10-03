import { verifyAuth } from './auth.js';

// Wraps a Vercel function: dispatches by HTTP method, enforces auth and turns
// thrown errors into 500 responses instead of crashing the function.
export function createHandler(methods, { auth = true } = {}) {
  return async (req, res) => {
    const method = methods[req.method];
    if (!method) {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (auth && !verifyAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    try {
      await method(req, res);
    } catch (error) {
      console.error(`${req.method} ${req.url} failed:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
