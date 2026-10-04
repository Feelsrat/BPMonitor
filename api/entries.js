import { getEntries, saveEntries } from './lib/kv.js';
import { createHandler } from './lib/handler.js';
import { parseReading, isValidTimestamp, idGenerator } from './lib/entries.js';

export default createHandler({
  async GET(req, res) {
    res.status(200).json(await getEntries());
  },

  async POST(req, res) {
    const body = req.body ?? {};
    const reading = parseReading(body);
    if (!reading) {
      return res.status(400).json({ error: 'Systolic, diastolic and pulse must be valid numbers' });
    }
    // Optional, to record a reading taken earlier
    if (body.timestamp !== undefined && !isValidTimestamp(body.timestamp)) {
      return res.status(400).json({ error: 'Invalid timestamp' });
    }

    const entries = await getEntries();
    const entry = {
      id: idGenerator(entries)(),
      notes: '',
      ...reading,
      timestamp: new Date(body.timestamp ?? Date.now()).toISOString(),
    };
    entries.push(entry);
    await saveEntries(entries);

    res.status(201).json(entry);
  },
});
