import React from 'react';
import { Lock, Trophy } from 'lucide-react';

const CategoryCard = ({ category, onClick }) => {
  return (
    <div 
      onClick={onClick} 
      className={`relative group rounded-3xl overflow-hidden transition-all duration-300 
        ${!category.isUnlocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:-translate-y-2'}`}
    >
      <div className={`bg-white p-8 shadow-sm group-hover:shadow-xl transition-all border-b-8 h-full flex flex-col
        ${!category.isUnlocked ? 'border-slate-300 grayscale' : 'border-teal-500'} text-center`}>
        
        {/* Lock icon logic */}
        {!category.isUnlocked && (
           <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] flex items-center justify-center z-10">
             <div className="bg-white/80 p-3 rounded-full shadow-lg">
               <Lock size={24} className="text-slate-600" />
             </div>
           </div>
        )}

        <div className="w-full h-48 bg-slate-100 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
          {category.thumbnail?.url ? (
            <img src={category.thumbnail.url} alt={category.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">📚</span>
          )}
        </div>
        
        <h3 className="text-2xl font-black text-slate-800 uppercase mb-2">{category.name}</h3>

        {/* Progress Logic */}
        {category.isUnlocked && category.progress ? (
           <div className="mt-auto pt-6 border-t border-slate-50">
             {/* ... progress bar code ... */}
           </div>
        ) : (
          !category.isUnlocked && (
            <div className="mt-auto pt-4 border-t">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter italic">Phase Locked</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default CategoryCard;