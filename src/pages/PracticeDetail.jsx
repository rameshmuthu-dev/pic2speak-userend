import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Volume2, ChevronLeft, ChevronRight, ArrowLeft, 
  Loader2, Play, Pause, Eye, EyeOff, Shuffle 
} from 'lucide-react';
import { fetchPracticedSentences } from '../redux/slices/practiceSlice';
import LessonImage from '../ui/LessonImage'

const PracticeDetail = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { practicedSentences, loading } = useSelector((state) => state.practice);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchPracticedSentences());
  }, [dispatch]);

  const lessonSentences = useMemo(() => {
    let sentences = practicedSentences?.filter(
      (item) => item.sentence?.lessonId?._id === lessonId
    ) || [];
    if (isShuffle) {
      return [...sentences].sort(() => Math.random() - 0.5);
    }
    return sentences;
  }, [practicedSentences, lessonId, isShuffle]);

  const currentSentence = lessonSentences[currentIndex]?.sentence;
  const progress = lessonSentences.length > 0 ? ((currentIndex + 1) / lessonSentences.length) * 100 : 0;

  const playAudio = (url) => {
    return new Promise((resolve) => {
      if (url) {
        if (audioRef.current) audioRef.current.pause();
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
    if (!loading && lessonSentences.length > 0 && currentSentence) {
      playAudio(currentSentence.audio?.url).then(() => {
        if (isAutoplay && currentIndex < lessonSentences.length - 1) {
          timerRef.current = setTimeout(() => handleNext(), 3000);
        }
      });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [currentIndex, isAutoplay, loading]);

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans border-t-4 border-teal-500 relative">
      <div className="w-full bg-slate-200 h-1.5 shrink-0">
        <div className="bg-teal-500 h-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex flex-col items-center justify-center p-4 lg:p-10 h-[80vh]">
        <div className="w-full max-w-6xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-teal-600 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="flex gap-2">
              <button onClick={() => { setIsShuffle(!isShuffle); setCurrentIndex(0); }}
                className={`p-2 rounded-full transition-all ${isShuffle ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <Shuffle size={16} />
              </button>
              <button onClick={() => setIsAutoplay(!isAutoplay)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all ${isAutoplay ? 'bg-orange-500 text-white shadow-lg animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                {isAutoplay ? <Pause size={14} /> : <Play size={14} />}
                {isAutoplay ? 'AUTOPLAY ON' : 'AUTOPLAY OFF'}
              </button>
            </div>
            <span className="text-xs font-bold text-teal-500 bg-teal-50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {lessonSentences.length}
            </span>
          </div>

          {currentSentence ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center grow overflow-hidden">
              {/* USING THE REUSABLE IMAGE COMPONENT */}
              <LessonImage src={currentSentence.image?.url} />

              <div className="flex flex-col items-center lg:items-start justify-center gap-6 text-center lg:text-left">
                <div className="space-y-4">
                  <span className="px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-xs font-black uppercase tracking-widest">Mastery Review</span>
                  <div className="min-h-24 flex items-center">
                    {showText ? (
                      <h2 className="text-2xl sm:text-4xl lg:text-7xl font-black text-slate-800 leading-tight">
                        {currentSentence.text}
                      </h2>
                    ) : (
                      <div className="text-slate-300 italic text-2xl font-bold border-2 border-dashed border-slate-200 p-8 rounded-2xl">
                        Sentence is hidden
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button disabled={currentIndex === 0} onClick={handlePrevious} className="p-4 bg-white text-slate-300 rounded-2xl shadow-sm border border-slate-100 hover:text-teal-500 transition-all">
                    <ChevronLeft size={32} />
                  </button>
                  <button onClick={() => playAudio(currentSentence.audio?.url)} className="w-16 h-16 lg:w-28 lg:h-28 bg-teal-500 rounded-3xl flex items-center justify-center shadow-xl hover:scale-110 transition-all text-white">
                    <Volume2 size={30} />
                  </button>
                  <button onClick={handleNext} disabled={currentIndex === lessonSentences.length - 1} className="p-4 bg-white text-teal-500 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <ChevronRight size={32} />
                  </button>
                  <button onClick={() => setShowText(!showText)} className={`p-4 rounded-2xl border transition-all ${showText ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>
                    {showText ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PracticeDetail;