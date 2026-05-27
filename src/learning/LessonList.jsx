import React from 'react';

const LessonList = ({ lessons, onSelect }) => {
  const sortedLessons = [...lessons].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (sortedLessons.length === 0) {
    return (
      <p className="col-span-full text-center text-slate-400 font-bold italic py-10">
        No lessons found for this topic.
      </p>
    );
  }

  return (
    <>
      {sortedLessons.map((lesson) => {
        const imageUrl = typeof lesson.thumbnail === 'object' ? lesson.thumbnail?.url : lesson.thumbnail;

        return (
          <div
            key={lesson._id}
            onClick={() => onSelect(lesson._id)}
            className="relative group rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-2"
          >
            <div className="bg-white p-8 shadow-sm group-hover:shadow-xl transition-all border-b-8 border-teal-500 text-center h-full flex flex-col">
              <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={lesson.title} 
                    loading="lazy"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-6xl">📖</span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
                {lesson.title}
              </h3>
              {lesson.description && (
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default LessonList;