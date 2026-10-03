import { createHash } from 'crypto';
import { getEntries, getValue, setValue } from '../lib/kv.js';

const HASH_KEY = 'last-backup-hash';

// Called daily by Vercel Cron: commits the entries as JSON to a private GitHub
// repository, skipping the commit when nothing changed since the last backup.
export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const entries = await getEntries();
    if (entries.length === 0) {
      return res.status(200).json({ message: 'No data to backup', entries: 0 });
    }

    const json = JSON.stringify(entries, null, 2);
    const hash = createHash('sha256').update(json).digest('hex');
    if (hash === await getValue(HASH_KEY)) {
      return res.status(200).json({ message: 'No changes since last backup', entries: entries.length, skipped: true });
    }

    const date = new Date().toISOString().split('T')[0];
    await commitToGitHub(`${date}.json`, json, `Backup ${date} - ${entries.length} entries`);
    await setValue(HASH_KEY, hash);

    res.status(200).json({ message: `Backup committed to GitHub: ${date}`, entries: entries.length });
  } catch (error) {
    console.error('Backup failed:', error);
    res.status(500).json({ error: 'Backup failed', message: error.message });
  }
}

async function commitToGitHub(path, content, message) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_BACKUP_REPO; // "owner/repo"
  if (!token || !repo) {
    throw new Error('GitHub credentials not configured (GITHUB_TOKEN, GITHUB_BACKUP_REPO)');
  }

  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  // Overwriting an existing file (a second backup on the same day) requires its sha
  const existing = await fetch(url, { headers });
  const sha = existing.ok ? (await existing.json()).sha : undefined;

  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), sha }),
  });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} - ${await response.text()}`);
  }
}
