import { useState, useEffect } from 'react';
import { storage } from '../utils/helpers';

const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = storage.get('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      storage.set('theme', 'dark');
    } else {
      root.classList.remove('dark');
      storage.set('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return { isDark, toggleTheme };
};

export default useTheme;