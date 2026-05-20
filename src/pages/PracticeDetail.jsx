import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Volume2, ChevronLeft, ChevronRight, ArrowLeft, Loader2, Play, Pause, Eye, EyeOff, Shuffle } from 'lucide-react';
import { fetchPracticedLessonSentences, clearCurrentSentences, saveLessonProgress } from '../redux/slices/practiceSlice';
import { completeLessonAction } from '../redux/slices/userSlice';
import LessonSuccess from './LessonSuccess';
import LessonImage from '../ui/LessonImage';

const PracticeDetail = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentLessonSentences, sentencesLoading: loading } = useSelector((state) => state.practice);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (lessonId) {
      dispatch(fetchPracticedLessonSentences(lessonId));
      setCurrentIndex(0);
      setShowText(false);
      setIsAutoplay(false);
      setIsFinished(false);
    }
    return () => dispatch(clearCurrentSentences());
  }, [dispatch, lessonId]);

  // ✅ Finish ஆனா progress + streak update
  useEffect(() => {
    if (isFinished && lessonId) {
      dispatch(saveLessonProgress(lessonId))
        .unwrap()
        .then(() => dispatch(completeLessonAction({ lessonId })))
        .catch((err) => console.error(err));
    }
  }, [isFinished, lessonId, dispatch]);

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
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play().catch(() => resolve());
        audio.onended = () => { audioRef.current = null; resolve(); };
      } else {
        resolve();
      }
    });
  };

  useEffect(() => {
    if (!loading && lessonSentences.length > 0 && currentSentence && !isFinished) {
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
  }, [currentIndex, isAutoplay, loading, lessonSentences, currentSentence, isFinished]);

  const handleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (currentIndex < lessonSentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowText(false);
    }
  };

  const handlePrevious = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsAutoplay(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowText(false);
    }
  };

  if (loading) return (
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

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans border-t-4 border-teal-500 overflow-hidden">

      {isFinished && (
        <LessonSuccess
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
        <div className="bg-teal-500 h-full transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-teal-600 transition-all p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => { setIsShuffle(!isShuffle); setCurrentIndex(0); }}
            className={`p-2 rounded-full transition-all ${isShuffle ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
            <Shuffle size={15} />
          </button>
          <button
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${isAutoplay ? 'bg-orange-500 text-white shadow-lg animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
            {isAutoplay ? <Pause size={12} /> : <Play size={12} />}
            {isAutoplay ? 'AUTOPLAY ON' : 'AUTOPLAY OFF'}
          </button>
        </div>
        <span className="text-xs font-bold text-teal-500 bg-teal-50 px-3 py-1 rounded-full">
          {currentIndex + 1} / {lessonSentences.length}
        </span>
      </div>

      <div className="flex flex-col lg:hidden flex-1 px-4 pb-4 overflow-hidden" style={{ gap: '12px' }}>
        <div className="rounded-2xl overflow-hidden shrink-0" style={{ height: '40%' }}>
          <LessonImage src={currentSentence?.image?.url} />
        </div>
        <div className="shrink-0">
          <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-xs font-black uppercase tracking-widest">
            Mastery Review
          </span>
        </div>
        <div className="shrink-0 flex items-center justify-center min-h-[60px]">
          {showText ? (
            <h2 className="text-xl font-black text-slate-800 leading-tight text-center">
              {currentSentence?.text}
            </h2>
          ) : (
            <div className="text-slate-300 italic text-base font-bold border-2 border-dashed border-slate-200 px-5 py-4 rounded-2xl w-full text-center">
              Sentence is hidden
            </div>
          )}
        </div>
        <div className="shrink-0 flex items-center justify-center gap-3 pb-2">
          <button disabled={currentIndex === 0} onClick={handlePrevious}
            className="p-3 bg-white text-slate-300 rounded-2xl shadow-sm border border-slate-100 hover:text-teal-500 transition-all disabled:opacity-40">
            <ChevronLeft size={22} />
          </button>
          <button onClick={() => playAudio(currentSentence?.audio?.url)}
            className="w-14 h-14 bg-teal-500 rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-all text-white">
            <Volume2 size={24} />
          </button>
          {isLastSentence ? (
            <button onClick={() => setIsFinished(true)}
              className="px-4 py-3 bg-teal-500 text-white rounded-2xl font-black text-sm shadow-md hover:scale-105 transition-all">
              Done ✓
            </button>
          ) : (
            <button onClick={handleNext}
              className="p-3 bg-white text-teal-500 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <ChevronRight size={22} />
            </button>
          )}
          <button onClick={() => setShowText(!showText)}
            className={`p-3 rounded-2xl border transition-all ${showText ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
            {showText ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 px-10 pb-10 gap-12 items-center overflow-hidden">
        <div className="flex-1 h-full max-h-[70vh] rounded-2xl overflow-hidden">
          <LessonImage src={currentSentence?.image?.url} />
        </div>
        <div className="flex-1 flex flex-col items-start justify-center gap-6">
          <span className="px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-xs font-black uppercase tracking-widest">
            Mastery Review
          </span>
          <div className="min-h-24 flex items-center">
            {showText ? (
              <h2 className="text-4xl lg:text-5xl font-black text-slate-800 leading-tight">
                {currentSentence?.text}
              </h2>
            ) : (
              <div className="text-slate-300 italic text-2xl font-bold border-2 border-dashed border-slate-200 p-8 rounded-2xl">
                Sentence is hidden
              </div>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button disabled={currentIndex === 0} onClick={handlePrevious}
              className="p-4 bg-white text-slate-300 rounded-2xl shadow-sm border border-slate-100 hover:text-teal-500 transition-all disabled:opacity-40">
              <ChevronLeft size={32} />
            </button>
            <button onClick={() => playAudio(currentSentence?.audio?.url)}
              className="w-28 h-28 bg-teal-500 rounded-3xl flex items-center justify-center shadow-xl hover:scale-110 transition-all text-white">
              <Volume2 size={30} />
            </button>
            {isLastSentence ? (
              <button onClick={() => setIsFinished(true)}
                className="px-6 py-4 bg-teal-500 text-white rounded-2xl font-black text-base shadow-md hover:scale-105 transition-all">
                Done ✓
              </button>
            ) : (
              <button onClick={handleNext}
                className="p-4 bg-white text-teal-500 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <ChevronRight size={32} />
              </button>
            )}
            <button onClick={() => setShowText(!showText)}
              className={`p-4 rounded-2xl border transition-all ${showText ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
              {showText ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PracticeDetail;