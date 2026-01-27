import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchCategories, 
  fetchTopics, 
  fetchLessonsByTopic, 
  setActiveLevel 
} from '../redux/slices/courseSlice';
import { ArrowLeft } from 'lucide-react';
import LessonCard from '../ui/LessonCard';
// IMPORT: Adding the new Feedback component
import FeedbackSection from '../pages/FeedbackSection'; 

const Lessons = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  /**
   * Capturing level and ObjectIDs from the URL parameters.
   */
  const { level, categoryId, topicId } = useParams();
  
  // Accessing state from Redux store
  const { categories, topics, lessons, loading, activeLevel } = useSelector((state) => state.course);

  /**
   * Determining current view based on URL structure:
   * 1. categories (Root)
   * 2. topics (Inside a Category)
   * 3. parts (Final Lessons inside a Topic)
   */
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
        
        {/* HEADER SECTION */}
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

        {/* BACK BUTTON */}
        {step !== 'categories' && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-teal-600 font-bold mb-6 hover:translate-x-1 transition-all">
            <ArrowLeft size={20} /> Back
          </button>
        )}

        {loading && <p className="text-center text-teal-500 font-bold animate-pulse">Loading...</p>}

        {/* GRID SECTION: Displays Categories, Topics, or Lesson Parts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* STEP 1: CATEGORIES */}
          {step === 'categories' && categories.map((cat) => (
            <div key={cat._id} onClick={() => navigate(`/lessons/${level || 'all'}/${cat._id}`)} className="cursor-pointer group">
              <div className="bg-white rounded-3xl p-8 shadow-sm group-hover:shadow-xl transition-all border-b-8 border-teal-500 text-center">
                 <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                    {cat.thumbnail?.url ? (
                      <img src={cat.thumbnail.url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="text-6xl">📚</span>
                    )}
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 uppercase">{cat.name}</h3>
              </div>
            </div>
          ))}

          {/* STEP 2: TOPICS */}
          {step === 'topics' && topics.map((top) => (
            <div key={top._id} onClick={() => navigate(`/lessons/${level}/${categoryId}/${top._id}`)} className="cursor-pointer group">
              <div className="bg-white rounded-3xl p-8 shadow-sm group-hover:shadow-xl transition-all border-b-8 border-orange-400 text-center">
                 <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                    {top.thumbnail?.url ? (
                      <img src={top.thumbnail.url} alt={top.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <span className="text-6xl">📝</span>
                    )}
                 </div>
                 <h3 className="text-2xl font-black text-slate-800 uppercase">{top.name}</h3>
              </div>
            </div>
          ))}

          {/* STEP 3: LESSON PARTS */}
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

        {/* FEEDBACK SECTION: Placed at the bottom for easy user access */}
        <div className="mt-20 pt-10 border-t border-slate-200">
          <FeedbackSection />
        </div>

      </div>
    </div>
  );
};

export default Lessons;