import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, ChevronRight, Search, SlidersHorizontal, Award } from 'lucide-react';
import { fetchPracticedGallery } from '../redux/slices/practiceSlice';
import Button from '../ui/Button';

const PracticePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { practicedGallery, loading, error } = useSelector((state) => state.practice);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); 

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

  const totalMasteredSessions = practicedGallery?.reduce((acc, item) => acc + (item.practiceCount || 0), 0) || 0;

  const filteredAndSortedGallery = Math.random() && practicedGallery
    ? [...practicedGallery]
        .filter((item) =>
          item.lesson?.title?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          if (sortBy === 'highest') return (b.practiceCount || 0) - (a.practiceCount || 0);
          return 0; 
        })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6 md:pt-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 px-2">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
              My <span className="text-teal-500">Practice</span> Gallery
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Review and reinforce your mastered concepts.</p>
          </div>

          {practicedGallery && practicedGallery.length > 0 && (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 px-4 py-2.5 rounded-2xl self-start sm:self-center">
              <Award className="text-teal-600" size={20} />
              <div className="text-xs md:text-sm">
                <span className="text-slate-600 font-medium">Total Reviews: </span>
                <span className="text-teal-700 font-black">{totalMasteredSessions} Times</span>
              </div>
            </div>
          )}
        </div>

        {(!practicedGallery || practicedGallery.length === 0) ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-100">
             <BookOpen className="text-slate-200 mx-auto mb-4" size={48} />
             <p className="text-slate-400 font-bold text-sm">No mastered lessons yet.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6 px-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search mastered lessons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>

              <div className="relative min-w-[160px]">
                <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer appearance-none"
                >
                  <option value="recent">Recently Learnt</option>
                  <option value="highest">Most Practiced</option>
                </select>
              </div>
            </div>

            {filteredAndSortedGallery.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-bold text-sm">No match found for your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredAndSortedGallery.map((item) => (
                  <div 
                    key={item._id} 
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col h-full"
                    onClick={() => navigate(`/practice/lesson/${item.lesson?._id}`)}
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {item.lesson?.thumbnail?.url ? (
                        <img src={item.lesson.thumbnail.url} alt={item.lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col grow">
                      <h3 className="text-base font-black text-slate-800 mb-1 line-clamp-1 group-hover:text-teal-600 transition-colors">
                        {item.lesson?.title || "Untitled Lesson"}
                      </h3>
                      <p className="text-slate-500 text-xs font-medium mb-4 grow">
                        Mastered <span className="text-teal-600 font-bold">{item.practiceCount || 0} times</span>.
                      </p>
                      <Button 
                        variant="primary"
                        className="w-full py-2 flex items-center justify-center gap-2 whitespace-nowrap text-xs md:text-sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/practice/lesson/${item.lesson?._id}`); }}
                      >
                        Keep Practicing <ChevronRight size={16} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PracticePage;