import React from 'react';
import { Layers } from 'lucide-react';
import Button from '../ui/Button';

const LessonCard = ({ lesson, onStart }) => {
  return (
    <div 
      onClick={onStart || (() => {})}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col h-full"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {lesson?.thumbnail?.url ? (
          <img 
            src={lesson.thumbnail.url} 
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
        )}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-teal-600 shadow-sm">
          {lesson?.level || 'All'}
        </div>
      </div>

      <div className="p-6 flex flex-col grow">
        <div className="flex items-center gap-2 text-teal-500 mb-3">
          <Layers size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {lesson?.topic} • PART {lesson?.partNumber || 1}
          </span>
        </div>
        
        <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-teal-500 transition-colors">
          {lesson?.title}
        </h3>
        
        <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 grow">
          {lesson?.description}
        </p>

        <Button 
          variant="primary"
          onClick={(e) => {
            e.stopPropagation();
            if (onStart) onStart();
          }}
        >
          Start Learning
        </Button>
      </div>
    </div>
  );
};

export default LessonCard;