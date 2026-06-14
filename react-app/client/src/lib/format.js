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
  const d = new Date(value);
  return d.toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
