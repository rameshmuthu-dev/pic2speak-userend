import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, ChevronRight } from 'lucide-react';
import { fetchPracticedGallery } from '../redux/slices/practiceSlice';
import Button from '../ui/Button';

const PracticePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { practicedGallery, loading, error } = useSelector((state) => state.practice);

  useEffect(() => {
    dispatch(fetchPracticedGallery());
  }, [dispatch]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-teal-500 mb-4" size={40} />
      <p className="text-slate-500 font-bold italic">Loading Gallery...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-red-500 font-bold">Error: {error}</p>
      <Button onClick={() => dispatch(fetchPracticedGallery())}>Retry</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-4 md:pt-10 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white border-b border-slate-100 p-4 md:p-12 rounded-xl md:rounded-3xl shadow-sm mb-6 md:mb-12">
          <h1 className="text-xl md:text-4xl font-black text-slate-900">
            My <span className="text-teal-500">Practice</span> Gallery
          </h1>
        </header>

        {(!practicedGallery || practicedGallery.length === 0) ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-100">
             <BookOpen className="text-slate-200 mx-auto mb-4" size={48} />
             <p className="text-slate-400 font-bold text-sm">No mastered lessons yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {practicedGallery.map((item) => (
              <div 
                key={item._id} 
                className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
                onClick={() => navigate(`/practice/lesson/${item.lesson?._id}`)}
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {item.lesson?.thumbnail?.url ? (
                    <img src={item.lesson.thumbnail.url} alt={item.lesson.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                  )}
                </div>

                <div className="p-4 md:p-6 flex flex-col grow">
                  <h3 className="text-base md:text-xl font-black text-slate-800 mb-1">
                    {item.lesson?.title || "Untitled Lesson"}
                  </h3>
                  <p className="text-slate-500 text-xs md:text-sm font-medium mb-4 grow">
                    Mastered <span className="text-teal-600 font-bold">{item.practiceCount || 0} times</span>.
                  </p>
                  <Button 
                    variant="primary"
                    className="w-full py-2"
                    onClick={(e) => { e.stopPropagation(); navigate(`/practice/lesson/${item.lesson?._id}`); }}
                  >
                    Keep Practicing <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;