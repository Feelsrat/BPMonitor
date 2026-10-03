const LIMITS = {
  systolic: [40, 300],
  diastolic: [20, 200],
  pulse: [20, 250],
};

const toReading = (value, [min, max]) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
};

// Returns the normalized reading fields, or null if any of them is invalid.
// With `partial`, missing fields are skipped instead of rejected.
export function parseReading(body, { partial = false } = {}) {
  const reading = {};
  for (const [field, range] of Object.entries(LIMITS)) {
    if (partial && (body[field] === undefined || body[field] === '')) continue;
    const value = toReading(body[field], range);
    if (value === null) return null;
    reading[field] = value;
  }
  if (body.notes !== undefined) {
    reading.notes = body.notes == null ? '' : String(body.notes).trim();
  }
  return reading;
}

export function isValidTimestamp(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

// Integer ids, unique within the existing entries
export function idGenerator(entries) {
  let last = entries.reduce((max, e) => Math.max(max, Math.floor(Number(e.id)) || 0), Date.now());
  return () => ++last;
}

export const entryKey = (e) => `${Date.parse(e.timestamp)}-${e.systolic}-${e.diastolic}-${e.pulse}`;
