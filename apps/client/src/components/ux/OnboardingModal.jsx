import { useState } from 'react';
import { usePreferences } from '../../features/preferences/PreferencesContext';

const steps = [
  {
    title: 'Welcome to LearnDojoWorld',
    description: 'Track learning, revision, quizzes, and creator workflows from one focused dashboard.',
  },
  {
    title: 'Choose your learning energy',
    description: 'Use Calm mode for peaceful study or Dojo mode for mission-based training.',
  },
  {
    title: 'Use shortcuts',
    description: 'Press G then D for dashboard, G then R for roadmaps, and T to toggle theme.',
  },
];

function OnboardingModal() {
  const { preferences, completeOnboarding } = usePreferences();
  const [step, setStep] = useState(0);

  if (preferences.onboardingCompleted) return null;

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-4">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
            Step {step + 1}/{steps.length}
          </span>
          <button type="button" onClick={completeOnboarding} className="text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">
            Skip
          </button>
        </div>
        <h2 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">{currentStep.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{currentStep.description}</p>
        <div className="mt-6 flex justify-end gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((value) => value - 1)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (isLastStep ? completeOnboarding() : setStep((value) => value + 1))}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
          >
            {isLastStep ? 'Start learning' : 'Next'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default OnboardingModal;
