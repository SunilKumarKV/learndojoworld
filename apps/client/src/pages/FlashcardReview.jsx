import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../features/auth/AuthContext';
import { fetchFlashcardsDue, reviewFlashcard } from '../features/flashcards/flashcardsApi';

const REVIEW_BUTTONS = [
  { label: 'Easy', value: 'EASY', color: 'bg-emerald-50 text-emerald-800' },
  { label: 'Good', value: 'GOOD', color: 'bg-sky-50 text-sky-800' },
  { label: 'Hard', value: 'HARD', color: 'bg-amber-50 text-amber-800' },
  { label: 'Forgot', value: 'FORGOT', color: 'bg-rose-50 text-rose-800' },
];

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function FlashcardReview() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCards() {
      try {
        const data = await fetchFlashcardsDue(tokens.accessToken);
        if (isMounted) {
          setCards(data.flashcards);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || 'Unable to load flashcards');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCards();
    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken]);

  async function handleReview(grade) {
    const card = cards[selectedIndex];
    if (!card) {
      return;
    }

    setActionId(`${card.id}-${grade}`);
    setError('');

    try {
      await reviewFlashcard(tokens.accessToken, card.id, grade);
      const refreshed = await fetchFlashcardsDue(tokens.accessToken);
      setCards(refreshed.flashcards);
      setSelectedIndex(0);
      setShowBack(false);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to review flashcard');
    } finally {
      setActionId('');
    }
  }

  const currentCard = cards[selectedIndex];

  return (
    <AppLayout title="Flashcard review">
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading flashcards...</p>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !cards.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">No flashcards due</h2>
          <p className="mt-2 text-sm text-slate-600">
            You have no flashcards scheduled for review today.
          </p>
        </div>
      ) : null}

      {currentCard ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Flashcard due</p>
                <h1 className="text-2xl font-semibold text-slate-950">{currentCard.frontText}</h1>
              </div>
              <div className="text-sm text-slate-600">
                Next review: {formatDate(currentCard.nextReviewAt)}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Back</p>
              <p className="mt-3 whitespace-pre-line text-lg leading-8 text-slate-900">
                {showBack ? currentCard.backText : 'Tap "Show answer" to reveal.'}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowBack((value) => !value)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {showBack ? 'Hide answer' : 'Show answer'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => Math.min(prev + 1, cards.length - 1))}
                disabled={selectedIndex >= cards.length - 1}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next card
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">How was this answer?</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {REVIEW_BUTTONS.map((button) => (
                <button
                  key={button.value}
                  type="button"
                  disabled={actionId === `${currentCard.id}-${button.value}`}
                  onClick={() => handleReview(button.value)}
                  className={`rounded-md px-4 py-3 text-sm font-semibold transition ${button.color} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Revision queue</p>
                <p className="mt-1 text-sm text-slate-600">
                  {cards.length} flashcard{cards.length !== 1 ? 's' : ''} due today.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default FlashcardReview;
