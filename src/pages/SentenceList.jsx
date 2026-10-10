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

} from '../redux/slices/sceneContentSlice';

import {

  selectLessonProgressSummary,

  selectLessonProgressError,

  startLesson,

  completeScene,

} from '../redux/slices/lessonProgressSlice';

import LessonCompletionModal from '../ui/LessonCompletionModal';

import { useActiveLanguage, useLanguageOptions } from '../hooks/Useactivelanguage';

// Dynamic height class for single-screen view without scrolling

const VIEWPORT_HEIGHT = 'calc(100dvh - var(--shell-top-h, 0px) - var(--shell-bottom-h, 0px))';

const ProgressBar = ({ current, total }) => {

  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (

    <div className="flex items-center gap-2 sm:gap-3">

      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">

        Progress {pct}%

      </span>

      <div className="h-2 w-24 sm:w-48 bg-slate-200 rounded-full overflow-hidden shadow-inner">

        <div 

          className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"

          style={{ width: `${pct}%` }}

        />

      </div>

    </div>

  );

};

const AudioButton = ({ audioUrl }) => {

  const audioRef = useRef(null);

  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {

    if (!audioUrl) return;

    if (!audioRef.current) {

      audioRef.current = new Audio(audioUrl);

    }

    audioRef.current.src = audioUrl;

    audioRef.current.currentTime = 0;

    audioRef.current

      .play()

      .then(() => setPlaying(true))

      .catch(() => setPlaying(false));

    audioRef.current.onended = () => setPlaying(false);

  }, [audioUrl]);

  if (!audioUrl) {

    return (

      <div className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-100 opacity-40 cursor-not-allowed">

        <span className="text-lg sm:text-xl">🔇</span>

      </div>

    );

  }

  return (

    <button

      onClick={play}

      className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-emerald-50 border-2 border-emerald-300 hover:bg-emerald-100 transition-colors shadow-sm shrink-0"

      title="Listen"

    >

      <span className="text-lg sm:text-xl">{playing ? '🔊' : '🔉'}</span>

    </button>

  );

};

const SentenceList = () => {

  const { lessonMasterId } = useParams();

  const navigate = useNavigate();

  const dispatch = useDispatch();

  // Keep the sentence experience inside the available app viewport.
  // Restore the previous document styles when the user leaves this page.
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

  const isAdminBlocked = useSelector(selectSceneContentIsBlocked);

  const sentences = useSelector((state) => selectSentencesForLesson(state)) || [];

  const progressSummary = useSelector(selectLessonProgressSummary);

  const lessonSummary = (progressSummary || []).find((rec) => {

    const lmId = typeof rec.lessonMasterId === 'object'

      ? String(rec.lessonMasterId?._id)

      : String(rec.lessonMasterId);

    return lmId === String(lessonMasterId);

  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const [lessonTitle, setLessonTitle] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionRewards, setSessionRewards] = useState({ xpEarned: 0, coinsEarned: 0 });

  const progressError = useSelector(selectLessonProgressError);

  const actionStatus = useSelector((state) => state.lessonProgress?.actionStatus || 'idle');

  useEffect(() => {

    if (progressError && typeof progressError === 'string' && progressError.includes('previous lesson')) {

      alert("You must complete the previous lesson first!");

      navigate('/adventure-map');

    }

  }, [progressError, navigate]);

  useEffect(() => {

    if (languageId && lessonMasterId) {

      dispatch(fetchSceneContents({ lessonMasterId, languageId }));

    }

  }, [languageId, lessonMasterId, dispatch]);

  useEffect(() => {

    if (lessonSummary?.title) {

      setLessonTitle(lessonSummary.title);

    }

  }, [lessonSummary]);

  useEffect(() => {

    if (!lessonMasterId || !languageId) return;

    dispatch(startLesson({ lessonMasterId, languageId }));

  }, [lessonMasterId, languageId, dispatch]);

  const totalSentences = sentences.length;

  const current = sentences[currentIndex] || null;

  const isFirst = currentIndex === 0;

  const isLast = currentIndex === totalSentences - 1;

  const handleCompleteAndAdvance = useCallback(async () => {

    if (!current || !languageId) return;

    try {

      const resultAction = await dispatch(completeScene({

        lessonMasterId,

        languageId,

        sceneId: current.sceneId,

      }));

      if (completeScene.fulfilled.match(resultAction)) {
        const apiRewards = resultAction.payload?.rewards;
        if (apiRewards) {
          setSessionRewards({
            xpEarned: apiRewards.xpEarned || 0,
            coinsEarned: apiRewards.coinsEarned || 0
          });
        }

        if (isLast) {
            try {
              dispatch(fetchMyRewards());
              dispatch(fetchMyStats());
            } catch (e) {}

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

          } catch {}

          setIsModalOpen(true);

        } else {

          setCurrentIndex((i) => i + 1);

        }

      }

    } catch (error) {

      console.error("Failed to complete scene:", error);

    }

  }, [current, languageId, lessonMasterId, dispatch, isLast]);

  const handleNext = handleCompleteAndAdvance;

  const handlePrev = useCallback(() => {

    if (!isFirst) setCurrentIndex((i) => i - 1);

  }, [isFirst]);

  const repeatAudioRef = useRef(null);

  const handleRepeat = useCallback(() => {

    if (!current?.audioUrl) return;

    if (!repeatAudioRef.current) {

      repeatAudioRef.current = new Audio(current.audioUrl);

    }

    repeatAudioRef.current.src = current.audioUrl;

    repeatAudioRef.current.currentTime = 0;

    repeatAudioRef.current.play().catch(() => {});

  }, [current]);

  const displayTitle = lessonTitle || lessonSummary?.title || 'Lesson';

  if (sceneContentStatus === 'loading') {

    return (

      <div className="flex items-center justify-center bg-slate-50 overflow-hidden"
        style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}>

        <div className="text-center">

          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />

          <p className="text-slate-600 font-semibold text-xs">Loading sentences…</p>

        </div>

      </div>

    );

  }

  if (isAdminBlocked) {

    return (

      <div className="flex items-center justify-center bg-slate-50 p-4 overflow-hidden"
        style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}>

        <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-5 border border-amber-100">

          <span className="text-3xl block mb-2">🔒</span>

          <h2 className="text-base font-bold text-slate-800 mb-1">Sentence Data Unavailable</h2>

          <p className="text-slate-600 text-xs leading-relaxed mb-3">

            The sentence/scene content API is restricted to admin accounts.

          </p>

          <button

            onClick={() => navigate('/adventure-map')}

            className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors"

          >

            ← Back to Map

          </button>

        </div>

      </div>

    );

  }

  if (sceneContentStatus === 'succeeded' && totalSentences === 0) {

    return (

      <div className="flex items-center justify-center bg-slate-50 p-4 overflow-hidden"
        style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}>

        <div className="max-w-sm text-center bg-white rounded-2xl shadow-lg p-5">

          <span className="text-3xl block mb-2">📭</span>

          <h2 className="text-base font-bold text-slate-800 mb-1">No Sentences Yet</h2>

          <p className="text-slate-500 text-xs mb-4">

            No sentences available for this lesson in your selected language.

          </p>

          <button

            onClick={() => navigate('/adventure-map')}

            className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors"

          >

            ← Back to Map

          </button>

        </div>

      </div>

    );

  }

  return (

    <div className="flex flex-col w-full bg-slate-50 overflow-hidden min-h-0"
      style={{ height: VIEWPORT_HEIGHT, maxHeight: VIEWPORT_HEIGHT }}>

      {/* Top Header */}

      <header className="bg-white border-b border-slate-100 px-3 py-1.5 flex items-center gap-2 shrink-0">

        <button

          onClick={() => navigate('/adventure-map')}

          className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 text-xs font-bold"

          title="Back to Adventure Map"

        >

          ←

        </button>

        <div className="min-w-0 shrink-0">

          <h1 className="text-xs sm:text-sm font-black text-slate-800 truncate flex items-center gap-1">

            {displayTitle} 🏠

          </h1>

        </div>

        <div className="flex-1 flex justify-end">

          <ProgressBar

            current={totalSentences > 0 ? currentIndex + 1 : 0}

            total={totalSentences}

          />

        </div>

      </header>

      {/* Main Container - Absolute no scroll fit */}

      <main className="flex-1 flex flex-col justify-between p-1.5 sm:p-2 lg:p-3 min-h-0 overflow-hidden w-full">

        {current ? (

          <div className="w-full h-full flex flex-col justify-between min-h-0 gap-1.5">

            {/* Card Wrapper - Removes side padding completely on mobile to fill width */}

            <div className="flex-1 flex flex-col lg:flex-row bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-0 w-full">

              {/* Image Container - Full width, no left/right gaps, auto cover */}

              <div className="w-full lg:w-1/2 h-[45%] lg:h-full shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">

                {current.imageUrl ? (

                  <img

                    src={current.imageUrl}

                    alt="Scene"

                    className="w-full h-full object-cover"

                  />

                ) : (

                  <div className="flex flex-col items-center gap-1 p-2 text-slate-400">

                    <span className="text-3xl">🖼️</span>

                    <p className="text-[10px] font-medium">No image available</p>

                  </div>

                )}

              </div>

              {/* Text, Audio & Action Buttons - Bigger text sizes for Mobile & Desktop */}

              <div className="w-full lg:w-1/2 flex-1 flex flex-col justify-between p-2.5 sm:p-4 lg:p-8 min-h-0 gap-1">

                <div className="flex justify-end shrink-0">

                  <button className="text-slate-300 hover:text-red-400 transition-colors text-base sm:text-xl">♡</button>

                </div>

                {/* Sentence Text - Increased size for Mobile (text-sm -> text-base/lg) and Desktop (text-2xl -> text-3xl) */}

                <div className="text-base sm:text-xl lg:text-3xl font-black text-slate-800 leading-snug text-center lg:text-left overflow-hidden my-auto max-h-[80px]">

                  {current.sentence}

                </div>

                <div className="flex justify-center shrink-0 my-0.5">

                  <AudioButton audioUrl={current.audioUrl} />

                </div>

                <div className="flex gap-2 shrink-0">

                  <button

                    onClick={handleRepeat}

                    disabled={!current.audioUrl}

                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

                  >

                    <span className="text-xs sm:text-base">🎤</span>

                    <div className="text-left leading-none">

                      <p className="font-bold text-slate-700 text-xs sm:text-sm">Repeat</p>

                      <p className="text-[9px] text-slate-500 hidden sm:block">Speak sentence</p>

                    </div>

                  </button>

                  <button

                    onClick={() => {

                      if (current.audioUrl) {

                        const a = new Audio(current.audioUrl);

                        a.play().catch(() => {});

                      }

                    }}

                    disabled={!current.audioUrl}

                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"

                  >

                    <span className="text-xs sm:text-base">👂</span>

                    <div className="text-left leading-none">

                      <p className="font-bold text-slate-700 text-xs sm:text-sm">Listen</p>

                      <p className="text-[9px] text-slate-500 hidden sm:block">Hear sentence</p>

                    </div>

                  </button>

                </div>

              </div>

            </div>

            {/* Bottom Buttons */}

            <div className="flex items-center gap-2 shrink-0 w-full px-0.5">

              <button

                onClick={handlePrev}

                disabled={isFirst}

                className="flex items-center justify-center gap-1 px-3 py-2 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"

              >

                ← Previous

              </button>

              <button

                onClick={handleNext}

                disabled={actionStatus === 'loading'}

                className="flex-1 flex items-center justify-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"

              >

                <span>

                  {actionStatus === 'loading' && isLast ? 'Completing...' : (isLast ? '🎉 Finish Lesson' : 'Next Sentence ➔')}

                </span>

              </button>

            </div>

          </div>

        ) : (

          <div className="flex h-full items-center justify-center">

            <p className="text-slate-500 font-semibold text-xs">

              {sceneContentStatus === 'failed'

                ? 'Failed to load sentences. Please check the console for details.'

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

        onContinue={() => navigate('/adventure-map', { state: { completedLessonMasterId: lessonMasterId } })}

        onClose={() => setIsModalOpen(false)}

      />

    </div>

  );

};

export default SentenceList;





