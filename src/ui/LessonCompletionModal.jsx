import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Zap, Star, ArrowRight, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

/* Golden-orange coin with $ (same design as the sidebar / profile coin) */
const CoinIcon = ({ className = 'w-5 h-5', title = 'Coin' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`inline-block shrink-0 ${className}`}
    role="img"
    aria-label={title}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="11" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="8.2" fill="#FBBF24" stroke="#FDE68A" strokeWidth="1" />
    <path d="M6.2 9.2A6.4 6.4 0 0 1 11 5.7" fill="none" stroke="#FEF3C7" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
    <text
      x="12"
      y="16.4"
      textAnchor="middle"
      fontSize="12.5"
      fontWeight="800"
      fontFamily="Arial, Helvetica, sans-serif"
      fill="#B45309"
    >
      $
    </text>
  </svg>
);

/**
 * Resolve the amount actually granted for one reward type.
 * - number  -> use it as the granted amount
 * - false   -> nothing granted (0)
 * - undefined (older callers) -> fall back to xpEarned / coinsEarned
 */
const toAmount = (granted, earned) => {
  if (typeof granted === 'number') return Math.max(0, granted);
  if (granted === false) return 0;
  return Math.max(0, Number(earned) || 0);
};

/**
 * status:
 * - 'earned'  : amount > 0  -> show "+N"
 * - 'already' : amount is 0 -> show "Already collected" (no misleading "+0")
 */
const getRewardStatus = (granted, earned) => {
  const amount = toAmount(granted, earned);
  if (amount > 0) return { status: 'earned', amount };
  return { status: 'already', amount: 0 };
};

const LessonCompletionModal = ({
  isOpen,
  onClose,
  onContinue,
  lessonTitle = 'HOME',
  xpEarned = 0,
  coinsEarned = 0,
  xpGranted,
  coinsGranted,
  completedSentences = 1,
  totalSentences = 1,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#0d9488', '#2dd4bf', '#fbbf24', '#f472b6', '#3b82f6'],
        });
      } catch (e) {
        console.log('Confetti effect optional', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      if (onClose) onClose();
      navigate('/adventure-map');
    }
  };

  const xp = getRewardStatus(xpGranted, xpEarned);
  const coins = getRewardStatus(coinsGranted, coinsEarned);

  const xpIsEarned = xp.status === 'earned';
  const coinsIsEarned = coins.status === 'earned';
  const noRewardEarned = !xpIsEarned && !coinsIsEarned;

  const xpMain = xpIsEarned ? `+${xp.amount} XP` : 'Already collected';
  const coinsMain = coinsIsEarned ? `+${coins.amount}` : 'Already collected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6 animate-fade-in">
      {/* Outer Wrapper for Modal + Top Right Close Button */}
      <div className="relative w-full max-w-sm sm:max-w-md">

        {/* Floating Close Button at Top-Right Corner */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white text-slate-500 border border-slate-200 shadow-md hover:bg-slate-50 hover:scale-105 active:scale-95 transition"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Main Container (compact so it fits with top & bottom margin) */}
        <div className="bg-white rounded-[28px] p-4 sm:p-5 shadow-2xl text-center space-y-3 border border-slate-100 max-h-[calc(100dvh-3rem)] overflow-y-auto">

          {/* Top Success Badge */}
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-teal-100/60 border-4 border-teal-50/50">
              <div className="flex items-center justify-center w-11 h-11 rounded-full bg-teal-400 text-white shadow-lg shadow-teal-400/30">
                <Check className="w-7 h-7 stroke-[3.5]" />
              </div>
            </div>
          </div>

          {/* Header & Subtitle */}
          <div className="space-y-1">
            <span className="inline-block px-3.5 py-0.5 text-[10px] font-extrabold tracking-wider text-teal-500 bg-teal-50 rounded-full uppercase">
              {lessonTitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Lesson Completed!
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              Great job! 🎉 You've completed this lesson.
            </p>
          </div>

          {/* Reward Cards (XP & Coins Side-by-Side) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* XP Card */}
            <div className="flex items-center p-2.5 rounded-2xl bg-teal-50/60 border border-teal-100 shadow-sm space-x-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-400 text-white shadow-sm shrink-0">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left min-w-0">
                <div
                  className={
                    xpIsEarned
                      ? 'text-base sm:text-lg font-black text-amber-600 truncate'
                      : 'text-xs sm:text-sm font-black text-amber-600 leading-tight'
                  }
                >
                  {xpMain}
                </div>
                <div className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider">
                  {xpIsEarned ? 'XP Earned' : 'XP'}
                </div>
              </div>
            </div>

            {/* Coins Card */}
            <div className="flex items-center p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100 shadow-sm space-x-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 ring-1 ring-amber-200 shadow-sm shrink-0">
                <CoinIcon className="w-6 h-6" />
              </div>
              <div className="text-left min-w-0">
                <div
                  className={
                    coinsIsEarned
                      ? 'text-base sm:text-lg font-black text-amber-700 truncate'
                      : 'text-xs sm:text-sm font-black text-amber-700 leading-tight'
                  }
                >
                  {coinsMain}
                </div>
                <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                  {coinsIsEarned ? 'Coins Earned' : 'Coins'}
                </div>
              </div>
            </div>
          </div>

          {/* Info message when rewards were already collected */}
          {noRewardEarned && (
            <div className="flex items-start gap-2 rounded-2xl bg-sky-50 border border-sky-100 px-3 py-2 text-left">
              <Info className="w-4 h-4 mt-0.5 text-sky-500 shrink-0 stroke-[2.5]" />
              <p className="text-[11px] font-semibold text-sky-700 leading-snug">
                You've already collected the rewards for this lesson. Complete new lessons to earn more XP and coins!
              </p>
            </div>
          )}

          {/* Sentences Completed & Encouragement Unified Block */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-400 text-white shadow-sm">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-sm font-black text-slate-800">
                  {completedSentences} / {totalSentences}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                Sentences Completed
              </span>
            </div>

            <hr className="border-slate-200/60" />

            {/* Star Encouragement Row */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-teal-400 text-white shrink-0 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-800">
                  You're doing amazing!
                </h4>
                <p className="text-[11px] font-medium text-slate-400">
                  Keep learning, keep growing.
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white font-extrabold text-base shadow-lg shadow-teal-400/25 active:scale-[0.98] transition transform"
          >
            <span>Continue</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonCompletionModal;