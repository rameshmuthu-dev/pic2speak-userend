import React from 'react';

const LessonImage = ({ src, alt = "Context", className = "" }) => {
  return (
    <div className={`flex justify-center items-center overflow-hidden h-full ${className}`}>
    
      <div className="bg-white rounded-3xl shadow-2xl border-4 lg:border-8 border-white overflow-hidden aspect-square max-h-64 sm:max-h-80 lg:max-h-full w-auto">
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover" 
        />
      </div>
    </div>
  );
};

export default LessonImage;