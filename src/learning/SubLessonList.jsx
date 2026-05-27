import React from 'react';

const SubLessonList = ({ subLessons, onSelect, completedSubLessons = [] }) => {
  const sortedSubLessons = [...subLessons].sort((a, b) => a.order - b.order);

  return (
    <>
      {sortedSubLessons.map((sub) => {
        const isCompleted = completedSubLessons.includes(sub._id);

        return (
          <div
            key={sub._id}
            onClick={() => onSelect(sub._id)}
            className="relative group rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-2"
          >
            <div className="bg-white p-8 shadow-sm group-hover:shadow-xl transition-all border-b-8 border-teal-500 text-center h-full flex flex-col">
              <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
                {sub.thumbnail?.url ? (
                  <img 
                    src={sub.thumbnail.url} 
                    alt={sub.title} 
                    loading="lazy"
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-6xl">{isCompleted ? '✅' : '🎧'}</span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
                {sub.title}
              </h3>
              {sub.description && (
                <p className="text-sm text-slate-500 mt-2 font-medium">
                  {sub.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default SubLessonList;