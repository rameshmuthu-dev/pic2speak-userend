import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, RotateCcw, Layout, ListChecks, X, Flame } from 'lucide-react';
import { useSelector } from 'react-redux';
import Button from '../ui/Button';

const LessonSuccess = ({ onNextLesson, onPracticeAgain, onClose, totalSentences }) => {
  const navigate = useNavigate();

  // Get current lesson info from courseSlice
  const { currentLesson } = useSelector((state) => state.course);
  // Get updated streak and user data from userSlice
  const { user } = useSelector((state) => state.user);

  /**
   * Helper function to safely extract the Topic Name.
   */
  const getTopicName = () => {
    if (!currentLesson?.topic) return "General Topic";
    
    if (typeof currentLesson.topic === 'object' && currentLesson.topic !== null) {
      return currentLesson.topic.name || "General Topic";
    }
    return currentLesson.topic || "General Topic";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          {/* Streak Display - New Visual Added */}
          <div className="mb-4 inline-flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 animate-pulse"></div>
              <Flame size={48} className="text-orange-500 relative z-10" fill="currentColor" />
            </div>
            <p className="text-orange-600 font-black text-xl mt-1">
              {user?.streak || 0} Day Streak!
            </p>
          </div>

          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            Lesson Finished!
          </h2>

          <p className="text-slate-500 text-sm mt-2 font-medium">
            Great job on <span className="text-teal-600 font-bold uppercase">
              "{getTopicName()} • PART {currentLesson?.partNumber || 1}"
            </span>
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <CheckCircle size={20} className="text-teal-500 mb-1 mx-auto" />
              <p className="text-xs uppercase font-bold text-slate-400">Status</p>
              <p className="text-sm font-black text-slate-700">Mastered</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
              <ListChecks size={20} className="text-blue-500 mb-1 mx-auto" />
              <p className="text-xs uppercase font-bold text-slate-400">Items</p>
              <p className="text-sm font-black text-slate-700">{totalSentences}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={onNextLesson} 
              variant="primary" 
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-xl shadow-teal-100 transition-transform active:scale-95"
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