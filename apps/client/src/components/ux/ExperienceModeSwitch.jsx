import { usePreferences } from '../../features/preferences/PreferencesContext';

function ExperienceModeSwitch() {
  const { preferences, setExperienceMode } = usePreferences();
  const modes = [
    { value: 'calm', label: 'Calm' },
    { value: 'dojo', label: 'Dojo' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5" aria-label="Experience mode switch">
      {modes.map((mode) => {
        const isActive = preferences.experienceMode === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => setExperienceMode(mode.value)}
            className={`rounded-xl px-3 py-1.5 text-sm font-black transition ${
              isActive
                ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

export default ExperienceModeSwitch;
