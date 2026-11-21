import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Flame, 
  Star,
  Check,
  ChevronRight,
  Lock
} from 'lucide-react';
import { 
  fetchLanguages, 
  fetchLessons, 
  fetchSentences, 
  fetchSentenceBuilderProgress, 
  saveSentenceBuilderProgress 
} from '../../../redux/slices/sentenceBuilderSlice';
import { useActiveLanguage } from '../../../hooks/Useactivelanguage';
import Loading from '../../../ui/Loading';

const getLessonOrder = (lesson, idx) => lesson.lessonOrder || lesson.order || idx + 1;

const isLessonLocked = (lesson, idx) => {
  if (getLessonOrder(lesson, idx) === 1) return false;
  if (lesson.isLocked === true || lesson.locked === true) return true;
  if (lesson.isUnlocked === false || lesson.unlocked === false) return true;
  if (lesson.status === 'locked') return true;
  return false;
};

const SentenceBuilder = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeLanguageCode] = useActiveLanguage();

  const { languages, lessons, sentences, currentSentenceIndex: reduxSentenceIndex, lessonsLoading, lessonsError, sentencesLoading, progressLoading } = useSelector(
    (state) => state.sentenceBuilder
  );

  const [view, setView] = useState(() => sessionStorage.getItem('sb_view') || 'lesson_picker');
  const [activeLessonId, setActiveLessonId] = useState(() => sessionStorage.getItem('sb_lesson_id'));
  const [languageId, setLanguageId] = useState(null);
  const [languageName, setLanguageName] = useState('');
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);

  const [wordBank, setWordBank] = useState([]);
  const [placedWords, setPlacedWords] = useState([]);
  const [validationState, setValidationState] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mobileHeight, setMobileHeight] = useState(null);
  const [lockedNotice, setLockedNotice] = useState(false);
  const audioRef = useRef(null);
  const rootRef = useRef(null);
  const lockedTimerRef = useRef(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyHeight = body.style.height;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.height = '100%';

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.height = previousBodyHeight;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (lockedTimerRef.current) clearTimeout(lockedTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const findBottomBarTop = (viewportHeight) => {
      let bottom = viewportHeight;
      document.querySelectorAll('nav').forEach((nav) => {
        let node = nav;
        let fixedNode = null;
        while (node && node !== document.body) {
          const position = window.getComputedStyle(node).position;
          if (position === 'fixed' || position === 'sticky') {
            fixedNode = node;
            break;
          }
          node = node.parentElement;
        }
        if (!fixedNode) return;
        const rect = fixedNode.getBoundingClientRect();
        if (rect.height > 0 && rect.top > viewportHeight / 2 && rect.top < bottom) {
          bottom = rect.top;
        }
      });
      return bottom;
    };

    const measure = () => {
      const el = rootRef.current;
      if (!el) return;
      if (window.innerWidth >= 1024) {
        setMobileHeight(null);
        return;
      }
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const bottom = findBottomBarTop(viewportHeight);
      const next = Math.floor(bottom - top);
      if (next > 200) setMobileHeight(next);
    };

    measure();
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 500);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    window.visualViewport?.addEventListener('resize', measure);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [view]);

  useEffect(() => {
    dispatch(fetchLanguages());
  }, [dispatch]);

  useEffect(() => {
    if (languages.length > 0) {
      const found = languages.find((l) => l.code === activeLanguageCode) || languages[0];
      if (found) {
        setLanguageId(found._id);
        setLanguageName(found.name || found.nativeName || activeLanguageCode);
      }
    }
  }, [languages, activeLanguageCode]);

  const loadLessons = useCallback(() => {
    if (!languageId) return;
    dispatch(fetchLessons(languageId));
  }, [dispatch, languageId]);

  useEffect(() => {
    if (languageId) {
      loadLessons();
    }
  }, [languageId, loadLessons]);

  useEffect(() => {
    if (view !== 'game' || !languageId || !activeLessonId) return;
    dispatch(fetchSentences({ masterId: activeLessonId, languageId }));
    dispatch(fetchSentenceBuilderProgress({ languageId, lessonMasterId: activeLessonId }));
  }, [view, languageId, activeLessonId, dispatch]);

  useEffect(() => {
    if (view !== 'game' || !activeLessonId || lessons.length === 0) return;
    const idx = lessons.findIndex((l) => (l.lessonMasterId || l._id) === activeLessonId);
    if (idx !== -1 && isLessonLocked(lessons[idx], idx)) {
      setView('lesson_picker');
      setActiveLessonId(null);
      sessionStorage.setItem('sb_view', 'lesson_picker');
      sessionStorage.removeItem('sb_lesson_id');
    }
  }, [view, activeLessonId, lessons]);

  useEffect(() => {
    setCurrentSentenceIndex(reduxSentenceIndex);
  }, [reduxSentenceIndex]);

  const showLockedNotice = () => {
    setLockedNotice(true);
    if (lockedTimerRef.current) clearTimeout(lockedTimerRef.current);
    lockedTimerRef.current = setTimeout(() => setLockedNotice(false), 2200);
  };

  const handleSelectLesson = (lesson, idx) => {
    if (isLessonLocked(lesson, idx)) {
      showLockedNotice();
      return;
    }

    const masterId = lesson.lessonMasterId || lesson._id;
    if (!masterId || !languageId) return;

    setIsGameOver(false);
    setScore(0);
    setStreak(0);
    setCurrentSentenceIndex(0);

    sessionStorage.setItem('sb_view', 'game');
    sessionStorage.setItem('sb_lesson_id', masterId);

    setActiveLessonId(masterId);
    setView('game');
  };

  const handleBackToPicker = () => {
    setView('lesson_picker');
    setActiveLessonId(null);
    sessionStorage.setItem('sb_view', 'lesson_picker');
    sessionStorage.removeItem('sb_lesson_id');
  };

  const currentSentence = sentences[currentSentenceIndex] || null;

  useEffect(() => {
    if (!currentSentence?.sentence) {
      setWordBank([]);
      setPlacedWords([]);
      setValidationState(null);
      return;
    }

    const rawWords = currentSentence.sentence.trim().split(/\s+/).filter(Boolean);
    const tokens = rawWords.map((word, idx) => ({
      id: `${idx}-${word}`,
      text: word,
    }));

    const shuffled = [...tokens];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setWordBank(shuffled);
    setPlacedWords([]);
    setValidationState(null);
  }, [currentSentenceIndex, currentSentence]);

  const handlePickWord = (wordObj) => {
    if (validationState === 'correct') return;
    setWordBank((prev) => prev.filter((w) => w.id !== wordObj.id));
    setPlacedWords((prev) => [...prev, wordObj]);
    setValidationState(null);
  };

  const handleRemoveWord = (wordObj) => {
    if (validationState === 'correct') return;
    setPlacedWords((prev) => prev.filter((w) => w.id !== wordObj.id));
    setWordBank((prev) => [...prev, wordObj]);
    setValidationState(null);
  };

  const handleResetWords = () => {
    if (validationState === 'correct') return;
    setWordBank((prev) => [...prev, ...placedWords]);
    setPlacedWords([]);
    setValidationState(null);
  };

  const playAudio = useCallback(() => {
    if (!currentSentence?.audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(currentSentence.audioUrl);
    } else {
      audioRef.current.src = currentSentence.audioUrl;
    }
    audioRef.current.currentTime = 0;
    setIsPlayingAudio(true);
    audioRef.current
      .play()
      .then(() => setIsPlayingAudio(true))
      .catch(() => setIsPlayingAudio(false));
    audioRef.current.onended = () => setIsPlayingAudio(false);
  }, [currentSentence?.audioUrl]);

  const cleanToken = (str) =>
    str ? str.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—]/g, '').trim().toLowerCase() : '';

  const handleCheckAnswer = () => {
    if (placedWords.length === 0 || validationState === 'correct') return;

    const userText = placedWords.map((w) => cleanToken(w.text)).join(' ');
    const targetText = currentSentence.sentence.trim().split(/\s+/).map(cleanToken).join(' ');

    if (userText === targetText) {
      setValidationState('correct');
      setScore((s) => s + 10);
      setStreak((st) => st + 1);

      playAudio();
      try {
        confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
      } catch {}

      if (languageId && activeLessonId) {
        const nextIdx = currentSentenceIndex < sentences.length - 1 ? currentSentenceIndex + 1 : currentSentenceIndex;
        dispatch(saveSentenceBuilderProgress({ languageId, lessonMasterId: activeLessonId, currentSentenceIndex: nextIdx }));
      }
    } else {
      setValidationState('incorrect');
      setStreak(0);
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      const nextIdx = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIdx);
      if (languageId && activeLessonId) {
        dispatch(saveSentenceBuilderProgress({ languageId, lessonMasterId: activeLessonId, currentSentenceIndex: nextIdx }));
      }
    } else {
      setIsGameOver(true);
      if (languageId && activeLessonId) {
        dispatch(saveSentenceBuilderProgress({ languageId, lessonMasterId: activeLessonId, currentSentenceIndex: 0 }));
      }
      try {
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });
      } catch {}
    }
  };

  return (
    <div
      ref={rootRef}
      className="w-full h-[calc(100dvh-136px)] lg:h-screen bg-[#0b0e1b] text-slate-100 flex flex-col overflow-hidden min-h-0 selection:bg-teal-500 selection:text-black"
      style={mobileHeight ? { height: mobileHeight, maxHeight: mobileHeight } : undefined}
    >
      {view === 'lesson_picker' && (
        <div className="flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto px-4 py-6 overflow-y-auto relative">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/play')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#121629] hover:bg-[#1a213b] border border-indigo-900/60 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Play Hub</span>
            </button>

            {languageName && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121629] border border-indigo-900/60 text-xs font-semibold text-slate-300">
                <span>🌐</span>
                <span className="text-teal-300 font-bold">{languageName}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Select a Lesson to <span className="text-teal-400">Build</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Choose any completed or unlocked lesson to practice assembling sentences.
            </p>
          </div>

          <AnimatePresence>
            {lockedNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0"
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Complete the previous lesson to unlock this one.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {lessonsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center flex-1">
              <Loading message="Fetching lesson library..." />
            </div>
          ) : lessonsError ? (
            <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/40 text-center my-auto">
              <p className="text-red-300 font-bold mb-3">{lessonsError}</p>
              <button
                onClick={loadLessons}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
              >
                Retry
              </button>
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#121629] border border-indigo-950 text-center my-auto">
              <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-bold text-base">No published lessons available</p>
              <p className="text-slate-500 text-xs mt-1">Please ensure lessons have published content in this language.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
              {lessons.map((lesson, idx) => {
                const orderNum = getLessonOrder(lesson, idx);
                const title = lesson.title || `Lesson ${orderNum}`;
                const locked = isLessonLocked(lesson, idx);
                const isCompleted = !locked && lesson.status === 'completed';

                return (
                  <motion.div
                    key={lesson.lessonMasterId || lesson._id || idx}
                    whileHover={locked ? undefined : { scale: 1.02 }}
                    whileTap={locked ? undefined : { scale: 0.98 }}
                    onClick={() => handleSelectLesson(lesson, idx)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 shadow-sm group ${
                      locked
                        ? 'bg-[#0e1224] border-slate-800/80 cursor-not-allowed opacity-60'
                        : 'bg-[#121629] hover:bg-[#181d36] border-indigo-900/50 hover:border-teal-500/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                          locked
                            ? 'bg-slate-900/80 border-slate-700/60 text-slate-500'
                            : 'bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border-teal-500/30 text-teal-300 group-hover:border-teal-400 group-hover:text-white'
                        }`}
                      >
                        {locked ? <Lock className="w-4 h-4" /> : orderNum}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm sm:text-base font-bold truncate transition-colors ${
                              locked ? 'text-slate-400' : 'text-white group-hover:text-teal-300'
                            }`}
                          >
                            {title}
                          </h4>
                          {isCompleted && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✓ Completed
                            </span>
                          )}
                          {locked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800/80 text-slate-400 border border-slate-700/60">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {locked
                            ? 'Complete the previous lesson to unlock'
                            : lesson.totalScenes
                            ? `${lesson.totalScenes} Sentences`
                            : 'Interactive Sentence Challenge'}
                        </p>
                      </div>
                    </div>

                    {locked ? (
                      <Lock className="w-5 h-5 text-slate-600 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === 'game' && (
        <div className="flex-1 min-h-0 flex flex-col max-w-7xl w-full mx-auto px-3 lg:px-4 py-1.5 lg:py-3 overflow-hidden justify-between">
          <div className="flex items-center justify-between gap-3 mb-1.5 lg:mb-3 shrink-0">
            <button
              onClick={handleBackToPicker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121629] hover:bg-[#1a213b] border border-indigo-900/60 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lessons</span>
            </button>

            <div className="flex-1 max-w-md mx-4">
              <div className="w-full bg-[#121629] rounded-full h-1.5 overflow-hidden border border-indigo-950">
                <div
                  className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{
                    width: sentences.length > 0 ? `${((currentSentenceIndex + 1) / sentences.length) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-amber-300 text-xs font-black">
                <Star className="w-3.5 h-3.5 fill-amber-300" />
                <span>{score} XP</span>
              </div>
              {streak > 1 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-950/60 border border-orange-700/50 text-orange-300 text-xs font-black animate-bounce">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                  <span>{streak}x</span>
                </div>
              )}
            </div>
          </div>

          {sentencesLoading || progressLoading ? (
            <div className="py-24 flex flex-col items-center justify-center flex-1">
              <Loading message="Loading sentence builder..." />
            </div>
          ) : isGameOver ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-10 rounded-3xl bg-gradient-to-b from-[#151a36] to-[#0c0f1f] border border-teal-500/40 text-center my-auto max-w-lg mx-auto shadow-2xl shrink-0"
            >
              <div className="w-20 h-20 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center mx-auto mb-4 text-4xl shadow-[0_0_25px_rgba(45,212,191,0.5)]">
                🏆
              </div>
              <h2 className="text-3xl font-black text-white">Lesson Completed!</h2>
              <p className="text-teal-300 font-bold text-sm mt-2">
                Great job! You arranged all sentences correctly.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto my-6">
                <div className="p-3 rounded-2xl bg-[#0b0e1b] border border-indigo-900">
                  <span className="text-xs text-slate-400 font-bold uppercase">Total XP</span>
                  <p className="text-2xl font-black text-amber-400 mt-1">+{score}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#0b0e1b] border border-indigo-900">
                  <span className="text-xs text-slate-400 font-bold uppercase">Sentences</span>
                  <p className="text-2xl font-black text-teal-300 mt-1">{sentences.length}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setCurrentSentenceIndex(0);
                    setScore(0);
                    setStreak(0);
                    setIsGameOver(false);
                    if (languageId && activeLessonId) {
                      dispatch(saveSentenceBuilderProgress({ languageId, lessonMasterId: activeLessonId, currentSentenceIndex: 0 }));
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-black text-xs shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  Play Again
                </button>
                <button
                  onClick={handleBackToPicker}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#121629] border border-indigo-900 text-slate-200 font-bold text-xs hover:bg-[#1a213b] transition-all cursor-pointer"
                >
                  Choose Another Lesson
                </button>
              </div>
            </motion.div>
          ) : currentSentence ? (
            <div className="flex-1 min-h-0 grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none lg:grid-cols-12 gap-2 lg:gap-6 items-center">
              <div className="lg:col-span-7 h-[22vh] lg:h-[68vh] max-h-[320px] lg:max-h-none flex items-center justify-center bg-[#121629]/50 rounded-xl lg:rounded-2xl p-1.5 lg:p-2 border border-indigo-900/40 shrink-0">
                <div className="relative w-full h-full lg:max-h-[62vh] rounded-lg lg:rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-lg">
                  {currentSentence.imageUrl ? (
                    <img
                      src={currentSentence.imageUrl}
                      alt="Scene Illustration"
                      className="w-full h-full object-cover lg:scale-[1.03] rounded-lg lg:rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <span className="text-3xl">🖼️</span>
                      <span className="text-xs mt-1">Scene Illustration</span>
                    </div>
                  )}

                  {currentSentence.audioUrl && (
                    <button
                      onClick={playAudio}
                      className={`absolute bottom-2 right-2 lg:bottom-2.5 lg:right-2.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-xl backdrop-blur-md border font-bold text-xs flex items-center gap-1.5 lg:gap-2 transition-all cursor-pointer shadow-lg ${
                        isPlayingAudio
                          ? 'bg-teal-500 text-slate-950 border-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.6)]'
                          : 'bg-black/60 text-teal-300 border-teal-500/40 hover:bg-black/80'
                      }`}
                    >
                      <Volume2 className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                      <span>{isPlayingAudio ? 'Playing...' : 'Listen Hint'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 h-full min-h-0 flex flex-col justify-between gap-2 lg:gap-3">
                <div
                  className={`w-full min-h-[64px] lg:min-h-[100px] p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 transition-all duration-300 flex flex-wrap items-center justify-center content-center gap-2 relative shadow-inner ${
                    validationState === 'correct'
                      ? 'bg-emerald-950/30 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : validationState === 'incorrect'
                      ? 'bg-red-950/30 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-shake'
                      : placedWords.length > 0
                      ? 'bg-[#121629] border-teal-500/40'
                      : 'bg-[#101324]/80 border-dashed border-indigo-900/60'
                  }`}
                >
                  {placedWords.length === 0 ? (
                    <p className="text-slate-500 text-sm font-semibold text-center select-none">
                      Tap the scrambled words below in the correct order
                    </p>
                  ) : (
                    placedWords.map((wordObj) => (
                      <motion.button
                        key={wordObj.id}
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        onClick={() => handleRemoveWord(wordObj)}
                        className="px-4 py-2.5 lg:px-3.5 lg:py-2 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-400/60 text-white font-bold text-base sm:text-sm shadow-sm hover:bg-red-950/40 hover:border-red-400 transition-all cursor-pointer"
                      >
                        {wordObj.text}
                      </motion.button>
                    ))
                  )}
                </div>

                <AnimatePresence>
                  {validationState === 'correct' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-2.5 lg:p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-sm lg:text-xs font-black flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>🎉 Perfect! Sentence constructed accurately!</span>
                    </motion.div>
                  )}
                  {validationState === 'incorrect' && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-2.5 lg:p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-sm lg:text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span>Not quite right. Tap words to remove or listen to hint.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-[#0e1224] border border-indigo-950/80 flex flex-wrap items-center justify-center gap-2.5 lg:gap-2 min-h-[90px] lg:min-h-[110px]">
                  {wordBank.map((wordObj) => (
                    <motion.button
                      key={wordObj.id}
                      layout
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePickWord(wordObj)}
                      className="px-5 py-3 lg:px-4 lg:py-2.5 rounded-xl bg-[#171d38] hover:bg-[#1f274a] border border-indigo-700/50 hover:border-cyan-400 text-slate-100 font-bold text-base sm:text-sm transition-all shadow-sm cursor-pointer select-none active:scale-95"
                    >
                      {wordObj.text}
                    </motion.button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 lg:gap-3 pt-0.5">
                  <button
                    onClick={handleResetWords}
                    disabled={placedWords.length === 0 || validationState === 'correct'}
                    className="px-4 lg:px-4 py-3.5 lg:py-3 rounded-xl bg-[#121629] border border-indigo-900/60 text-slate-300 hover:text-white hover:bg-[#1a213b] text-sm font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RotateCcw className="w-5 h-5 lg:w-4 lg:h-4" />
                    <span>Reset</span>
                  </button>

                  {validationState === 'correct' ? (
                    <button
                      onClick={handleNextSentence}
                      className="flex-1 py-3.5 lg:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-base sm:text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 hover:brightness-105"
                    >
                      <span>{currentSentenceIndex < sentences.length - 1 ? 'Next Sentence ➔' : 'Finish Lesson 🏆'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckAnswer}
                      disabled={placedWords.length === 0}
                      className="flex-1 py-3.5 lg:py-3 px-4 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 text-slate-950 font-black text-base sm:text-sm shadow-[0_0_15px_rgba(45,212,191,0.3)] flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                    >
                      <Check className="w-5 h-5 lg:w-4 lg:h-4 stroke-[3]" />
                      <span>Check Answer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#121629] border border-indigo-950 text-center my-auto">
              <p className="text-slate-300 font-bold">No sentences found in this lesson.</p>
              <button
                onClick={handleBackToPicker}
                className="mt-4 px-4 py-2 bg-teal-500 text-slate-950 rounded-xl text-xs font-bold"
              >
                Choose Another Lesson
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SentenceBuilder;