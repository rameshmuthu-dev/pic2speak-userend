import React, { useEffect } from 'react';
import { useNavigate as useDomNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, RotateCcw, ListChecks, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { saveSubLessonProgress } from '../redux/slices/practiceSlice';
import Button from '../ui/Button';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const LessonSuccess = ({ lessonId, onNextLesson, onClose, totalSentences }) => {
  const navigate = useDomNavigate();
  const dispatch = useDispatch();
  const { subLessons } = useSelector((state) => state.course);
  const { width, height } = useWindowSize();

  const currentSubLesson = subLessons?.find(s => s._id === lessonId);

  useEffect(() => {
    if (lessonId) {
      dispatch(saveSubLessonProgress(lessonId));
    }
  }, [lessonId, dispatch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <Confetti 
        width={width} 
        height={height} 
        recycle={false} 
        numberOfPieces={400} 
        gravity={0.15} 
      />

      <div 
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>

        <div className="p-8 text-center mt-4">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Part Finished!</h2>

          <p className="text-slate-500 text-sm mt-3 font-medium">
            Great job on <span className="text-teal-600 font-bold uppercase">"{currentSubLesson?.title || "Practice Session"}"</span>
          </p>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <CheckCircle size={24} className="text-teal-500 mb-2 mx-auto" />
              <p className="text-xs uppercase font-bold text-slate-400">Status</p>
              <p className="text-sm font-black text-slate-700">Mastered</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <ListChecks size={24} className="text-blue-500 mb-2 mx-auto" />
              <p className="text-xs uppercase font-bold text-slate-400">Items</p>
              <p className="text-sm font-black text-slate-700">{totalSentences}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button onClick={onNextLesson} variant="primary" className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-teal-100 transition-transform active:scale-95 text-lg">
              Go to Next Part <ArrowRight size={20} />
            </Button>
            <button onClick={onClose} className="w-full py-2 flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors">
              <RotateCcw size={18} /> Practice Again
            </button>
            <div className="pt-4 border-t border-slate-50">
              <button onClick={() => navigate('/practice')} className="text-teal-600 font-black text-xs uppercase tracking-widest hover:underline">
                View Gallery
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonSuccess;