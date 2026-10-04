import { getEntries, saveEntries } from '../lib/kv.js';
import { createHandler } from '../lib/handler.js';
import { parseReading, isValidTimestamp } from '../lib/entries.js';

// Compare as strings so ids stored as floats by older imports still match
const findIndex = (entries, id) => entries.findIndex(e => String(e.id) === String(id));

export default createHandler({
  async PATCH(req, res) {
    const body = req.body ?? {};
    const changes = parseReading(body, { partial: true });
    if (!changes || (body.timestamp !== undefined && !isValidTimestamp(body.timestamp))) {
      return res.status(400).json({ error: 'Invalid reading values' });
    }
    if (body.timestamp !== undefined) changes.timestamp = new Date(body.timestamp).toISOString();

    const entries = await getEntries();
    const index = findIndex(entries, req.query.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    entries[index] = { ...entries[index], ...changes };
    await saveEntries(entries);
    res.status(200).json(entries[index]);
  },

  async DELETE(req, res) {
    const entries = await getEntries();
    const index = findIndex(entries, req.query.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    entries.splice(index, 1);
    await saveEntries(entries);
    res.status(200).json({ message: 'Entry deleted' });
  },
});
