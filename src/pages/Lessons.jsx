import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchCategories, 
  fetchTopics, 
  fetchLessonsByTopic, 
  setActiveLevel 
} from '../redux/slices/courseSlice';
import { ArrowLeft, Lock, Trophy } from 'lucide-react'; 
import LessonCard from '../ui/LessonCard';
import FeedbackSection from '../pages/FeedbackSection'; 

const Lessons = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { level, categoryId, topicId } = useParams();
  const { categories, topics, lessons, loading, activeLevel } = useSelector((state) => state.course);

  // Determine current navigation view
  const step = !categoryId ? 'categories' : (!topicId ? 'topics' : 'parts');

  useEffect(() => {
    if (step === 'categories') {
      dispatch(fetchCategories(activeLevel));
    } else if (step === 'topics' && categoryId) {
      dispatch(fetchTopics(categoryId));
    } else if (step === 'parts' && topicId) {
      dispatch(fetchLessonsByTopic(topicId));
    }
  }, [dispatch, activeLevel, categoryId, topicId, step]);

  const handleLevelChange = (selectedLevel) => {
    dispatch(setActiveLevel(selectedLevel));
    navigate(`/lessons/${selectedLevel.toLowerCase() || 'all'}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100 pb-12 rounded-3xl shadow-sm mb-12">
          <div className="px-10 pt-10">
            <h1 className="text-4xl font-black text-slate-900 mb-6">
              Explore <span className="text-teal-500">Lessons</span>
            </h1>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => handleLevelChange(lvl === 'All' ? '' : lvl)}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                    (activeLevel === lvl || (lvl === 'All' && !activeLevel))
                    ? 'bg-teal-500 text-white shadow-lg' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Control */}
        {step !== 'categories' && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-teal-600 font-bold mb-6 hover:translate-x-1 transition-all">
            <ArrowLeft size={20} /> Back
          </button>
        )}

        {loading && <p className="text-center text-teal-500 font-bold animate-pulse">Loading...</p>}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* STEP 1: CATEGORIES (Locked based on Phase order) */}
          {step === 'categories' && categories.map((cat) => (
            <div 
              key={cat._id} 
              onClick={() => cat.isUnlocked && navigate(`/lessons/${level || 'all'}/${cat._id}`)} 
              className={`relative group rounded-3xl overflow-hidden transition-all duration-300 
                ${!cat.isUnlocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:-translate-y-2'}`}
            >
              <div className={`bg-white p-8 shadow-sm group-hover:shadow-xl transition-all border-b-8 h-full flex flex-col
                ${!cat.isUnlocked ? 'border-slate-300 grayscale' : 'border-teal-500'} text-center`}>
                  
                  {!cat.isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="bg-white/80 p-3 rounded-full shadow-lg">
                        <Lock size={24} className="text-slate-600" />
                      </div>
                    </div>
                  )}

                  <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                    {cat.thumbnail?.url ? (
                      <img src={cat.thumbnail.url} alt={cat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">📚</span>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 uppercase mb-2">{cat.name}</h3>

                  {/* Mastery Tracking */}
                  {cat.isUnlocked && cat.progress ? (
                    <div className="mt-auto pt-6 border-t border-slate-50">
                      <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery</span>
                        <span className="text-[10px] font-black text-teal-600">
                          {cat.progress.completedTopics} / {cat.progress.requiredTopics} Topics
                        </span>
                      </div>
                      
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, (cat.progress.completedTopics / cat.progress.requiredTopics) * 100)}%` }}
                        />
                      </div>

                      <div className="mt-3">
                        {cat.progress.completedTopics >= cat.progress.requiredTopics ? (
                          <div className="flex items-center justify-center gap-1 text-teal-500 font-black text-[9px] uppercase">
                            <Trophy size={10} /> Next Phase Unlocked
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-400 font-bold uppercase italic">
                            {cat.progress.requiredTopics - cat.progress.completedTopics} more topics to unlock next level
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    !cat.isUnlocked && (
                      <div className="mt-auto pt-4 border-t">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter italic">Phase Locked</p>
                      </div>
                    )
                  )}
              </div>
            </div>
          ))}

          {/* STEP 2: TOPICS (Unlocked once Category is accessed) */}
          {step === 'topics' && topics.map((top) => {
            // FIX: Ensure topics are accessible if the user is inside the category
            const isTopicOpen = true; 

            return (
              <div 
                key={top._id} 
                onClick={() => navigate(`/lessons/${level}/${categoryId}/${top._id}`)} 
                className="relative group rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-2"
              >
                <div className="bg-white p-8 shadow-sm group-hover:shadow-xl transition-all border-b-8 border-orange-400 text-center h-full flex flex-col">
                    <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                      {top.thumbnail?.url ? (
                        <img src={top.thumbnail.url} alt={top.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">📝</span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase">{top.name}</h3>
                </div>
              </div>
            );
          })}

          {/* STEP 3: LESSONS */}
          {step === 'parts' && (
            lessons.length > 0 ? (
              lessons.map((lesson) => (
                lesson?._id && <LessonCard key={lesson._id} lesson={lesson} />
              ))
            ) : (
              <p className="col-span-full text-center text-slate-400 font-bold italic py-10">
                No lessons found for this topic.
              </p>
            )
          )}
        </div>

        {/* Feedback Section */}
        <div className="mt-20 pt-10 border-t border-slate-200">
          <FeedbackSection />
        </div>

      </div>
    </div>
  );
};

export default Lessons;