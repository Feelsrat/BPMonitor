import { getEntries } from './lib/kv.js';
import { createHandler } from './lib/handler.js';

// Read-only data for the shareable /public page. Notes are left out on purpose.
export default createHandler({
  async GET(req, res) {
    const entries = await getEntries();
    res.status(200).json(entries.map(({ id, systolic, diastolic, pulse, timestamp }) =>
      ({ id, systolic, diastolic, pulse, timestamp })));
  },
}, { auth: false });
