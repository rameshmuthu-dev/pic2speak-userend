import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '../redux/slices/lessonProgressSlice';

import LessonCompletionModal from '../ui/LessonCompletionModal';



import {
  startLesson,
  completeScene,
} from '../redux/slices/lessonProgressSlice';

import API from '../api/api';

const LANG_KEY = 'pic2speak_active_language';

const getActiveLanguage = () => {
  try {
    return localStorage.getItem(LANG_KEY) || 'en';
  } catch {
    return 'en';
  }
};

const ProgressBar = ({ current, total }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
        Progress {pct}%
      </span>
      <div className="h-3 w-64 bg-slate-200 rounded-full overflow-hidden shadow-inner">
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
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 opacity-40 cursor-not-allowed">
        <span className="text-2xl">🔇</span>
      </div>
    );
  }

  return (
    <button
      onClick={play}
      className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-300 hover:bg-emerald-100 transition-colors shadow-sm"
      title="Listen"
    >
      <span className="text-2xl">{playing ? '🔊' : '🔉'}</span>
    </button>
  );
};

const Sidebar = ({ user }) => {
  const navigate = useNavigate();

  const navItems = [
    { icon: '🗺️', label: 'Adventure Map', path: '/adventure-map' },
    { icon: '📅', label: 'Daily Challenge', path: '#' },
    { icon: '📊', label: 'My Progress', path: '#' },
    { icon: '📚', label: 'Vocabulary', path: '#' },
    { icon: '⭐', label: 'Favorites', path: '#' },
    { icon: '⚙️', label: 'Settings', path: '#' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-100 p-4 gap-4 overflow-y-auto">
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-emerald-600">P2S</span>
          <span className="font-black text-slate-800 text-lg">Pic2Speak</span>
        </div>
        <p className="text-xs text-slate-500">Learn English through Pictures</p>
      </div>

      {user && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl shrink-0">
            👤
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{user.name || 'User'}</p>
            <span className="inline-block text-[10px] font-bold text-white bg-emerald-500 rounded-full px-2 py-0.5">
              Level {user.level || 1}
            </span>
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1.5">
        {navItems.map((nav, i) => (
          <button
            key={i}
            onClick={() => navigate(nav.path)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 font-semibold rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-sm text-left"
          >
            <span>{nav.icon}</span>
            {nav.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-3 bg-amber-50 border border-amber-200 p-3 rounded-2xl">
        <span className="text-2xl">👑</span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-700">Go Premium</p>
          <p className="text-[11px] text-slate-500 leading-snug">Unlock all levels & more!</p>
        </div>
        <span className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs shrink-0">→</span>
      </div>
    </aside>
  );
};

const SentenceList = () => {
  const { lessonMasterId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeLanguage, setActiveLanguage] = useState(getActiveLanguage);

  const sceneContentStatus = useSelector(selectSceneContentStatus);
  const isAdminBlocked = useSelector(selectSceneContentIsBlocked);
  const sentences = useSelector(selectSentencesForLesson());

  const progressSummary = useSelector(selectLessonProgressSummary);
  const lessonSummary = progressSummary.find((rec) => {
    const lmId = typeof rec.lessonMasterId === 'object'
      ? String(rec.lessonMasterId?._id)
      : String(rec.lessonMasterId);
    return lmId === String(lessonMasterId);
  });

  const user = useSelector((state) => state.auth?.user || null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [languageDb, setLanguageDb] = useState({});
  const [lessonTitle, setLessonTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const progressError = useSelector(selectLessonProgressError);
  const actionStatus = useSelector((state) => state.lessonProgress?.actionStatus || 'idle');

  useEffect(() => {
    if (progressError && typeof progressError === 'string' && progressError.includes('previous lesson')) {
      alert("You must complete the previous lesson first!");
      navigate('/adventure-map');
    }
  }, [progressError, navigate]);

  useEffect(() => {
    API.get('/languages')
      .then((res) => {
        if (res.data.success || Array.isArray(res.data)) {
          const langs = res.data.data || res.data;
          const db = {};
          langs.forEach((l) => { db[l.code] = l; });
          setLanguageDb(db);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const langId = languageDb[activeLanguage]?._id;
    if (sceneContentStatus === 'idle' && langId && lessonMasterId) {
      dispatch(fetchSceneContents({ lessonMasterId, languageId: langId }));
    }
  }, [sceneContentStatus, languageDb, activeLanguage, lessonMasterId, dispatch]);

  useEffect(() => {
    if (lessonSummary?.title) {
      setLessonTitle(lessonSummary.title);
    }
  }, [lessonSummary]);

  useEffect(() => {
    if (!lessonMasterId) return;
    const langObj = languageDb[activeLanguage];
    const langId = langObj?._id;
    if (!langId) return;

    dispatch(startLesson({ lessonMasterId, languageId: langId }));
  }, [lessonMasterId, languageDb, activeLanguage, dispatch]);

  const totalSentences = sentences.length;
  const current = sentences[currentIndex] || null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSentences - 1;

  const handleCompleteAndAdvance = useCallback(async () => {
    if (!current) return;
    const langObj = languageDb[activeLanguage];
    const langId = langObj?._id;

    if (langId) {
      try {
        const resultAction = await dispatch(completeScene({
          lessonMasterId,
          languageId: langId,
          sceneId: current.sceneId,
        }));
        
        if (completeScene.fulfilled.match(resultAction)) {
          if (isLast) {
            // Persist the pending transition BEFORE showing the modal.
            // This survives browser Back, Refresh, and missed Continue clicks.
            try {
              const pendingTransition = {
                completedLessonMasterId: String(lessonMasterId),
                languageId: String(langId),
                createdAt: Date.now(),
              };
              localStorage.setItem(
                'pic2speak_pending_character_transition_v1',
                JSON.stringify(pendingTransition)
              );
            } catch { /* localStorage unavailable — graceful degradation */ }

            // Only open modal if completion was successful and it's the last scene
            setIsModalOpen(true);
          } else {
            setCurrentIndex((i) => i + 1);
          }
        }
      } catch (error) {
        console.error("Failed to complete scene:", error);
      }
    } else {
      if (!isLast) setCurrentIndex((i) => i + 1);
    }
  }, [current, languageDb, activeLanguage, lessonMasterId, dispatch, isLast]);

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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading sentences…</p>
        </div>
      </div>
    );
  }

  if (isAdminBlocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-8 border border-amber-100">
          <span className="text-5xl block mb-4">🔒</span>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Sentence Data Unavailable</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            The sentence/scene content API (<code className="bg-slate-100 px-1 rounded text-xs">/api/v1/scene-contents</code>)
            is currently restricted to admin accounts only.
          </p>
          <p className="text-slate-500 text-xs leading-relaxed mb-6">
            To enable this page, the backend needs to expose a user-accessible endpoint
            for scene contents (e.g., remove <code className="bg-slate-100 px-1 rounded">adminAuth</code> from GET /scene-contents
            or add a new user route).
          </p>
          <button
            onClick={() => navigate('/adventure-map')}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            ← Back to Map
          </button>
        </div>
      </div>
    );
  }

  if (sceneContentStatus === 'succeeded' && totalSentences === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-sm text-center bg-white rounded-2xl shadow-lg p-8">
          <span className="text-5xl block mb-4">📭</span>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Sentences Yet</h2>
          <p className="text-slate-500 text-sm mb-6">
            No sentences are available for this lesson in your selected language.
          </p>
          <button
            onClick={() => navigate('/adventure-map')}
            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            ← Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0">

        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 flex-wrap">
          <button
            onClick={() => navigate('/adventure-map')}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            title="Back to Adventure Map"
          >
            ←
          </button>

          <div className="min-w-0 shrink-0">
            <h1 className="text-base sm:text-lg font-black text-slate-800 truncate flex items-center gap-2">
              {displayTitle} 🏠
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 truncate hidden sm:block">
              Learn useful sentences about {displayTitle}
            </p>
          </div>

          <div className="flex-1 min-w-[140px]">
            <ProgressBar
              current={totalSentences > 0 ? currentIndex + 1 : 0}
              total={totalSentences}
            />
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6">
          {current ? (
            <div className="max-w-5xl mx-auto flex flex-col gap-3 lg:gap-6">

              <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                <div className="w-full lg:w-[420px] aspect-square shrink-0 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {current.imageUrl ? (
                    <img
                      src={current.imageUrl}
                      alt="Scene"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-8 text-slate-400">
                      <span className="text-6xl">🖼️</span>
                      <p className="text-sm font-medium">No image available</p>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-start lg:justify-center gap-3 lg:gap-6 p-4 lg:p-6">

                  <div className="flex justify-end">
                    <button className="text-slate-300 hover:text-red-400 transition-colors text-2xl">♡</button>
                  </div>

                  <div className="text-2xl lg:text-3xl font-black text-slate-800 leading-snug">
                    {current.sentence}
                  </div>

                  <div className="flex justify-center">
                    <AudioButton audioUrl={current.audioUrl} />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRepeat}
                      disabled={!current.audioUrl}
                      className="flex-1 flex items-center gap-3 px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">🎤</span>
                      <div className="text-left">
                        <p className="font-bold text-slate-700 text-sm">Repeat</p>
                        <p className="text-xs text-slate-500">Speak this sentence</p>
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
                      className="flex-1 flex items-center gap-3 px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="text-xl">👂</span>
                      <div className="text-left">
                        <p className="font-bold text-slate-700 text-sm">Listen</p>
                        <p className="text-xs text-slate-500">Hear this sentence</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrev}
                  disabled={isFirst}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <button
                  onClick={handleNext}
                  disabled={actionStatus === 'loading'}
                  className="flex-1 flex flex-col items-center justify-center py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    {actionStatus === 'loading' && isLast ? 'Completing...' : (isLast ? '🎉 Finish Lesson' : 'Next Sentence ➔')}
                  </span>
                  {!isLast && (
                    <span className="text-xs font-semibold text-emerald-200 mt-0.5">
                      Go to {currentIndex + 2} / {totalSentences}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <span className="text-yellow-400">💡</span>
                  <span>Tip: Listen to the sentence and try to speak it out loud.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                  <span>{currentIndex + 1} / {totalSentences}</span>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${totalSentences > 0 ? ((currentIndex + 1) / totalSentences) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-slate-500 font-semibold">
                {sceneContentStatus === 'failed'
                  ? 'Failed to load sentences. Please check the console for details.'
                  : 'Loading sentences…'}
              </p>
            </div>
          )}
        </main>
      </div>

      <LessonCompletionModal
        isOpen={isModalOpen}
        lessonTitle={displayTitle}
        completedScenes={totalSentences}
        totalScenes={totalSentences}
        onContinue={() => navigate('/adventure-map', { state: { completedLessonMasterId: lessonMasterId } })}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SentenceList;