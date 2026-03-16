import { promises as fs } from 'fs';
import { join } from 'path';
import { Redis } from '@upstash/redis';

// Local storage file for development
const LOCAL_DATA_FILE = join(process.cwd(), 'bp-data.json');

// Check if we're in local development (check for any Redis env vars)
const isLocal = !(process.env.UPSTASH_REDIS_REST_URL || process.env.BP_KV_REST_API_URL);

// Get Redis client (lazy initialization)
function getRedisClient() {
  if (isLocal) return null;
  
  // Try standard Upstash env vars first, then fall back to BP_ prefixed vars
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.BP_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.BP_KV_REST_API_TOKEN;
  
  if (!url || !token) {
    console.error('❌ Redis credentials not found in environment variables');
    return null;
  }
  
  return new Redis({
    url,
    token,
  });
}

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

  // Use Upstash Redis in production
  try {
    const redis = getRedisClient();
    const data = await redis.get('bp-entries');
    console.log('📊 Retrieved from Redis:', data ? `${Array.isArray(data) ? data.length : 0} entries` : 'null');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error reading from Redis:', error);
    return [];
  }
}

export async function saveData(data) {
  // Sort data before saving
  const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Use local storage in development
  if (isLocal) {
    console.log('💾 Saving to local file:', sortedData.length, 'entries');
    return await saveDataLocal(sortedData);
  }

  // Use Upstash Redis in production
  try {
    const redis = getRedisClient();
    console.log('💾 Saving to Redis:', sortedData.length, 'entries');
    await redis.set('bp-entries', sortedData);
    console.log('✅ Successfully saved to Redis');
    return true;
  } catch (error) {
    console.error('❌ Error saving to Redis:', error);
    return false;
  }
}
