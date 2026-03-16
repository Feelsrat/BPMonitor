import { getData } from '../lib/kv.js';

// This endpoint is called by Vercel Cron
// It creates a backup and can send it via email or webhook

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron (security)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = await getData();
    
    if (data.length === 0) {
      return res.status(200).json({ message: 'No data to backup', entries: 0 });
    }

    const timestamp = new Date().toISOString();
    
    // Convert to CSV format
    const csv = generateCSV(data);
    
    // Option 1: Send backup via email (requires email service)
    if (process.env.BACKUP_EMAIL) {
      await sendEmail(process.env.BACKUP_EMAIL, csv, timestamp);
    }
    
    // Option 2: Send to webhook (like Dropbox, Google Drive, etc.)
    if (process.env.BACKUP_WEBHOOK_URL) {
      await sendToWebhook(process.env.BACKUP_WEBHOOK_URL, data, csv, timestamp);
    }
    
    // Option 3: Just return the data (you can manually download)
    return res.status(200).json({
      success: true,
      timestamp,
      entries: data.length,
      backup: {
        csv,
        json: data
      }
    });
    
  } catch (error) {
    console.error('Backup failed:', error);
    return res.status(500).json({ error: 'Backup failed', message: error.message });
  }
}

function generateCSV(data) {
  const header = 'Systolic,Diastolic,Pulse,Notes,Timestamp\n';
  const rows = data.map(entry => {
    const notes = (entry.notes || '').replace(/"/g, '""');
    return `${entry.systolic},${entry.diastolic},${entry.pulse},"${notes}",${entry.timestamp}`;
  }).join('\n');
  
  return header + rows;
}

async function sendEmail(email, csv, timestamp) {
  // Implement with SendGrid, Resend, or other email service
  // Example: await resend.emails.send({ to: email, ... })
  console.log(`Would send backup to ${email}`);
}

async function sendToWebhook(url, jsonData, csv, timestamp) {
  // Send backup to external service
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp,
      entries: jsonData.length,
      csv,
      json: jsonData
    })
  });
  
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
}
