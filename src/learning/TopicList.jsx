import React from 'react';

const TopicList = ({ topics, onSelect }) => {
  return (
    <>
      {topics.map((top) => {
        return (
          <div
            key={top._id}
            onClick={() => onSelect(top._id)}
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
    </>
  );
};

export default TopicList;