import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCategories, fetchTopics, fetchLessonsByTopic, setActiveLevel } from '../redux/slices/courseSlice';
import { ArrowLeft } from 'lucide-react';
import CategoryCard from '../components/CategoryCard';
import LessonCard from '../ui/LessonCard';
import FeedbackSection from '../pages/FeedbackSection';

const Lessons = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { level, categoryId, topicId } = useParams();
  const { categories, topics, lessons, loading, activeLevel } = useSelector((state) => state.course);

  const step = !categoryId ? 'categories' : (!topicId ? 'topics' : 'parts');

  useEffect(() => {
    const currentStep = !categoryId ? 'categories' : (!topicId ? 'topics' : 'parts');
    if (currentStep === 'categories') {
      dispatch(fetchCategories(activeLevel));
    } else if (currentStep === 'topics' && categoryId) {
      dispatch(fetchTopics(categoryId));
    } else if (currentStep === 'parts' && topicId) {
      dispatch(fetchLessonsByTopic(topicId));
    }
  }, [dispatch, activeLevel, categoryId, topicId]);

  const handleLevelChange = (selectedLevel) => {
    dispatch(setActiveLevel(selectedLevel));
    navigate(`/lessons/${selectedLevel.toLowerCase() || 'all'}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10 px-6">
      <div className="max-w-7xl mx-auto">
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

        {step !== 'categories' && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-teal-600 font-bold mb-6 hover:translate-x-1 transition-all">
            <ArrowLeft size={20} /> Back
          </button>
        )}

        {loading && <p className="text-center text-teal-500 font-bold animate-pulse">Loading...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {step === 'categories' && categories.map((cat) => (
            <CategoryCard
              key={cat._id}
              category={cat}
              onClick={() => cat.isUnlocked && navigate(`/lessons/${level || 'all'}/${cat._id}`)}
            />
          ))}

          {step === 'topics' && topics.map((top) => (
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
          ))}

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

        <div className="mt-20 pt-10 border-t border-slate-200">
          <FeedbackSection />
        </div>
      </div>
    </div>
  );
};

export default Lessons;