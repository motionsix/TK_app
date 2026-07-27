export function baht(value, decimals = 2) {
  const n = Number(value) || 0;
  return (
    '฿' +
    n.toLocaleString('th-TH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function formatDate(value) {
  if (!value) return '-';

  // SQLite CURRENT_TIMESTAMP returns "YYYY-MM-DD HH:MM:SS" in UTC but without a
  // timezone marker. Browsers parse that space-separated form as *local* time,
  // which shifts it by the user's offset. Force-interpret it as UTC.
  let d;
  if (typeof value === 'string' && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) {
    d = new Date(value.replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) d = new Date(value);
  } else {
    d = new Date(value);
  }

  return d.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
