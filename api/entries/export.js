import { getData } from '../lib/kv.js';
import { verifyAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = verifyAuth(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  const data = await getData();

  let csv = 'Systolic,Diastolic,Pulse,Notes,Timestamp\n';
  data.forEach(entry => {
    csv += `${entry.systolic},${entry.diastolic},${entry.pulse},"${entry.notes}",${entry.timestamp}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bp-data.csv"');
  res.status(200).send(csv);
}
