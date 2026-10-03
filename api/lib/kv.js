import { promises as fs } from 'fs';
import { join } from 'path';
import { Redis } from '@upstash/redis';

const ENTRIES_KEY = 'bp-entries';

// Accept the standard Upstash env vars or the BP_-prefixed ones from the Vercel integration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.BP_KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.BP_KV_REST_API_TOKEN;

// Without Redis credentials (local development), entries live in bp-data.json
// and any other keys only in memory.
export const isLocal = !redisUrl;
const LOCAL_DATA_FILE = join(process.cwd(), 'bp-data.json');
const memory = new Map();

const redis = isLocal ? null : new Redis({ url: redisUrl, token: redisToken });

async function readLocalEntries() {
  try {
    return JSON.parse(await fs.readFile(LOCAL_DATA_FILE, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function getValue(key) {
  if (redis) return redis.get(key);
  return key === ENTRIES_KEY ? readLocalEntries() : memory.get(key) ?? null;
}

export async function setValue(key, value) {
  if (redis) return redis.set(key, value);
  if (key === ENTRIES_KEY) {
    return fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(value, null, 2), 'utf8');
  }
  memory.set(key, value);
}

// Errors propagate on purpose: treating a failed read as "no entries" and then
// saving would wipe the stored data.
export async function getEntries() {
  const entries = await getValue(ENTRIES_KEY);
  return Array.isArray(entries) ? entries : [];
}

export async function saveEntries(entries) {
  entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  await setValue(ENTRIES_KEY, entries);
}
