export function toSeconds(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const m = v.trim().match(/^(\d+):(\d{1,2})(?:\.(\d+))?$/);
    if (m) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const frac = m[3] ? parseFloat('0.' + m[3]) : 0;
      return min * 60 + sec + frac;
    }
    const f = parseFloat(v);
    if (!isNaN(f)) return f;
  }
  return 0;
}