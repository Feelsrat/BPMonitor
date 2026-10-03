import { getEntries, saveEntries } from './lib/kv.js';
import { createHandler } from './lib/handler.js';
import { parseReading, idGenerator } from './lib/entries.js';

export default createHandler({
  async GET(req, res) {
    res.status(200).json(await getEntries());
  },

  async POST(req, res) {
    const reading = parseReading(req.body ?? {});
    if (!reading) {
      return res.status(400).json({ error: 'Systolic, diastolic and pulse must be valid numbers' });
    }

    const entries = await getEntries();
    const entry = {
      id: idGenerator(entries)(),
      notes: '',
      ...reading,
      timestamp: new Date().toISOString(),
    };
    entries.push(entry);
    await saveEntries(entries);

    res.status(201).json(entry);
  },
});
