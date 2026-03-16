import { getData } from '../lib/kv.js';

// This endpoint is called by Vercel Cron daily
// It backs up data to a private GitHub repository

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

    // Get last backup hash to check for changes
    const currentHash = await hashData(data);
    const lastHash = await getLastBackupHash();

    if (currentHash === lastHash) {
      return res.status(200).json({
        message: 'No changes since last backup',
        entries: data.length,
        skipped: true
      });
    }

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];

    // Generate backup files
    const csv = generateCSV(data);
    const json = JSON.stringify(data, null, 2);

    // Commit to GitHub
    await commitToGitHub(csv, json, dateStr, data.length);

    // Save hash for next comparison
    await saveBackupHash(currentHash);

    return res.status(200).json({
      success: true,
      timestamp,
      entries: data.length,
      message: `Backup committed to GitHub: ${dateStr}`
    });

  } catch (error) {
    console.error('Backup failed:', error);
    return res.status(500).json({
      error: 'Backup failed',
      message: error.message
    });
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

async function hashData(data) {
  // Create a hash of the data to detect changes
  const str = JSON.stringify(data.map(e => ({
    s: e.systolic,
    d: e.diastolic,
    p: e.pulse,
    t: e.timestamp
  })));

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getLastBackupHash() {
  try {
    const { Redis } = await import('@upstash/redis');
    const isLocal = !(process.env.UPSTASH_REDIS_REST_URL || process.env.BP_KV_REST_API_URL);
    if (isLocal) return null;

    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.BP_KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.BP_KV_REST_API_TOKEN;
    const redis = new Redis({ url, token });

    return await redis.get('last-backup-hash');
  } catch (error) {
    console.error('Failed to get last backup hash:', error);
    return null;
  }
}

async function saveBackupHash(hash) {
  try {
    const { Redis } = await import('@upstash/redis');
    const isLocal = !(process.env.UPSTASH_REDIS_REST_URL || process.env.BP_KV_REST_API_URL);
    if (isLocal) return;

    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.BP_KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.BP_KV_REST_API_TOKEN;
    const redis = new Redis({ url, token });

    await redis.set('last-backup-hash', hash);
  } catch (error) {
    console.error('Failed to save backup hash:', error);
  }
}

async function commitToGitHub(csv, json, dateStr, entryCount) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_BACKUP_REPO; // format: "username/repo-name"

  if (!token || !repo) {
    throw new Error('GitHub credentials not configured');
  }

  const [owner, repoName] = repo.split('/');
  
  // Verify repository exists
  const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!repoCheck.ok) {
    const error = await repoCheck.text();
    throw new Error(`Cannot access repository ${repo}: ${repoCheck.status} - ${error}`);
  }

  const baseUrl = `https://api.github.com/repos/${owner}/${repoName}/contents`;

  // Upload CSV file
  await uploadFile(
    `${baseUrl}/${dateStr}.csv`,
    csv,
    `Backup ${dateStr} - ${entryCount} entries`,
    token
  );

  // Upload JSON file
  await uploadFile(
    `${baseUrl}/${dateStr}.json`,
    json,
    `Backup ${dateStr} - ${entryCount} entries (JSON)`,
    token
  );
}

async function uploadFile(url, content, message, token) {
  // Check if file exists
  let sha = null;
  try {
    const check = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (check.ok) {
      const existing = await check.json();
      sha = existing.sha;
    }
  } catch (error) {
    // File doesn't exist, that's ok
  }

  // Upload file
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      ...(sha && { sha }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }
}
