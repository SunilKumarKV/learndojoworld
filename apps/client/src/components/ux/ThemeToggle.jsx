import { usePreferences } from '../../features/preferences/PreferencesContext';

function ThemeToggle() {
  const { activeTheme, toggleTheme } = usePreferences();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-2xl border border-slate-200/70 bg-white/75 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
      aria-label="Toggle dark and light theme"
    >
      {activeTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}

export default ThemeToggle;
