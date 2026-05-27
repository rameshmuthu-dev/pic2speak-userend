import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Volume2, ChevronLeft, ChevronRight, ArrowLeft, Loader2, Play, Pause, Eye, EyeOff, Shuffle } from 'lucide-react';
import { fetchPracticedLessonSentences, clearCurrentSentences, saveSubLessonProgress } from '../redux/slices/practiceSlice';
import LessonSuccess from './LessonSuccess';

const PracticeDetail = () => {
  const { subLessonId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentLessonSentences, sentencesLoading: loading } = useSelector((state) => state.practice);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (subLessonId && subLessonId !== 'undefined') {
      dispatch(fetchPracticedLessonSentences(subLessonId));
      setCurrentIndex(0);
      setShowText(false);
      setIsAutoplay(false);
      setIsFinished(false);
      setIsImageReady(false);
    }
    return () => {
      dispatch(clearCurrentSentences());
    };
  }, [dispatch, subLessonId]);

  useEffect(() => {
    if (isFinished && subLessonId && subLessonId !== 'undefined') {
      dispatch(saveSubLessonProgress(subLessonId))
        .catch((err) => console.error("Sync Error:", err));
    }
  }, [isFinished, subLessonId, dispatch]);

  useEffect(() => {
    setIsImageReady(false);
  }, [currentIndex]);

  const lessonSentences = useMemo(() => {
    if (!currentLessonSentences || currentLessonSentences.length === 0) return [];
    if (isShuffle) return [...currentLessonSentences].sort(() => Math.random() - 0.5);
    return currentLessonSentences;
  }, [currentLessonSentences, isShuffle]);

  const currentSentence = lessonSentences[currentIndex];
  const progress = lessonSentences.length > 0 ? ((currentIndex + 1) / lessonSentences.length) * 100 : 0;
  const isLastSentence = currentIndex === lessonSentences.length - 1;

  const playAudio = (url) => {
    return new Promise((resolve) => {
      if (url) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.onended = null;
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(() => resolve());
        audio.onended = () => {
          audioRef.current = null;
          resolve();
        };
      } else {
        resolve();
      }
    });
  };

  useEffect(() => {
    if (!loading && lessonSentences.length > 0 && currentSentence && !isFinished && isImageReady) {
      playAudio(currentSentence.audio?.url).then(() => {
        if (isAutoplay && currentIndex < lessonSentences.length - 1) {
          timerRef.current = setTimeout(() => handleNext(), 3000);
        } else if (isAutoplay && isLastSentence) {
          timerRef.current = setTimeout(() => setIsFinished(true), 2000);
        }
      });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [currentIndex, isAutoplay, loading, lessonSentences, currentSentence, isFinished, isImageReady]);

  const handleNext = () => {
    if (currentIndex < lessonSentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowText(false);
    } else if (currentIndex === lessonSentences.length - 1) {
      setIsFinished(true);
    }
  };

  const handlePrevious = () => {
    setIsAutoplay(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowText(false);
    }
  };

  if (loading && lessonSentences.length === 0) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="animate-spin text-teal-500" size={32} />
    </div>
  );

  if (!loading && lessonSentences.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
      <p className="text-slate-400 font-bold italic text-lg">No content found.</p>
      <button onClick={() => navigate(-1)} className="text-teal-500 font-bold underline">Go Back</button>
    </div>
  );

  const displayText = currentSentence?.englishText || currentSentence?.text || "";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans border-t-4 border-teal-500 relative">
      {isFinished && (
        <LessonSuccess
          lessonId={subLessonId}
          totalSentences={lessonSentences.length}
          onClose={() => setIsFinished(false)}
          onNextLesson={() => navigate('/practice')}
          onPracticeAgain={() => {
            setCurrentIndex(0);
            setShowText(false);
            setIsFinished(false);
          }}
        />
      )}
      <div className="w-full bg-slate-200 h-1.5 shrink-0">
        <div className="bg-teal-500 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="flex flex-col items-center justify-center p-4 lg:p-10 h-[80vh]">
        <div className="w-full max-w-6xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2 shrink-0">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-teal-600 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => { setIsShuffle(!isShuffle); setCurrentIndex(0); }}
                className={`p-2 rounded-full transition-all ${isShuffle ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Shuffle size={15} />
              </button>
              <button
                onClick={() => setIsAutoplay(!isAutoplay)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all ${isAutoplay ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}
              >
                {isAutoplay ? <Pause size={14} /> : <Play size={14} />}
                {isAutoplay ? 'AUTOPLAY ON' : 'AUTOPLAY OFF'}
              </button>
            </div>
            <span className="text-xs font-bold text-teal-500 bg-teal-50 px-3 py-1 rounded-full">
              {lessonSentences.length > 0 ? currentIndex + 1 : 0} / {lessonSentences.length}
            </span>
          </div>

          {currentSentence ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center grow overflow-hidden">
              <div className="flex justify-center items-center overflow-hidden h-full">
                <div className="bg-white rounded-3xl shadow-2xl border-4 lg:border-8 border-white overflow-hidden aspect-square max-h-64 sm:max-h-80 lg:max-h-full w-auto relative">
                  {!isImageReady && (
                    <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                      <Loader2 className="animate-spin text-slate-300" size={40} />
                    </div>
                  )}
                  <img
                    src={currentSentence.image?.url}
                    alt="Context"
                    loading="lazy"
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isImageReady ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsImageReady(true)}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center lg:items-start justify-center gap-6 lg:gap-10 text-center lg:text-left">
                <div className="space-y-2 lg:space-y-6 w-full max-w-xl">
                  <span className="px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-xs font-black uppercase tracking-widest">Review & Reinforce</span>
                  <div className="min-h-[80px] sm:min-h-[120px] lg:min-h-[160px] flex items-center justify-center lg:justify-start">
                    {showText ? (
                      <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-800 leading-tight break-words w-full">
                        {displayText}
                      </h2>
                    ) : (
                      <div className="text-slate-300 italic text-xl sm:text-2xl font-bold border-2 border-dashed border-slate-200 p-6 lg:p-8 rounded-2xl w-full text-center lg:text-left bg-slate-50/50">
                        Sentence is hidden
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-6">
                  <button disabled={currentIndex === 0} onClick={handlePrevious} className="p-3 lg:p-5 bg-white text-slate-300 rounded-2xl border border-slate-100 hover:text-teal-500 transition-colors disabled:opacity-50">
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    disabled={!isImageReady}
                    onClick={() => playAudio(currentSentence.audio?.url)}
                    className={`w-16 h-16 lg:w-28 lg:h-28 rounded-3xl flex items-center justify-center shadow-xl transition-all group ${isImageReady ? 'bg-teal-500 hover:scale-105 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}
                  >
                    <Volume2 size={30} className="text-white group-hover:animate-pulse" />
                  </button>
                  <button onClick={handleNext} className="p-3 lg:p-5 bg-white text-teal-500 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                    <ChevronRight size={32} />
                  </button>
                  <button onClick={() => setShowText(!showText)} className={`p-3 lg:p-5 rounded-2xl border transition-all ${showText ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                    {showText ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center grow text-slate-400">
              <p className="text-lg font-bold">No sentences found for this session.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeDetail;