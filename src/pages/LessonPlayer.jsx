import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLessonById } from '../redux/slices/courseSlice';
import { fetchSentencesByLesson, clearSentences } from '../redux/slices/sentenceSlice'; 
import { Volume2, ChevronLeft, ChevronRight, ArrowLeft, Loader2, Play, Pause } from 'lucide-react';
import LessonSuccess from './LessonSuccess'; // Import the child component
import FeedbackSection from '../pages/FeedbackSection'; 

const LessonPlayer = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Data from Redux Slices
  const { currentLesson, lessons } = useSelector((state) => state.course);
  const { sentences, loading } = useSelector((state) => state.sentence);
  
  // Local States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false); // Should be false by default
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Initial Load & Cleanup
  useEffect(() => {
    if (id) {
      dispatch(fetchLessonById(id));
      dispatch(fetchSentencesByLesson(id));
      
      // Reset everything when moving to a new lesson
      setCurrentIndex(0);
      setIsFinished(false); 
      setIsAutoplay(false);
      setIsImageReady(false);
    }
    return () => {
      dispatch(clearSentences()); // Clear sentences when leaving the page
    };
  }, [id, dispatch]);

  // 2. Reset Image state on every sentence change
  useEffect(() => {
    setIsImageReady(false);
  }, [currentIndex]);

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

  // 3. Autoplay & Finish Logic
  useEffect(() => {
    if (!loading && sentences.length > 0 && !isFinished && isImageReady) {
      const sentence = sentences[currentIndex];

      playAudio(sentence.audio?.url).then(() => {
        if (isAutoplay && currentIndex < sentences.length - 1) {
          timerRef.current = setTimeout(() => handleNext(), 3000);
        } 
        else if (currentIndex === sentences.length - 1) {
          // If it's the last sentence, show success card after a short delay
          timerRef.current = setTimeout(() => setIsFinished(true), 2000);
        }
      });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [currentIndex, sentences.length, loading, isFinished, isAutoplay, isImageReady]);

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setIsAutoplay(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleGoToNextLesson = () => {
    const currentIdx = lessons.findIndex(l => l._id === id);
    const nextLesson = lessons[currentIdx + 1];
    if (nextLesson) {
      navigate(`/lesson/${nextLesson._id}`);
    } else {
      navigate('/lessons');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Loader2 className="animate-spin text-teal-500" size={32} />
    </div>
  );

  const currentSentence = sentences[currentIndex];
  const progress = sentences.length > 0 ? ((currentIndex + 1) / sentences.length) * 100 : 0;
  const isLastSentence = currentIndex === sentences.length - 1;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans border-t-4 border-teal-500 relative">
      
      {/* SUCCESS MODAL TRIGGER */}
      {isFinished && (
        <LessonSuccess 
          lessonId={id} 
          totalSentences={sentences.length}
          onClose={() => setIsFinished(false)} 
          onPracticeAgain={() => {
            setCurrentIndex(0);
            setIsFinished(false);
          }}
          onNextLesson={handleGoToNextLesson} 
        />
      )}

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5 shrink-0">
        <div className="bg-teal-500 h-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex flex-col items-center justify-center p-4 lg:p-10 h-[80vh]">
        <div className="w-full max-w-6xl h-full flex flex-col">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-4 px-2 shrink-0">
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-teal-600 transition-all">
              <ArrowLeft size={20} />
            </button>
            
            <button 
              onClick={() => setIsAutoplay(!isAutoplay)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                isAutoplay ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isAutoplay ? <Pause size={14} /> : <Play size={14} />}
              {isAutoplay ? 'AUTOPLAY ON' : 'AUTOPLAY OFF'}
            </button>

            <span className="text-xs font-bold text-teal-500 bg-teal-50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {sentences.length}
            </span>
          </div>

          {currentSentence ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center grow overflow-hidden">
              {/* Image Side */}
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
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isImageReady ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setIsImageReady(true)} 
                  />
                </div>
              </div>

              {/* Text & Control Side */}
              <div className="flex flex-col items-center lg:items-start justify-center gap-6 lg:gap-10 text-center lg:text-left">
                <div className="space-y-2 lg:space-y-6">
                  <span className="px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-xs font-black uppercase tracking-widest">Natural Learning</span>
                  <h2 className="text-2xl sm:text-4xl lg:text-7xl font-black text-slate-800 leading-tight">
                    {currentSentence.englishText} {/* Fixed: Use englishText from your Schema */}
                  </h2>
                  <p className="text-xl text-slate-400 font-bold">{currentSentence.tamilText}</p>
                </div>

                <div className="flex items-center gap-6 lg:gap-10">
                  <button disabled={currentIndex === 0} onClick={handlePrevious} className="p-3 lg:p-5 bg-white text-slate-300 rounded-2xl border border-slate-100 hover:text-teal-500">
                    <ChevronLeft size={32} />
                  </button>
                  
                  <button 
                    disabled={!isImageReady}
                    onClick={() => playAudio(currentSentence.audio?.url)} 
                    className={`w-16 h-16 lg:w-28 lg:h-28 rounded-3xl flex items-center justify-center shadow-xl transition-all group ${isImageReady ? 'bg-teal-500 hover:scale-110' : 'bg-slate-300 cursor-not-allowed'}`}
                  >
                    <Volume2 size={30} className="text-white group-hover:animate-pulse" />
                  </button>
                  
                  {!isLastSentence && (
                    <button onClick={handleNext} className="p-3 lg:p-5 bg-white text-teal-500 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                      <ChevronRight size={32} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-white border-t border-slate-100 py-10">
          <FeedbackSection />
      </div>
    </div>
  );
};

export default LessonPlayer;