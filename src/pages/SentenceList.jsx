import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMyRewards } from '../redux/slices/rewardSlice';
import { fetchMyStats } from '../redux/slices/userProgressSlice';
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchSceneContents,
  selectSceneContentStatus,
  selectSceneContentIsBlocked,
  selectSentencesForLesson,
  selectSceneContentLessonMasterId,
  selectSceneContentLanguageId,
  clearSceneContents,
} from '../redux/slices/sceneContentSlice';

import {
  selectLessonProgressSummary,
  selectLessonProgressError,
  selectCurrentLessonProgress,
  startLesson,
  getLessonProgress,
  completeScene,
  clearCurrentProgress,
} from '../redux/slices/lessonProgressSlice';

import LessonCompletionModal from '../ui/LessonCompletionModal';
import { useActiveLanguage, useLanguageOptions } from '../hooks/Useactivelanguage';

const VIEWPORT_HEIGHT = 'calc(100dvh - var(--shell-top-h, 0px) - var(--shell-bottom-h, 0px))';

const ProgressBar = ({ current, total }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-indigo-200 font-medium whitespace-nowrap">
        Progress {pct}%
      </span>
      <div className="h-1.5 w-14 sm:w-24 bg-slate-800/80 rounded-full overflow-hidden border border-indigo-500/30 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.7)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const resolveId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const SentenceList = () => {
  const { lessonMasterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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

  const [activeLanguage] = useActiveLanguage();
  const languages = useLanguageOptions();

  const languageDb = useMemo(() => {
    const db = {};
    if (Array.isArray(languages)) {
      languages.forEach((lang) => {
        if (lang.code) db[lang.code] = lang;
      });
    }
    return db;
  }, [languages]);

  const selectedLanguage = activeLanguage || 'en';
  const languageId = languageDb[selectedLanguage]?._id || null;

  const sceneContentStatus = useSelector(selectSceneContentStatus);
  const sceneContentLessonId = useSelector(selectSceneContentLessonMasterId);
  const sceneContentLangId = useSelector(selectSceneContentLanguageId);
  const isAdminBlocked = useSelector(selectSceneContentIsBlocked);
  const sentences = useSelector((state) => selectSentencesForLesson(state)) || [];
  const progressSummary = useSelector(selectLessonProgressSummary);

  const currentProgress = useSelector(selectCurrentLessonProgress);
  const progressError = useSelector(selectLessonProgressError);
  const actionStatus = useSelector((state) => state.lessonProgress?.actionStatus || 'idle');

  const lessonSummary = useMemo(() => {
    return (progressSummary || []).find((rec) => {
      const lmId = typeof rec.lessonMasterId === 'object'
        ? String(rec.lessonMasterId?._id)
        : String(rec.lessonMasterId);
      return lmId === String(lessonMasterId);
    });
  }, [progressSummary, lessonMasterId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lessonTitle, setLessonTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionRewards, setSessionRewards] = useState({
    xpEarned: 0,
    coinsEarned: 0,
    xpGranted: false,
    coinsGranted: false,
  });
  const [playingAudio, setPlayingAudio] = useState(false);

  const submittingRef = useRef(false);
  const progressSyncedRef = useRef(false);
  const audioRef = useRef(null);

  const isContentReady = useMemo(() => {
    return (
      sceneContentStatus === 'succeeded' &&
      String(sceneContentLessonId) === String(lessonMasterId) &&
      String(sceneContentLangId) === String(languageId)
    );
  }, [sceneContentStatus, sceneContentLessonId, sceneContentLangId, lessonMasterId, languageId]);

  const isProgressReady = useMemo(() => {
    return (
      currentProgress !== null &&
      resolveId(currentProgress.lessonMasterId) === String(lessonMasterId) &&
      resolveId(currentProgress.languageId) === String(languageId)
    );
  }, [currentProgress, lessonMasterId, languageId]);

  useEffect(() => {
    if (
      progressError &&
      typeof progressError === 'string' &&
      progressError.includes('previous lesson')
    ) {
      alert('You must complete the previous lesson first!');
      navigate('/adventure-map');
    }
  }, [progressError, navigate]);

  useEffect(() => {
    if (lessonSummary?.title) {
      setLessonTitle(lessonSummary.title);
    }
  }, [lessonSummary]);

  useEffect(() => {
    progressSyncedRef.current = false;
    setCurrentIndex(0);
    dispatch(clearCurrentProgress());
    dispatch(clearSceneContents());
  }, [lessonMasterId, languageId, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearCurrentProgress());
      dispatch(clearSceneContents());
    };
  }, [dispatch]);

  useEffect(() => {
    if (languageId && lessonMasterId) {
      dispatch(fetchSceneContents({ lessonMasterId, languageId }));
    }
  }, [languageId, lessonMasterId, dispatch]);

  useEffect(() => {
    if (!lessonMasterId || !languageId) return;
    dispatch(startLesson({ lessonMasterId, languageId }));
  }, [lessonMasterId, languageId, dispatch]);

  useEffect(() => {
    if (progressSyncedRef.current) return;
    if (!isContentReady || !isProgressReady) return;

    if (currentProgress.status === 'completed') {
      progressSyncedRef.current = true;
      setIsModalOpen(true);
      return;
    }

    if (
      currentProgress.status === 'in_progress' &&
      currentProgress.currentSceneId
    ) {
      const backendSceneId = resolveId(currentProgress.currentSceneId);
      const idx = sentences.findIndex(
        (s) => resolveId(s.sceneId) === backendSceneId
      );
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
    progressSyncedRef.current = true;
  }, [isContentReady, isProgressReady, sentences, currentProgress]);

  const totalSentences = sentences.length;
  const current = sentences[currentIndex] || null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSentences - 1;

  const backendCurrentSceneId = useMemo(() => {
    return resolveId(currentProgress?.currentSceneId) || null;
  }, [currentProgress]);

  const backendCurrentIndex = useMemo(() => {
    if (!backendCurrentSceneId || !sentences.length) return -1;
    return sentences.findIndex(
      (s) => resolveId(s.sceneId) === backendCurrentSceneId
    );
  }, [backendCurrentSceneId, sentences]);

  const isAtBackendCurrent = useMemo(() => {
    if (!backendCurrentSceneId || !current) return false;
    return resolveId(current.sceneId) === backendCurrentSceneId;
  }, [backendCurrentSceneId, current]);

  const playAudio = useCallback((audioUrl) => {
    if (!audioUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    }
    audioRef.current.src = audioUrl;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setPlayingAudio(true))
      .catch(() => setPlayingAudio(false));
    audioRef.current.onended = () => setPlayingAudio(false);
  }, []);

  useEffect(() => {
    if (current?.audioUrl) {
      playAudio(current.audioUrl);
    }
  }, [currentIndex, current?.audioUrl, playAudio]);

  const handleCompleteAndAdvance = useCallback(async () => {
    if (submittingRef.current) return;
    if (!languageId) return;

    if (!isAtBackendCurrent) {
      if (backendCurrentIndex !== -1) {
        setCurrentIndex(backendCurrentIndex);
      }
      return;
    }

    if (!current) return;

    submittingRef.current = true;

    try {
      const resultAction = await dispatch(
        completeScene({
          lessonMasterId,
          languageId,
          sceneId: current.sceneId,
        })
      );

      if (completeScene.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        const apiRewards = payload?.rewards;

        if (apiRewards) {
          setSessionRewards({
            xpEarned: apiRewards.xpEarned || 0,
            coinsEarned: apiRewards.coinsEarned || 0,
            xpGranted: apiRewards.xpGranted === true,
            coinsGranted: apiRewards.coinsGranted === true,
          });
        }

        const lessonCompleted =
          payload?.rewards?.lessonCompleted ||
          payload?.progress?.status === 'completed';

        if (lessonCompleted || isLast) {
          try {
            dispatch(fetchMyRewards());
            dispatch(fetchMyStats());
          } catch (_e) {}

          try {
            const pendingTransition = {
              completedLessonMasterId: String(lessonMasterId),
              languageId: String(languageId),
              createdAt: Date.now(),
            };
            localStorage.setItem(
              'pic2speak_pending_character_transition_v1',
              JSON.stringify(pendingTransition)
            );
          } catch (_e) {}

          setIsModalOpen(true);
        } else {
          const nextSceneId = resolveId(payload?.progress?.currentSceneId);
          if (nextSceneId) {
            const nextIdx = sentences.findIndex(
              (s) => resolveId(s.sceneId) === nextSceneId
            );
            if (nextIdx !== -1) {
              setCurrentIndex(nextIdx);
            } else {
              setCurrentIndex((i) => Math.min(i + 1, totalSentences - 1));
            }
          } else {
            setCurrentIndex((i) => Math.min(i + 1, totalSentences - 1));
          }
        }
      } else {
        try {
          const freshProgressAction = await dispatch(
            getLessonProgress({ lessonMasterId, languageId })
          );
          if (getLessonProgress.fulfilled.match(freshProgressAction)) {
            const freshProgress = freshProgressAction.payload?.progress;
            if (freshProgress?.status === 'completed') {
              setIsModalOpen(true);
            } else if (freshProgress?.currentSceneId) {
              const freshSceneId = resolveId(freshProgress.currentSceneId);
              const freshIdx = sentences.findIndex(
                (s) => resolveId(s.sceneId) === freshSceneId
              );
              if (freshIdx !== -1) {
                setCurrentIndex(freshIdx);
              }
            }
          }
        } catch (_fetchErr) {}
      }
    } catch (_error) {
    } finally {
      submittingRef.current = false;
    }
  }, [
    current,
    languageId,
    lessonMasterId,
    dispatch,
    isLast,
    isAtBackendCurrent,
    backendCurrentIndex,
    sentences,
    totalSentences,
  ]);

  const handleNext = handleCompleteAndAdvance;

  const handlePrev = useCallback(() => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  }, [isFirst]);

  const displayTitle = lessonTitle || lessonSummary?.title || 'Lesson 1';

  if (isAdminBlocked) {
    return (
      <div
        className="flex items-center justify-center bg-[#0d0f1a] p-4 overflow-hidden text-white"
        style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}
      >
        <div className="max-w-md text-center bg-slate-900/90 rounded-2xl shadow-xl p-5 border border-amber-500/30">
          <span className="text-3xl block mb-2">🔒</span>
          <h2 className="text-base font-bold text-white mb-1">Sentence Data Unavailable</h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-3">
            The sentence/scene content API is restricted to admin accounts.
          </p>
          <button
            onClick={() => navigate('/adventure-map')}
            className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500 transition-colors"
          >
            ← Back to Map
          </button>
        </div>
      </div>
    );
  }

  if (sceneContentStatus === 'succeeded' && totalSentences === 0) {
    return (
      <div
        className="flex items-center justify-center bg-[#0d0f1a] p-4 overflow-hidden text-white"
        style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}
      >
        <div className="max-w-sm text-center bg-slate-900/90 rounded-2xl shadow-xl p-5 border border-slate-800">
          <span className="text-3xl block mb-2">📭</span>
          <h2 className="text-base font-bold text-white mb-1">No Sentences Yet</h2>
          <p className="text-slate-400 text-xs mb-4">
            No sentences available for this lesson in your selected language.
          </p>
          <button
            onClick={() => navigate('/adventure-map')}
            className="px-4 py-1.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-500 transition-colors"
          >
            ← Back to Map
          </button>
        </div>
      </div>
    );
  }

  if (
    sceneContentStatus === 'loading' ||
    !isContentReady ||
    !isProgressReady ||
    !progressSyncedRef.current
  ) {
    return (
      <div
        className="flex items-center justify-center bg-[#0d0f1a] overflow-hidden"
        style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-indigo-300 font-semibold text-xs">Loading lesson…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col w-full bg-[#0b0e1b] text-white overflow-hidden min-h-0 select-none"
      style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}
    >
      {/* Compact Top Header */}
      <header className="bg-[#121629]/90 backdrop-blur-md border-b border-indigo-950/50 px-2 py-1 flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => navigate('/adventure-map')}
          className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors shrink-0 text-[11px] font-bold text-slate-200 border border-slate-700/50"
          title="Back to Adventure Map"
        >
          ←
        </button>

        <div className="min-w-0 shrink-0 flex items-center gap-1">
          <span className="text-xs">📖</span>
          <h1 className="text-[11px] sm:text-xs font-bold text-slate-100 truncate max-w-[120px] sm:max-w-none">
            {displayTitle}
          </h1>
        </div>

        <div className="flex-1 flex justify-end">
          <ProgressBar
            current={totalSentences > 0 ? currentIndex + 1 : 0}
            total={totalSentences}
          />
        </div>
      </header>

      {/* Main Container - Scrollable on small screens for multi-line stories */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-2 lg:p-6 min-h-0 overflow-y-auto lg:overflow-hidden w-full max-w-7xl mx-auto gap-2 lg:gap-8">
        {current ? (
          <>
            {/* Image Container - Compact height for small screens */}
            <div className="relative w-full lg:w-1/2 aspect-video max-h-[24vh] sm:max-h-[30vh] lg:max-h-[72vh] rounded-xl shadow-lg border border-indigo-500/25 overflow-hidden bg-slate-950 shrink-0 flex items-center justify-center">
              {current.imageUrl ? (
                <img
                  src={current.imageUrl}
                  alt="Scene"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 p-2 text-slate-500">
                  <span className="text-2xl">🖼️</span>
                  <p className="text-[10px] font-medium">No image available</p>
                </div>
              )}
              <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-red-400 hover:bg-black/60 transition-all text-xs">
                ♡
              </button>
            </div>

            {/* Story / Sentence Content Area - Scaled for multi-line support */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between h-full max-w-xl mx-auto gap-1.5 py-1">
              <div className="hidden sm:flex justify-center lg:justify-start shrink-0">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-indigo-950/80 border border-indigo-500/40">
                  <span className="text-indigo-400 text-[10px]">✨</span>
                  <span className="text-[10px] font-bold tracking-wider text-indigo-200 uppercase">Speak & Learn</span>
                </div>
              </div>

              {/* Text Card with internal scroll support for 3-4 lines */}
              <div className="w-full bg-gradient-to-b from-[#151932]/90 to-[#101324]/90 rounded-xl border border-indigo-500/30 px-3 py-2 text-center shadow-lg relative overflow-y-auto max-h-[140px] shrink-0 flex items-center justify-center">
                <p className="text-xs sm:text-base lg:text-xl font-bold text-white tracking-wide leading-relaxed">
                  {current.sentence}
                </p>
              </div>

              {/* Compact Audio Wave & Play Button */}
              <div className="flex items-center justify-center gap-2 shrink-0 my-0.5">
                <div className="flex items-center gap-0.5 opacity-60 scale-90">
                  {[3, 6, 10, 6, 12, 16, 9, 4, 13, 7, 3].map((h, i) => (
                    <div
                      key={`w1-${i}`}
                      className="w-0.5 bg-indigo-400 rounded-full transition-all duration-300"
                      style={{ height: `${playingAudio ? Math.max(3, h * 1.3) : h}px` }}
                    />
                  ))}
                </div>

                <button
                  onClick={() => playAudio(current.audioUrl)}
                  disabled={!current.audioUrl}
                  className="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-teal-500 via-emerald-400 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Listen / Play Audio"
                >
                  <div className="absolute inset-0 rounded-full border border-white/40 animate-pulse pointer-events-none" />
                  <span className="text-lg sm:text-xl text-slate-950 font-black ml-0.5">▶</span>
                </button>

                <div className="flex items-center gap-0.5 opacity-60 scale-90">
                  {[7, 13, 4, 9, 16, 12, 6, 10, 6, 3, 9].map((h, i) => (
                    <div
                      key={`w2-${i}`}
                      className="w-0.5 bg-purple-400 rounded-full transition-all duration-300"
                      style={{ height: `${playingAudio ? Math.max(3, h * 1.3) : h}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Repeat & Listen Action Grid */}
              <div className="grid grid-cols-2 gap-2 shrink-0">
                <button
                  onClick={() => playAudio(current.audioUrl)}
                  disabled={!current.audioUrl}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-slate-900/90 to-indigo-950/80 border border-indigo-500/30 rounded-xl hover:border-indigo-400/60 transition-all shadow-sm disabled:opacity-40 group"
                >
                  <span className="text-sm">🎙️</span>
                  <div className="text-left leading-tight">
                    <p className="font-bold text-slate-100 text-xs group-hover:text-indigo-300 transition-colors">Repeat</p>
                  </div>
                </button>

                <button
                  onClick={() => playAudio(current.audioUrl)}
                  disabled={!current.audioUrl}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-slate-900/90 to-indigo-950/80 border border-indigo-500/30 rounded-xl hover:border-indigo-400/60 transition-all shadow-sm disabled:opacity-40 group"
                >
                  <span className="text-sm">🎧</span>
                  <div className="text-left leading-tight">
                    <p className="font-bold text-slate-100 text-xs group-hover:text-indigo-300 transition-colors">Listen</p>
                  </div>
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2 shrink-0 w-full pt-0.5">
                <button
                  onClick={handlePrev}
                  disabled={isFirst}
                  className="flex items-center justify-center px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-xl font-bold text-xs text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  ← Prev
                </button>

                <button
                  onClick={handleNext}
                  disabled={actionStatus === 'loading' || submittingRef.current}
                  className="flex-1 flex items-center justify-center py-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] disabled:opacity-50"
                >
                  <span>
                    {!isAtBackendCurrent && backendCurrentSceneId
                      ? 'Continue ➔'
                      : actionStatus === 'loading' && isLast
                      ? 'Completing...'
                      : isLast
                      ? '🎉 Finish >'
                      : 'Next Sentence ➔'}
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-indigo-300 font-semibold text-xs">
              {sceneContentStatus === 'failed'
                ? 'Failed to load sentences. Please try again.'
                : 'Loading sentences…'}
            </p>
          </div>
        )}
      </main>

      <LessonCompletionModal
        isOpen={isModalOpen}
        lessonTitle={displayTitle}
        completedSentences={totalSentences}
        totalSentences={totalSentences}
        xpEarned={sessionRewards.xpEarned}
        coinsEarned={sessionRewards.coinsEarned}
        xpGranted={sessionRewards.xpGranted}
        coinsGranted={sessionRewards.coinsGranted}
        onContinue={() => {
          setIsModalOpen(false);
          navigate('/adventure-map', { state: { completedLessonMasterId: lessonMasterId } });
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SentenceList;