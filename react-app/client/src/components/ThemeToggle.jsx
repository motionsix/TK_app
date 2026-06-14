import { useTheme } from '../lib/theme';

/**
 * Light/dark switch. `variant="dark"` is for placement on dark surfaces
 * (the public header / admin sidebar); `variant="light"` for light surfaces.
 */
export default function ThemeToggle({ variant = 'light', className = '' }) {
  const { isDark, toggle } = useTheme();

  const base =
    'inline-flex h-9 w-9 items-center justify-center rounded-xl text-base transition focus-visible:outline-none focus-visible:ring-4';
  const styles =
    variant === 'dark'
      ? 'text-white/80 hover:bg-white/10 hover:text-brand-yellow focus-visible:ring-white/20'
      : 'border border-line bg-surface text-body hover:bg-surface-2 focus-visible:ring-brand-blue/20';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`${base} ${styles} ${className}`}
      aria-label={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
      title={isDark ? 'โหมดสว่าง' : 'โหมดมืด'}
    >
      <i className={`bi ${isDark ? 'bi-sun' : 'bi-moon-stars'}`} />
    </button>
  );
}
