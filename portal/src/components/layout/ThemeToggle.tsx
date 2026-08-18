'use client';

import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem('mouro-theme', theme);
}

export function ThemeToggle() {
  function toggleTheme() {
    const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Alternar entre tema claro e escuro"
      title="Alternar tema"
    >
      <Sun size={16} aria-hidden="true" className="theme-sun" />
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb" />
      </span>
      <Moon size={16} aria-hidden="true" className="theme-moon" />
    </button>
  );
}
