import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('campuscare-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('campuscare-theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark(!isDark)}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-surface-2 border border-hairline text-[13px] font-medium text-ink hover:bg-surface hover:border-muted/40 transition-colors cursor-pointer select-none ${className}`}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <>
          <Moon className="w-4 h-4 text-accent" />
          <span className="font-mono text-[12px]">Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 text-accent" />
          <span className="font-mono text-[12px]">Light</span>
        </>
      )}
    </button>
  );
};
