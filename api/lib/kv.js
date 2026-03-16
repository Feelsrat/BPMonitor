import { promises as fs } from 'fs';
import { join } from 'path';

// Local storage file for development
const LOCAL_DATA_FILE = join(process.cwd(), 'bp-data.json');

// Check if we're in local development (no Vercel KV env vars)
const isLocal = !process.env.KV_REST_API_URL;

// Local file-based storage functions
async function getDataLocal() {
  try {
    const fileContent = await fs.readFile(LOCAL_DATA_FILE, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // File doesn't exist yet
    }
    console.error('Error reading local data:', error);
    return [];
  }
}

async function saveDataLocal(data) {
  try {
    await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving local data:', error);
    return false;
  }
}

// KV utilities for data storage
export async function getData() {
  // Use local storage in development
  if (isLocal) {
    console.log('📁 Using local file storage (development mode)');
    return await getDataLocal();
  }

  // Use Vercel KV in production
  try {
    const { kv } = await import('@vercel/kv');
    const data = await kv.get('bp-entries') || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error reading from KV:', error);
    return [];
  }
}

export async function saveData(data) {
  // Sort data before saving
  const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Use local storage in development
  if (isLocal) {
    return await saveDataLocal(sortedData);
  }

  // Use Vercel KV in production
  try {
    const { kv } = await import('@vercel/kv');
    await kv.set('bp-entries', sortedData);
    return true;
  } catch (error) {
    console.error('Error saving to KV:', error);
    return false;
  }
}
