import React, { useEffect, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCategories, fetchTopics, fetchLessonsByTopic, fetchSubLessonsByLesson } from '../redux/slices/courseSlice';
import { fetchUnlockStatus } from '../redux/slices/unlockSlice';
import { ArrowLeft } from 'lucide-react';

const FeedbackSection = lazy(() => import('../pages/FeedbackSection'));
const CategoryList = lazy(() => import('../learning/CategoryList'));
const TopicList = lazy(() => import('../learning/TopicList'));
const LessonList = lazy(() => import('../learning/LessonList'));
const SubLessonList = lazy(() => import('../learning/SubLessonList'));

const Lessons = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryId, topicId, lessonId } = useParams();
  
  const { categories, topics, lessons, subLessons, loading } = useSelector((state) => state.course);
  const { user } = useSelector((state) => state.user);

  const step = !categoryId ? 'categories' : (!topicId ? 'topics' : (!lessonId ? 'lessons' : 'sublessons'));

  useEffect(() => {
    dispatch(fetchUnlockStatus());
  }, [dispatch]);

  useEffect(() => {
    if (step === 'categories') {
      dispatch(fetchCategories());
    } else if (step === 'topics') {
      dispatch(fetchTopics(categoryId));
    } else if (step === 'lessons') {
      dispatch(fetchLessonsByTopic(topicId));
    } else if (step === 'sublessons') {
      dispatch(fetchSubLessonsByLesson(lessonId));
    }
  }, [dispatch, categoryId, topicId, lessonId, step]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black uppercase tracking-wider text-teal-600 mb-4">
            YOUR LEARNING JOURNEY
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
            <span className={step === 'categories' ? "text-teal-600 underline" : ""}>Phase</span>
            <span>➜</span>
            <span className={step === 'topics' ? "text-teal-600 underline" : ""}>Topic</span>
            <span>➜</span>
            <span className={step === 'lessons' ? "text-teal-600 underline" : ""}>Lesson</span>
            <span>➜</span>
            <span className={step === 'sublessons' ? "text-teal-600 underline" : ""}>Sub-Lesson</span>
          </div>
        </div>

        {step !== 'categories' && (
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-teal-600 font-bold mb-6 hover:translate-x-1 transition-all"
          >
            <ArrowLeft size={20} /> Back
          </button>
        )}

        {loading && <p className="text-center text-teal-500 font-bold animate-pulse">Loading...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Suspense fallback={<div className="col-span-full text-center text-teal-500 font-bold">Loading content...</div>}>
            {step === 'categories' && (
              <CategoryList categories={categories} onSelect={(id) => navigate(`/lessons/${id}`)} />
            )}
            {step === 'topics' && (
              <TopicList topics={topics} onSelect={(id) => navigate(`/lessons/${categoryId}/${id}`)} />
            )}
            {step === 'lessons' && (
              <LessonList 
                lessons={lessons} 
                onSelect={(id) => navigate(`/lessons/${categoryId}/${topicId}/${id}`)} 
              />
            )}
            {step === 'sublessons' && (
              <SubLessonList 
                subLessons={subLessons} 
                completedSubLessons={user?.completedLessons || []} 
                onSelect={(id) => navigate(`/sentence/${id}`)} 
              />
            )}
          </Suspense>
        </div>

        <div className="mt-20 pt-10 border-t border-slate-200">
          <Suspense fallback={<div className="text-center text-slate-400">Loading Feedback...</div>}>
            <FeedbackSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Lessons;