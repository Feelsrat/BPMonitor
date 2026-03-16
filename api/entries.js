import { getData, saveData } from './lib/kv.js';
import { verifyAuth } from './lib/auth.js';

export default async function handler(req, res) {
  // Allow GET without auth for health check, but require auth for actual data
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyAuth(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  if (req.method === 'GET') {
    const data = await getData();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { systolic, diastolic, pulse, category, notes } = req.body;

    if (!systolic || !diastolic || !pulse) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const data = await getData();
    const newEntry = {
      id: Date.now(),
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      pulse: parseInt(pulse),
      category: category || '',
      notes: notes || '',
      timestamp: new Date().toISOString()
    };

    data.push(newEntry);
    await saveData(data);

    return res.status(201).json(newEntry);
  }
}
