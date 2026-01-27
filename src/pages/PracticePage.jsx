import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { History, BookOpen, Loader2, ChevronRight, Layers } from 'lucide-react';
import { fetchPracticedSentences } from '../redux/slices/practiceSlice';
import Button from '../ui/Button';

const PracticePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { practicedSentences, loading } = useSelector((state) => state.practice);

  useEffect(() => {
    dispatch(fetchPracticedSentences());
  }, [dispatch]);

  const groupedData = practicedSentences?.reduce((acc, item) => {
    const lessonObj = item.sentence?.lessonId;
    const partId = lessonObj?._id;
    if (partId && !acc[partId]) {
      const rawTopic = lessonObj?.topic;
      const topicDisplayName = (typeof rawTopic === 'object' && rawTopic !== null) 
        ? rawTopic.name : (lessonObj?.title || "General Topic");
      acc[partId] = { 
        id: partId, 
        title: lessonObj?.title || "Mastered Lesson", 
        thumbnail: lessonObj?.thumbnail || null,
        level: lessonObj?.level || 'Beginner',
        displayLabel: `${topicDisplayName.toUpperCase()} • PART ${lessonObj?.partNumber || 1}`,
        count: 0 
      };
    }
    if (partId) acc[partId].count += 1;
    return acc;
  }, {});

  const practicedParts = Object.values(groupedData || {}).reverse();

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin text-teal-500 mb-4" size={40} />
      <p className="text-slate-500 font-bold italic">Loading Gallery...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-4 md:pt-10 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* FIXED RESPONSIVE HEADER: 
          - Reduced padding on mobile (p-4) to prevent text cutoff
          - Smaller title and icon on small screens
        */}
        <header className="bg-white border-b border-slate-100 p-4 md:p-12 rounded-xl md:rounded-3xl shadow-sm mb-6 md:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="bg-teal-500 p-2 rounded-xl w-fit">
              <History className="text-white w-5 h-5 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-4xl font-black text-slate-900 leading-tight">
                My <span className="text-teal-500">Practice</span> Gallery
              </h1>
              <p className="text-slate-500 text-[11px] md:text-base font-medium mt-1">
                Review your completed lessons.
              </p>
            </div>
          </div>
        </header>

        {practicedParts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-100">
             <BookOpen className="text-slate-200 mx-auto mb-4" size={48} />
             <p className="text-slate-400 font-bold text-sm">No mastered lessons yet.</p>
          </div>
        ) : (
          /* FIXED GRID: 
            - gap-4 on mobile for better spacing
          */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {practicedParts.map((part) => (
              <div 
                key={part.id} 
                onClick={() => navigate(`/practice/lesson/${part.id}`)}
                className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-slate-100 
                           hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {part.thumbnail?.url ? (
                    <img 
                      src={part.thumbnail.url} 
                      alt={part.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                  )}
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-teal-600 shadow-sm">
                    {part.level}
                  </div>
                </div>

                <div className="p-4 md:p-6 flex flex-col grow">
                  <div className="flex items-center gap-2 text-teal-500 mb-2">
                    <Layers size={12} />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">
                      {part.displayLabel}
                    </span>
                  </div>
                  
                  <h3 className="text-base md:text-xl font-black text-slate-800 mb-1">
                    {part.title}
                  </h3>
                  
                  <p className="text-slate-500 text-xs md:text-sm font-medium mb-4 grow">
                    Mastered <span className="text-teal-600 font-bold">{part.count} sentences</span>.
                  </p>

                  <Button 
                    variant="primary"
                    className="w-full py-2 md:py-3 rounded-lg md:rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation(); 
                      navigate(`/practice/lesson/${part.id}`);
                    }}
                  >
                  Keep Practicing
                    <ChevronRight size={16} />
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