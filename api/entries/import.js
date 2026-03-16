import { getData, saveData } from '../lib/kv.js';
import { verifyAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyAuth(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  const { entries, mode } = req.body; // mode: 'replace' or 'merge'

  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: 'Entries must be an array' });
  }

  // Validate entries
  const validEntries = entries.filter(entry => {
    return entry.systolic && entry.diastolic && entry.pulse && entry.timestamp;
  }).map(entry => ({
    id: entry.id || Date.now() + Math.random(),
    systolic: parseInt(entry.systolic),
    diastolic: parseInt(entry.diastolic),
    pulse: parseInt(entry.pulse),
    notes: entry.notes || '',
    timestamp: entry.timestamp
  }));

  if (validEntries.length === 0) {
    return res.status(400).json({ error: 'No valid entries found' });
  }

  let data;
  if (mode === 'replace') {
    data = validEntries;
  } else {
    // Merge mode - combine with existing data, avoiding duplicates by timestamp + values
    const existing = await getData();
    const existingSet = new Set(existing.map(e => `${e.timestamp}-${e.systolic}-${e.diastolic}-${e.pulse}`));
    
    data = [
      ...existing,
      ...validEntries.filter(e => !existingSet.has(`${e.timestamp}-${e.systolic}-${e.diastolic}-${e.pulse}`))
    ];
  }

  await saveData(data);
  const result = await getData();

  return res.status(200).json({
    success: true,
    imported: validEntries.length,
    total: result.length,
    message: `Successfully imported ${validEntries.length} entries`
  });
}
