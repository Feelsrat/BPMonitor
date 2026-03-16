import { getData, saveData } from '../lib/kv.js';
import { verifyAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  const auth = verifyAuth(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const { systolic, diastolic, pulse, notes } = req.body;
    const data = await getData();
    const entryIndex = data.findIndex(e => e.id === parseInt(id));

    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    data[entryIndex] = {
      ...data[entryIndex],
      ...(systolic && { systolic: parseInt(systolic) }),
      ...(diastolic && { diastolic: parseInt(diastolic) }),
      ...(pulse && { pulse: parseInt(pulse) }),
      ...(notes !== undefined && { notes })
    };

    await saveData(data);
    return res.status(200).json(data[entryIndex]);
  }

  if (req.method === 'DELETE') {
    let data = await getData();
    data = data.filter(e => e.id !== parseInt(id));
    await saveData(data);

    return res.status(200).json({ message: 'Entry deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
