import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, RotateCcw, Layout, ListChecks, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { saveLessonProgress } from '../redux/slices/practiceSlice';
import Button from '../ui/Button';

const LessonSuccess = ({ onNextLesson, onPracticeAgain, onClose, lessonTitle, totalSentences, lessonId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const syncData = async () => {
      if (lessonId) {
        try {
          // Saving progress in the background
          await dispatch(saveLessonProgress(lessonId)).unwrap();
        } catch (error) {
          // Only errors will be shown for debugging
          console.error("❌ Sync Error:", error);
        }
      }
    };
    syncData();
  }, [lessonId, dispatch]);

  return (
    /* Standard Tailwind 'z-50' used instead of 'z-[60]' */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4  bg-slate-900/60 backdrop:blur-sm">
      
      {/* Standard Tailwind 'max-w-xs' (320px) or 'max-w-sm' (384px) used instead of 'max-w-[340px]' */}
      <div 
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          <div className="mb-6 inline-flex bg-teal-50 p-5 rounded-full">
            <CheckCircle size={48} className="text-teal-500" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            Lesson Finished!
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Great job on <span className="text-teal-600 font-bold">"{lessonTitle}"</span>
          </p>

          <div className="grid grid-cols-2 gap-4 my-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <Layout size={20} className="text-teal-500 mb-1 mx-auto" />
              <p className="text-xs uppercase font-bold text-slate-400">Lesson</p>
              <p className="text-sm font-black text-slate-700">Done</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <ListChecks size={20} className="text-blue-500 mb-1 mx-auto" />
              <p className="text-xs uppercase font-bold text-slate-400">Items</p>
              <p className="text-sm font-black text-slate-700">{totalSentences}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={onNextLesson} 
              variant="primary" 
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-teal-100"
            >
              Go to Next Part
              <ArrowRight size={18} />
            </Button>
            
            <button 
              onClick={onPracticeAgain} 
              className="w-full py-2 flex items-center justify-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
            >
              <RotateCcw size={18} />
              Practice Again
            </button>

            <div className="pt-4 border-t border-slate-50">
              <button 
                onClick={() => navigate('/practice')}
                className="text-teal-600 font-black text-xs uppercase tracking-widest hover:underline"
              >
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