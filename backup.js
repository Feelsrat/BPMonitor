#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  // Your Vercel deployment URL
  API_URL: process.env.BACKUP_API_URL || 'https://your-app.vercel.app/api',
  
  // Your authentication token (get from browser localStorage after login)
  AUTH_TOKEN: process.env.BACKUP_AUTH_TOKEN || '',
  
  // Backup directory
  BACKUP_DIR: path.join(__dirname, 'backups'),
  
  // Keep last N backups
  MAX_BACKUPS: 30,
};

// Create backup directory if it doesn't exist
async function ensureBackupDir() {
  try {
    await fs.mkdir(CONFIG.BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create backup directory:', error);
    process.exit(1);
  }
}

// Fetch data from API
async function fetchData() {
  if (!CONFIG.AUTH_TOKEN) {
    console.error('❌ No AUTH_TOKEN found. Set BACKUP_AUTH_TOKEN environment variable.');
    console.log('   Get your token from browser DevTools → Application → localStorage → authToken');
    process.exit(1);
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/entries/`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Failed to fetch data:', error.message);
    process.exit(1);
  }
}

// Convert data to CSV
function toCSV(data) {
  const header = 'Systolic,Diastolic,Pulse,Notes,Timestamp\n';
  const rows = data.map(entry => {
    const notes = (entry.notes || '').replace(/"/g, '""'); // Escape quotes
    return `${entry.systolic},${entry.diastolic},${entry.pulse},"${notes}",${entry.timestamp}`;
  }).join('\n');
  
  return header + rows;
}

// Clean old backups
async function cleanOldBackups() {
  try {
    const files = await fs.readdir(CONFIG.BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('bp-backup-') && (f.endsWith('.csv') || f.endsWith('.json')))
      .sort()
      .reverse();

    // Keep only the latest MAX_BACKUPS CSV and JSON files
    const csvFiles = backupFiles.filter(f => f.endsWith('.csv'));
    const jsonFiles = backupFiles.filter(f => f.endsWith('.json'));

    for (const file of csvFiles.slice(CONFIG.MAX_BACKUPS)) {
      await fs.unlink(path.join(CONFIG.BACKUP_DIR, file));
      console.log(`🗑️  Deleted old backup: ${file}`);
    }

    for (const file of jsonFiles.slice(CONFIG.MAX_BACKUPS)) {
      await fs.unlink(path.join(CONFIG.BACKUP_DIR, file));
      console.log(`🗑️  Deleted old backup: ${file}`);
    }
  } catch (error) {
    console.error('❌ Failed to clean old backups:', error.message);
  }
}

// Main backup function
async function backup() {
  console.log('🔄 Starting backup...\n');

  await ensureBackupDir();

  const data = await fetchData();
  console.log(`📊 Retrieved ${data.length} entries`);

  if (data.length === 0) {
    console.log('⚠️  No data to backup');
    return;
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const csvPath = path.join(CONFIG.BACKUP_DIR, `bp-backup-${timestamp}.csv`);
  const jsonPath = path.join(CONFIG.BACKUP_DIR, `bp-backup-${timestamp}.json`);

  // Save CSV
  await fs.writeFile(csvPath, toCSV(data), 'utf8');
  console.log(`✅ CSV backup saved: ${csvPath}`);

  // Save JSON
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ JSON backup saved: ${jsonPath}`);

  // Clean old backups
  await cleanOldBackups();

  console.log('\n✨ Backup complete!');
}

// Run backup
backup().catch(error => {
  console.error('❌ Backup failed:', error);
  process.exit(1);
});
