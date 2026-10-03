import { getEntries, saveEntries } from '../lib/kv.js';
import { createHandler } from '../lib/handler.js';
import { parseReading, isValidTimestamp, idGenerator, entryKey } from '../lib/entries.js';

export default createHandler({
  async POST(req, res) {
    const { entries: incoming, mode = 'merge' } = req.body ?? {};
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: 'Entries must be an array' });
    }

    const valid = incoming
      .filter(entry => entry && isValidTimestamp(entry.timestamp))
      .map(entry => {
        const reading = parseReading({ notes: '', ...entry });
        return reading && { ...reading, timestamp: new Date(entry.timestamp).toISOString() };
      })
      .filter(Boolean);

    if (valid.length === 0) {
      return res.status(400).json({ error: 'No valid entries found' });
    }

    const existing = mode === 'replace' ? [] : await getEntries();
    const seen = new Set(existing.map(entryKey));
    const nextId = idGenerator(existing);
    const added = [];
    for (const entry of valid) {
      const key = entryKey(entry);
      if (seen.has(key)) continue;
      seen.add(key);
      added.push({ id: nextId(), ...entry });
    }

    const entries = [...existing, ...added];
    await saveEntries(entries);

    const skipped = valid.length - added.length;
    res.status(200).json({
      imported: added.length,
      total: entries.length,
      message: `Imported ${added.length} entries` + (skipped ? ` (${skipped} duplicates skipped)` : ''),
    });
  },
});
