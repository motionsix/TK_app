// Maps the raw DB status to display text and tailwind classes (light + dark).
export function orderStatus(raw) {
  const st = (raw || '').trim().toLowerCase();
  if (st === 'approved') {
    return {
      text: 'มารับแล้ว',
      icon: 'bi-check-circle-fill',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    };
  }
  if (st === 'rejected') {
    return {
      text: 'ยกเลิก',
      icon: 'bi-x-circle-fill',
      className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    };
  }
  return {
    text: 'รอดำเนินการ',
    icon: 'bi-hourglass-split',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  };
}
