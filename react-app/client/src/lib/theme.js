import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tk-theme';

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function currentIsDark() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function applyDark(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
}

/**
 * Theme hook. Defaults to following the system setting; a manual toggle
 * stores an explicit preference. Keeps in sync with system changes while
 * the user has not overridden it.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(currentIsDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const next = mq.matches;
        applyDark(next);
        setIsDark(next);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next = !currentIsDark();
    applyDark(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    setIsDark(next);
  };

  return { isDark, toggle };
}

export { systemPrefersDark };
