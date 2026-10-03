import { getEntries } from '../lib/kv.js';
import { createHandler } from '../lib/handler.js';

const csvField = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default createHandler({
  async GET(req, res) {
    const entries = await getEntries();
    const rows = entries.map(e =>
      [e.systolic, e.diastolic, e.pulse, csvField(e.notes), e.timestamp].join(','));
    const csv = ['Systolic,Diastolic,Pulse,Notes,Timestamp', ...rows].join('\n') + '\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bp-data.csv"');
    res.status(200).send(csv);
  },
});
