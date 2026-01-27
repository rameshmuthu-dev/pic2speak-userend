import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitFeedbackAction, resetFeedbackState } from '../redux/slices/feedbackSlice';
import Button from '../ui/Button'; 
import { Star, Trophy, Zap, BookOpen, Lightbulb } from 'lucide-react'; 
import { toast } from 'react-toastify'; 

const FeedbackSection = () => {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('Lesson Quality');
  const [comment, setComment] = useState('');
  
  const dispatch = useDispatch();
  const { isLoading, isSuccess, error } = useSelector((state) => state.feedback);
  const { user } = useSelector((state) => state.auth);
  const { sentences } = useSelector((state) => state.sentence);
  
  const currentLessonProgress = sentences?.length || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) {
      toast.warning("Please provide a rating and a comment!"); 
      return;
    }
    dispatch(submitFeedbackAction({ rating, category, comment }));
  };

  useEffect(() => {
    if (isSuccess) {
      // Success toast removed from here because it's already handled in the Slice
      setRating(0);
      setComment('');
      dispatch(resetFeedbackState());
    }
  }, [isSuccess, dispatch]);

  return (
    <div className="max-w-6xl mx-auto my-4 lg:my-6 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* LEFT SIDE: Session Mastery Summary */}
        <div className="lg:col-span-1 bg-teal-500 rounded-3xl p-6 text-white shadow-lg flex flex-col">
          
          <div className="text-center mb-6">
            <div className="bg-white bg-opacity-20 p-3 rounded-2xl w-fit mx-auto mb-3">
              <Trophy size={32} className="text-yellow-300" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Session Mastery</h2>
            <p className="text-teal-50 text-[11px] italic opacity-80 mt-2">
              "Don't study rules, just practice speaking naturally."
            </p>
          </div>

          {/* Stat Cards Stacked Vertically */}
          <div className="flex flex-col gap-4 mb-6">
            
            {/* Streak Card - Vertical Content */}
            <div className="bg-teal-600 p-5 rounded-2xl border border-teal-400 flex flex-col items-center text-center">
              <div className="bg-teal-500 p-2 rounded-lg mb-2">
                <Zap size={24} className="text-yellow-300 fill-yellow-300" />
              </div>
              <p className="text-[10px] uppercase font-bold text-teal-100 tracking-widest">Current Streak</p>
              <p className="text-xl font-black">{user?.streak || 0} Days</p> 
            </div>

            {/* Progress Card - Vertical Content */}
            <div className="bg-teal-600 p-5 rounded-2xl border border-teal-400 flex flex-col items-center text-center">
              <div className="bg-teal-500 p-2 rounded-lg mb-2">
                <BookOpen size={24} className="text-teal-100" />
              </div>
              <p className="text-[10px] uppercase font-bold text-teal-100 tracking-widest">Sentences Done</p>
              <p className="text-xl font-black">{currentLessonProgress} Completed</p> 
            </div>
          </div>

          {/* Tip Section */}
          <div className="mt-auto p-4 bg-[#006D5B] rounded-2xl border border-[#008F6F] flex flex-col items-center text-center gap-2">
            <Lightbulb size={20} className="text-yellow-300" />
            <p className="text-[10px] font-medium leading-relaxed">
              Speak out loud 3 times for better memory.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Feedback Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 lg:p-10 border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">How was the lesson? 🚀</h2>
            <p className="text-slate-400 text-sm font-medium">Your feedback helps us grow.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 grow flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Select */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent text-slate-700 font-bold text-sm outline-none">
                  <option>Lesson Quality</option>
                  <option>App Performance</option>
                  <option>New Feature</option>
                </select>
              </div>

              {/* Star Rating */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center items-center md:items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Rate Session</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)}
                      className={`transition-all ${rating >= star ? 'text-yellow-400 scale-110' : 'text-slate-200'}`}>
                      <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Area */}
            <div className="grow">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Your Comments</label>
              <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="What did you learn today?"
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 resize-none font-medium text-sm outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            {/* Submit Button */}
            <div className="w-full">
              <Button type="submit" variant="brand" disabled={isLoading} className="py-4">
                {isLoading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSection;